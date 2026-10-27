const argv = require('minimist')(process.argv.slice(2));

const branch = argv['branch'];
const targetBranch = argv['target-branch'];
const pullRequestId = argv['pull-request-id'];

const sonarOptions = {
  "sonar.organization": "ontotext-ad",
  "sonar.projectKey": "Ontotext-AD_graphdb.js",
  "sonar.projectName": "graphdb.js",
  "sonar.sources": "./src",
  "sonar.tests": "test",
  "sonar.language": "js",
  "sonar.javascript.lcov.reportPaths": "coverage/lcov.info",
  "sonar.scm.provider": "git",
  "sonar.sourceEncoding": "UTF-8",
};

if (pullRequestId) {
  sonarOptions['sonar.pullrequest.key'] = `${pullRequestId}`;
  sonarOptions['sonar.pullrequest.branch'] = branch;
  sonarOptions['sonar.pullrequest.base'] = targetBranch;
} else {
  sonarOptions["sonar.branch.name"] = branch;
}

// sonarqube-scanner is an ES module, loaded with import() as its docs
// recommend for CommonJS
import('sonarqube-scanner')
  .then(({scan}) => scan({options: sonarOptions}))
  .then(() => {
    console.log('Finished SonarQube scan');
  })
  .catch((error) => {
    console.error('SonarQube scan failed', error);
    process.exitCode = 1;
  });
