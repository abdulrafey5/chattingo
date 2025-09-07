pipeline {
  agent any

  environment {
    DOCKERHUB_CREDS = '41607bc4-aacd-446f-80c0-52cc0b92c07f'
    DOCKERHUB_USER  = 'abdulrafey5'
    FRONTEND_TAG    = "frontend-${env.BUILD_NUMBER}"
    BACKEND_TAG     = "backend-${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        echo "📥 Checking out source code from GitHub..."
        checkout scm
        echo "✅ Checkout complete."
      }
    }

    stage('Build Images') {
      steps {
        echo "🐳 Building Docker images..."
        sh "docker build -t ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} ./frontend"
        echo "✅ Frontend image built: ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG}"
        sh "docker build -t ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG} ./backend"
        echo "✅ Backend image built: ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}"
      }
    }

    stage('Security Scan') {
      steps {
        echo "🔍 Running Trivy security scan on images..."
        sh "docker run --rm aquasec/trivy:latest image ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} || true"
        echo "✅ Frontend scan complete."
        sh "docker run --rm aquasec/trivy:latest image ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG} || true"
        echo "✅ Backend scan complete."
      }
    }

    stage('Push Images') {
      steps {
        echo "🚀 Pushing Docker images to Docker Hub..."
        withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo $DH_PASS | docker login -u $DH_USER --password-stdin'
          sh "docker push ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG}"
          sh "docker push ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}"
          sh "docker logout"
        }
        echo "✅ Images pushed successfully to Docker Hub."
      }
    }
  }

  post {
    always {
      echo "📌 Pipeline finished (success or failure)."
    }
    success {
      echo "🎉 Pipeline completed successfully!"
    }
    failure {
      echo "❌ Pipeline failed. Please check the logs."
    }
  }
}

