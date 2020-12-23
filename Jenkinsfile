pipeline {

  agent {
    label 'graphdb-jenkins-node'
  }

  environment {
    CI = "true"
  }

  stages {
    stage('Install') {
      steps {
        sh "npm ci"
        sh "npm i wait-on"
      }
    }

    stage('Test') {
      steps {
        sh "npm run lint"
        sh "npm run lint:test"
        sh "npm run test:report"
        sh "npm run build"
        sh "npm run install:local"
      }
    }

    stage('Acceptance') {
      steps {
        sh "wait-on http://localhost:7200 -t 60000"
        sh "(cd test-e2e/ && npm install && npm link graphdb && npm run test)"
      }
    }
  }
}
