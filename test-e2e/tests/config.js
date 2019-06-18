const {RepositoryClientConfig} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;

// Variables used in tests
const serverAddress = 'http://localhost:7200';
const testRepoPath = './tests/data/repositories/GDB_Free/repository1.ttl';
const testRepo2Path = './tests/data/repositories/GDB_Free/repository2.ttl';

const restApiConfig = new RepositoryClientConfig(

  [`${serverAddress}/repositories/Test_repo`], {
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  },
  '', 10000, 10000);

module.exports = {restApiConfig, serverAddress, testRepoPath, testRepo2Path};
