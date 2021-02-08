/* eslint-disable max-len */
const {RDFMimeType, ClientConfigBuilder} = require('graphdb').http;

// Variables used in tests
const serverAddress = 'http://localhost:7200';
const testRepoPath = './tests/data/repositories/GDB_Free/repository1.ttl';
const testRepo2Path = './tests/data/repositories/GDB_Free/repository2.ttl';

const restApiConfig = new ClientConfigBuilder()
  .repositoryConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  });

const restApiBasicAuthConfig = new ClientConfigBuilder()
  .repositoryConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  })
  .useBasicAuthentication('admin', 'root');

const restApiTokenAuthConfig = new ClientConfigBuilder()
  .repositoryConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  })
  .useGdbTokenAuthentication('admin', 'root');


const serverBasicAuthConfig = new ClientConfigBuilder().serverConfig(serverAddress)
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
  })
  .useBasicAuthentication('admin', 'root');

const serverConfig = new ClientConfigBuilder().serverConfig(serverAddress)
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
  });

module.exports = {restApiConfig, serverAddress, testRepoPath, testRepo2Path,
  restApiBasicAuthConfig, restApiTokenAuthConfig, serverBasicAuthConfig, serverConfig};
