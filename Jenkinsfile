/*
 * Jenkins Pipeline for building, analysing and testing the RDF JS driver
 */
pipeline {

  agent {
    label 'HW'
  }

  stages {
    stage ('Install') {
      steps {
        sh "npm install"
      }
    }

    stage ('Verify') {
      steps {
        sh "npm run lint"
        sh "npm run lint:test"
      }
    }

    stage ('Test') {
      steps {
        sh "npm run test:report"
      }
    }

    stage ('Build') {
      steps {
        sh "npm run build"
      }
    }

    stage ('Publish') {
      when {
        expression { params.branch == 'master' || params.branch.startsWith('release/') }
      }

      steps {
        // TODO: in onto's nexus
        // TODO: Notify in Slack
        echo "publish"
      }
    }
  }

  post {
    always {
      // Test results report
      junit allowEmptyResults: true, testResults: 'report/junit.xml'

      // Coverage report
      publishHTML([
        allowMissing: true,
        reportDir: 'report/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Coverage Report',
        keepAll: false,
        alwaysLinkToLastBuild: false
      ])
    }

    success {
      // TODO: Could publish documentation from jsdoc
      echo "success"
    }

    failure {
      // TODO: Send mail
      echo "failure"
    }
  }
}
