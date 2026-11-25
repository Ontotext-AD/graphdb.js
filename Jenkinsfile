@Library('ontotext-platform@v0.1.51') _
pipeline {
    environment {
      CI = "true"
      // Tells NPM and co. not to use color output (looks like garbage in Jenkins)
      NO_COLOR = "1"
      SONAR_ENVIRONMENT = "SonarCloud"
      NPM_CONFIG_REGISTRY = 'https://registry.npmjs.org/'
    }

    agent {
      label 'aws-small'
    }

    tools {
      nodejs 'nodejs-22'
    }

    stages {
      stage('Prepare') {
        steps {
          sh "node --version"
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

      stage('Sonar') {
        steps {
          withSonarQubeEnv(SONAR_ENVIRONMENT) {
            script {
              try {
                if (scmUtil.isMaster()) {
                  sh "node sonar-project.js --branch='${scmUtil.getCurrentBranch()}'"
                } else {
                  sh "node sonar-project.js --branch='${scmUtil.getSourceBranch()}' --target-branch='${scmUtil.getTargetBranch()}' --pull-request-id='${scmUtil.getMergeRequestId()}'"
                }
              } catch (e) {
                echo "Sonar analysis failed. Error: ${e.getMessage()}"
              }
            }
          }
        }
      }

      stage('Acceptance Test') {
        steps {
          script {
            withKsm(application: [[
              credentialsId: 'ksm-jenkins',
              secrets: [
                [
                  destination: 'file',
                  filePath: 'graphdb.license',
                  notation: 'keeper://AByA4tIDmeN7RmqnQYGY0A/file/graphdb.license'
                ]
              ]
            ]]) {
              archiveArtifacts allowEmptyArchive: true, artifacts: 'graphdb.license'

              // Package the library built by "npm ci" for Dockerfile.e2e
              sh "npm pack --ignore-scripts"

              // The same project name as the cleanup in "post"
              def compose = "docker-compose --env-file .env -f docker-compose-e2e.yml -p graphdbjs"
              sh "${compose} build"
              sh "${compose} up -d --force-recreate --remove-orphans graphdb"

              // Removes the tests container left by an aborted build
              sh "docker rm -f e2e-tests || true"

              // Mirrors scripts/run-e2e.sh, with Compose v1, a fixed project name and no TTY
              // Attaches only to the tests, so the GraphDB log stays out of the console
              def exitCode = sh(
                script: "${compose} run -T --name e2e-tests e2e-tests",
                returnStatus: true
              )

              // Fail the build if the tests failed
              if (exitCode != 0) {
                error "E2E tests failed with exit code ${exitCode}"
              }
            }
          }
        }
      }
    }

    post {
        always {
          script {
            // The cleanup runs even when a report step throws
            try {
              sh "docker logs graphdb > graphdb.log 2>&1 || rm -f graphdb.log"
              archiveArtifacts allowEmptyArchive: true, artifacts: 'graphdb.log'

              // Publishes only this build's report, not one left in the workspace by an earlier build
              def reportCopied = sh(
                script: "rm -rf test-e2e/reports && mkdir -p test-e2e/reports && docker cp e2e-tests:/app/test-e2e/reports/junit.xml test-e2e/reports/",
                returnStatus: true
              ) == 0
              if (reportCopied) {
                junit testResults: 'test-e2e/reports/junit.xml'
              }
            } finally {
              sh "docker rm -f e2e-tests || true"
              dir("test-e2e/") {
                dockerCompose.downCmd(composeFile: '../docker-compose-e2e.yml', removeOrphans: true, removeVolumes: true, removeImages: 'local', projectName: 'graphdbjs')
              }
            }
          }
        }
    }
}
