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
        withCredentials([
          file(
            credentialsId: 'graphdb-ee.license',
            variable: 'GRAPHDB_LICENSE'
          )
        ]) {
          sh "cp \"$GRAPHDB_LICENSE\" ./test-e2e/graphdb.license"
          sh "ls ./test-e2e/"
          archiveArtifacts allowEmptyArchive: true, artifacts: 'test-e2e/graphdb.license'
          dir('test-e2e') {
            sh 'docker-compose up -d --force-recreate --remove-orphans'
          }
        }
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
        sh "npm run install:local"
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
      dir('test-e2e') {
        sh "docker logs graphdb || true"
        sh "docker-compose down -v --remove-orphans --rmi=local || true"
      }
    }
  }
}
