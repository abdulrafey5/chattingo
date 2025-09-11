pipeline {
  agent any

  environment {
    // Static / computed values
    VPS_HOST        = "72.60.192.150"
    DOCKERHUB_USER  = "abdulrafey5"
    FRONTEND_TAG    = "frontend-${env.BUILD_NUMBER}"
    BACKEND_TAG     = "backend-${env.BUILD_NUMBER}"

    // Secrets from Jenkins credentials (IDs must exist)
    MYSQL_ROOT_PASSWORD = credentials('MYSQL_ROOT_PASSWORD')
    MYSQL_DATABASE      = credentials('MYSQL_DATABASE')
    MYSQL_USER          = credentials('MYSQL_USER')
    MYSQL_PASSWORD      = credentials('MYSQL_PASSWORD')
    JWT_SECRET          = credentials('JWT_SECRET')

    // Non-secret or optional
    REACT_APP_API_URL   = "http://${VPS_HOST}"
    DOCKERHUB_CRED_ID   = 'dockerhub'
    SSH_CRED_ID         = 'hostinger-ssh'
  }

  stages {
    stage('Git Clone') {
      steps {
        echo "→ Checkout repository"
        checkout scm
        sh 'git --no-pager log -1 --oneline || true'
      }
    }

    stage('Image Build') {
      steps {
        echo "→ Build frontend and backend Docker images"
        dir('frontend') {
          sh "docker build -t ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} ."
        }
        dir('backend') {
          sh "docker build -t ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG} ."
        }
      }
    }

    stage('Filesystem Scan') {
      steps {
        echo "→ Filesystem security scan (optional: requires trivy or similar)."
        sh '''
          if docker run --rm aquasec/trivy:latest --version >/dev/null 2>&1; then
            docker run --rm -v "$(pwd)":/project aquasec/trivy:latest fs --exit-code 1 --severity CRITICAL,HIGH /project || true
          else
            echo "Trivy not available: skipping filesystem scan"
          fi
        '''
      }
    }

    stage('Image Scan') {
      steps {
        echo "→ Image vulnerability scan (optional: requires trivy)."
        sh '''
          if docker run --rm aquasec/trivy:latest --version >/dev/null 2>&1; then
            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity CRITICAL,HIGH ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} || true
            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity CRITICAL,HIGH ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG} || true
          else
            echo "Trivy not available: skipping image scan"
          fi
        '''
      }
    }

    stage('Push to Registry') {
      steps {
        echo "→ Push images to Docker Hub"
        withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CRED_ID}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            docker push ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG}
            docker push ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}
            docker logout
          '''
        }
      }
    }

    stage('Update Compose') {
      steps {
        echo "→ Prepare docker-compose.deploy.yml with new image tags"
        sh '''
          cp docker-compose.deploy.yml docker-compose.deploy.yml.tmp
          sed -i "s|${DOCKERHUB_USER}/chattingo-frontend:.*|${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG}|g" docker-compose.deploy.yml.tmp
          sed -i "s|${DOCKERHUB_USER}/chattingo-backend:.*|${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}|g" docker-compose.deploy.yml.tmp
          echo "----- docker-compose.deploy.yml.tmp -----"
          sed -n '1,200p' docker-compose.deploy.yml.tmp || true
        '''
      }
    }

    stage('Deploy') {
      steps {
        echo "→ Deploy to VPS (copy .env and docker-compose, pull & restart)"
        withCredentials([
          sshUserPrivateKey(credentialsId: 'hostinger-ssh', keyFileVariable: 'SSH_KEY'),
          usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')
        ]) {
          script {
            // create .env locally and scp to VPS
            sh """
              cat > .env.deploy <<EOF
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
JWT_SECRET=${JWT_SECRET}
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/${MYSQL_DATABASE}
SPRING_DATASOURCE_USERNAME=${MYSQL_USER}
SPRING_DATASOURCE_PASSWORD=${MYSQL_PASSWORD}
SPRING_PROFILES_ACTIVE=prod
REACT_APP_API_URL=${REACT_APP_API_URL}
BACKEND_TAG=${BACKEND_TAG}
FRONTEND_TAG=${FRONTEND_TAG}
EOF
            """

            // Ensure remote dir exists
            sh "ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@${VPS_HOST} 'mkdir -p /root/chattingo && chmod 700 /root/chattingo'"

            // Copy files
            sh "scp -i $SSH_KEY -o StrictHostKeyChecking=no .env.deploy root@${VPS_HOST}:/root/chattingo/.env"
            sh "scp -i $SSH_KEY -o StrictHostKeyChecking=no docker-compose.deploy.yml.tmp root@${VPS_HOST}:/root/chattingo/docker-compose.deploy.yml"

            // Pull & restart
            sh """
              ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@${VPS_HOST} '
                cd /root/chattingo &&
                DOCKERHUB_USER=$DOCKERHUB_USER docker compose -f docker-compose.deploy.yml pull &&
                DOCKERHUB_USER=$DOCKERHUB_USER docker compose -f docker-compose.deploy.yml up -d --remove-orphans
              '
            """

            // cleanup local helper file
            sh 'rm -f .env.deploy'
          }
        }
      }
    }
  }

  post {
    success { echo "✅ Pipeline finished successfully" }
    failure { echo "❌ Pipeline failed" }
    always { echo "Pipeline run complete (see console output for details)" }
  }
}

