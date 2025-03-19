@Library('ontotext-platform@GDB-11897-Migrate-pipelines-new-Jenkins') _
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
            sh "npm run install:local"
            sh "wait-on http://localhost:7200/protocol -t 60000"
            sh "(cd test-e2e/ && npm install && npm link graphdb && npm run test)"
          }
        }

        stage('Sonar') {
          steps {
            withSonarQubeEnv('SonarCloud') {
              sh """
                node sonar-project.js \
                ${sonar.resolveBranchArguments()}
              """
            }
          }
        }
    }

    post {
        always {
          dir("test-e2e/") {
            sh "docker logs graphdb"
            sh "docker-compose down -v --remove-orphans --rmi=local || true"
          }
        }

        failure {
            script {
                node(env.NEW_AGENT) {
                    archiveArtifacts()
                }
            }
        }
    }
}

def cleanup() {
    // upload failed tests report and artifacts
    junit allowEmptyResults: true, testResults: 'cypress/results/**/*.xml'
    archiveArtifacts allowEmptyArchive: true, artifacts: 'report/screenshots/**/*.png, report/videos/**/*.mp4, cypress/logs/*.log'

    script {
        dockerCompose.downCmd(removeVolumes: true, removeOrphans: true, removeImages: 'local', ignoreErrors: true)
    }
    // clean root owned resources from docker volumes, just in case
    sh "sudo rm -rf ./coverage"
    sh "sudo rm -rf ./cypress"
    sh "sudo rm -rf ./report"
}


def archiveArtifacts() {
    archiveArtifacts artifacts: 'translation-validation-result.json', onlyIfSuccessful: false
}
