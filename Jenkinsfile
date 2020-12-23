pipeline {

  agent {
    label 'graphdb-jenkins-node'
  }

  environment {
    CI = "true"
    NEXUS_CREDENTIALS = credentials('nexus-kim-user')
  }

  stages {

    stage('Install') {
      steps {
        sh "npm install -g wait-on"
      }
    }

    stage('Test') {
      steps {
        sh "npm run lint"
        sh "npm run lint:test"
        sh "npm run test:report"
      }
    }

    stage('Build') {
      steps {
        sh "npm run build"
      }
    }

}

