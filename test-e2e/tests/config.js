const {RepositoryClientConfig} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {ServerClientConfig} = require('graphdb').server;

// Variables used in tests
const serverAddress = 'http://localhost:7200';
const testRepoPath = './tests/data/repositories/GDB_Free/repository1.ttl';
const testRepo2Path = './tests/data/repositories/GDB_Free/repository2.ttl';

const restApiConfig = new RepositoryClientConfig(

  [`${serverAddress}/repositories/Test_repo`], {
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  },
  '', 10000, 10000);

const restApiBasicAuthConfig = new RepositoryClientConfig(
  [`${serverAddress}/repositories/Test_repo`], {
    'Accept': RDFMimeType.SPARQL_RESULTS_XML,
    'Authorization': 'Basic YWRtaW46cm9vdA=='
  },
  '', 10000, 10000);

const serverBasicAuthConfig = new ServerClientConfig(
  serverAddress,
  10000,
  {
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON,
    'Authorization': 'Basic YWRtaW46cm9vdA=='
});


module.exports = {restApiConfig, serverAddress, testRepoPath, testRepo2Path, restApiBasicAuthConfig, serverBasicAuthConfig};
