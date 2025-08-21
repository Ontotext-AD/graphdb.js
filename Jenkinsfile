@Library('ontotext-platform@v0.1.51') _
pipeline {
    environment {
      CI = "true"
      // Needed for our version of webpack + newer nodejs
      NODE_OPTIONS = "--openssl-legacy-provider"
      // Tells NPM and co. not to use color output (looks like garbage in Jenkins)
      NO_COLOR = "1"
      SONAR_ENVIRONMENT = "SonarCloud"
      NPM_CONFIG_REGISTRY = 'https://registry.npmjs.org/'
    }

    agent {
      label 'aws-small'
    }

    tools {
      nodejs 'nodejs-18.9.0'
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

              def exitCode = sh(
                script: "docker-compose --env-file .env -f docker-compose-e2e.yml up --build --no-deps --force-recreate --remove-orphans --abort-on-container-exit --exit-code-from e2e-tests",
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
          dir("test-e2e/") {
            script {
              sh "docker logs graphdb"
              dockerCompose.downCmd(composeFile: '../docker-compose-e2e.yml', removeOrphans: true, removeVolumes: true, removeImages: 'local', projectName: 'graphdbjs')
            }
          }
        }
    }
}
