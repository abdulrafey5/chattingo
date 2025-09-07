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
      steps { checkout scm }
    }

    stage('Build Images') {
      steps {
        sh "docker build -t ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} ./frontend"
        sh "docker build -t ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG} ./backend"
      }
    }

    stage('Security Scan') {
      steps {
        sh "docker run --rm aquasec/trivy:latest image ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG} || true"
        sh "docker run --rm aquasec/trivy:latest image ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG} || true"
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDS}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo $DH_PASS | docker login -u $DH_USER --password-stdin'
          sh "docker push ${DOCKERHUB_USER}/chattingo-frontend:${FRONTEND_TAG}"
          sh "docker push ${DOCKERHUB_USER}/chattingo-backend:${BACKEND_TAG}"
          sh "docker logout"
        }
      }
    }
  }
}

