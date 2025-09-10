pipeline {
  agent any

  environment {
    DOCKERHUB_CREDS   = 'dockerhub'   
    DOCKERHUB_USER    = 'abdulrafey5'
    FRONTEND_TAG      = "frontend-${env.BUILD_NUMBER}"
    BACKEND_TAG       = "backend-${env.BUILD_NUMBER}"

    // IMPORTANT: set your VPS details here (or read from a Jenkins secret)
    REACT_APP_API_URL = "http://72.60.192.150"     // change to your VPS IP
    VPS_HOST          = "72.60.192.150"
    DEPLOY_PATH       = "/root/chattingo"         // path on VPS to copy docker-compose.yml
    SSH_CRED_ID       = "hostinger-ssh"           // create this SSH credential in Jenkins
  }

  stages {
    stage('Checkout') {
      steps {
        echo "📥 Checkout..."
        checkout scm
      }
    }

    stage('Build Images') {
      steps {
        echo "🐳 Building frontend (with REACT build-arg) and backend images..."
        sh """
          docker build --build-arg REACT_APP_API_URL=${REACT_APP_API_URL} -t ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} ./frontend
          docker build -t ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG} ./backend
        """
      }
    }

    stage('Filesystem Scan') {
      steps {
        echo "🔎 Trivy filesystem scan (secrets / infra checks) - non-failing by default"
        sh '''
          docker run --rm -v ${WORKSPACE}:/project aquasec/trivy:latest fs --exit-code 0 --no-progress /project || true
        '''
      }
    }

    stage('Image Scan') {
      steps {
        echo "🛡️ Trivy image scan (scans built images) - will mount docker socket"
        sh """
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --exit-code 0 --no-progress ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} || true
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --exit-code 0 --no-progress ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}  || true
        """
      }
    }

    stage('Push Images') {
      steps {
        echo "🚀 Pushing images to Docker Hub"
        withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            echo $DH_PASS | docker login -u $DH_USER --password-stdin
            docker push ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG}
            docker push ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}
            docker logout
          '''
        }
      }
    }

    // Optional: update a local copy of docker-compose to point to the new tags
    stage('Update Compose') {
      steps {
        echo "✏️ Updating docker-compose.deploy.yml with new image tags"
        sh '''
          cp docker-compose.yml docker-compose.deploy.yml || true
          # replace frontend and backend image tags (make sed patterns match your file formatting)
          sed -i "s|image: ${DOCKERHUB_USER}/chattingo-frontend:.*|image: ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG}|" docker-compose.deploy.yml || true
          sed -i "s|image: ${DOCKERHUB_USER}/chattingo-backend:.*|image: ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}|" docker-compose.deploy.yml || true
          echo "Updated docker-compose.deploy.yml:"
          cat docker-compose.deploy.yml
        '''
      }
    }

    // Optional: Deploy to Hostinger VPS (will use SSH credential SSH_CRED_ID)
    stage('Deploy') {
      steps {
        echo "🚢 Deploying to ${VPS_HOST}"
        sshagent (credentials: [SSH_CRED_ID]) {
          sh """
            scp -o StrictHostKeyChecking=no docker-compose.deploy.yml root@${VPS_HOST}:${DEPLOY_PATH}/docker-compose.yml
            ssh -o StrictHostKeyChecking=no root@${VPS_HOST} "cd ${DEPLOY_PATH} && docker compose pull && docker compose up -d --remove-orphans"
          """
        }
      }
    }
  }

  post {
    always {
      echo "📌 Pipeline finished"
    }
  }
}

