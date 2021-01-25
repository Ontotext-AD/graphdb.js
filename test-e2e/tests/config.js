/* eslint-disable max-len */
const {RDFMimeType, ClientConfigBuilder} = require('graphdb').http;

// Variables used in tests
const serverAddress = 'http://localhost:7200';
const testRepoPath = './tests/data/repositories/GDB_Free/repository1.ttl';
const testRepo2Path = './tests/data/repositories/GDB_Free/repository2.ttl';

const restApiConfig = ClientConfigBuilder.repositoryConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  });

const restApiBasicAuthConfig = ClientConfigBuilder.repositoryConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  })
  .setUsername('admin')
  .setPass('root')
  .setBasicAuthentication(true);

const serverBasicAuthConfig = ClientConfigBuilder.serverConfig(serverAddress)
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
  })
  .setUsername('admin')
  .setPass('root')
  .setBasicAuthentication(true);

const serverConfig = ClientConfigBuilder.serverConfig(serverAddress)
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
  });

module.exports = {restApiConfig, serverAddress, testRepoPath, testRepo2Path,
  restApiBasicAuthConfig, serverBasicAuthConfig, serverConfig};
