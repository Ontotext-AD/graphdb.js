pipeline {

  agent {
    label 'graphdb-jenkins-node'
  }

// Doesn't work on Jenkins due to some errors in GDB responses. Locally it works though.
// It works fine using the default node version in jenkins node which is 12.19.0, but SonarCloud
// doesn't like it.
//   tools {
//     nodejs 'nodejs-14.17.0'
//   }

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

// Doesn't work with the nodejs 12.19.0 which is the default on jenkins node.
//     stage('Sonar') {
//       steps {
//         withSonarQubeEnv('SonarCloud') {
//           sh "node sonar-project.js --branch='${env.ghprbSourceBranch}' --target-branch='${env.ghprbTargetBranch}' --pull-request-id='${env.ghprbPullId}'"
//         }
//       }
//     }
  }

  post {
    always {
      dir("test-e2e/") {
        sh "docker logs graphdb"
        sh "docker-compose down -v --remove-orphans --rmi=local || true"
      }
    }
  }
}
