pipeline {

  agent {
    label 'graphdb-jenkins-node'
  }

  tools {
    nodejs 'nodejs-14.17.0'
  }

  environment {
    CI = "true"
  }

  stages {
    stage('Prepare') {
      steps {
        sh "node --version"
        sh "docker-compose -f test-e2e/docker-compose.yml up -d"
      }
    }

    stage('Install') {
      steps {
        sh "npm ci"
      }
    }

    stage('Unit Test') {
      steps {
        sh "npm run lint"
        sh "npm run lint:test"
        sh "npm run test:report"
      }
    }

    stage('Acceptance Test') {
      steps {
        sh "npm run build"
        sh "sudo npm run install:local"
        sh "wait-on http://localhost:7200/protocol -t 60000"
        sh "(cd test-e2e/ && npm install && npm link graphdb && npm run test)"
      }
    }

    stage('Sonar') {
      steps {
        withSonarQubeEnv('SonarCloud') {
          sh "node sonar-project.js --branch='${env.ghprbSourceBranch}' --target-branch='${env.ghprbTargetBranch}' --pull-request-id='${env.ghprbPullId}'"
        }
      }
    }
  }

  post {
    always {
      dir("test-e2e/") {
        sh "docker logs graphd"
        sh "docker-compose down -v --remove-orphans --rmi=local || true"
      }
    }
  }
}
