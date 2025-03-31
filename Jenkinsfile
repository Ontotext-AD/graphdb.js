@Library('ontotext-platform@v0.1.49') _
pipeline {
    environment {
        CI = "true"
        // Needed for our version of webpack + newer nodejs
        NODE_OPTIONS = "--openssl-legacy-provider"
        // Tells NPM and co. not to use color output (looks like garbage in Jenkins)
        NO_COLOR = "1"
        SONAR_ENVIRONMENT = "SonarCloud"
        LEGACY_JENKINS = "https://jenkins.ontotext.com"
        NEW_JENKINS = "https://new-jenkins.ontotext.com"
        LEGACY_AGENT = 'graphdb-jenkins-node'
        NEW_AGENT = 'aws-small'
    }

    // TODO fix when migration is complete
    agent {
        label env.NEW_AGENT
    }

    tools {
        nodejs 'nodejs-18.9.0'
    }

    stages {
        // TODO remove when migration is complete
        stage('Check Jenkins environment') {
            steps {
                script {
                    if (env.JENKINS_URL?.contains(env.LEGACY_JENKINS)) {
                        echo "Legacy Jenkins detected. Skipping pipeline execution and finishing build with SUCCESS."
                        currentBuild.result = 'SUCCESS'
                        return
                    }
                }
            }
        }

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

        stage('Acceptance Test') {
          steps {
            script {
              try {
                  sh 'docker compose --env-file .env -f docker-compose-e2e.yml build --no-cache'
                  sh 'docker compose --env-file .env -f docker-compose-e2e.yml up -d'

                  // Show real-time logs of e2e-tests and block execution until it completes
                  sh 'docker compose -f docker-compose-e2e.yml logs -f e2e-tests'

                  def exitCode = sh(script: 'docker inspect e2e-tests --format="{{.State.ExitCode}}"', returnStdout: true).trim().toInteger()

                  sh 'docker logs graphdb > graphdb-logs.txt 2>&1'

                  sh 'docker compose --env-file .env -f docker-compose-e2e.yml down'

                  if (exitCode != 0) {
                      error "E2E tests failed with exit code ${exitCode}"
                  }
              } catch (Exception e) {
                  error "Acceptance test stage failed: ${e.message}"
              }
            }
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
                  echo "Sonar analysis failed, but continuing the pipeline. Error: ${e.getMessage()}"
                }
              }
            }
          }
        }
    }

    post {
      always {
          script {
              dockerCompose.downCmd(composeFile: 'docker-compose-e2e.yml', removeOrphans: true, removeVolumes: true, removeImages: 'local', projectName: 'e2e-tests')
          }
      }
      failure {
          script {
              archiveArtifacts artifacts: 'graphdb-logs.txt', allowEmptyArchive: true
          }
      }
    }
}
