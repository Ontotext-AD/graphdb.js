/* eslint-disable max-len */
const {RDFMimeType} = require('graphdb').http;
const {ServerClientConfig} = require('graphdb').server;
const {RepositoryClientConfig} = require('graphdb').repository;

// Variables used in tests
const serverAddress = process.env.GDB_URL || 'http://localhost:7200';
const testRepoPath = './tests/data/repositories/GDB/repository1.ttl';
const testRepo2Path = './tests/data/repositories/GDB/repository2.ttl';

const restApiConfig = new RepositoryClientConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  });

const restApiBasicAuthConfig = new RepositoryClientConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  })
  .useBasicAuthentication('admin', 'root');

const restApiTokenAuthConfig = new RepositoryClientConfig(serverAddress)
  .setEndpoints([`${serverAddress}/repositories/Test_repo`])
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_XML
  })
  .useGdbTokenAuthentication('admin', 'root');


const serverBasicAuthConfig = new ServerClientConfig(serverAddress)
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
  })
  .useBasicAuthentication('admin', 'root');

const serverConfig = new ServerClientConfig(serverAddress)
  .setHeaders({
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
  });

module.exports = {restApiConfig, serverAddress, testRepoPath, testRepo2Path,
  restApiBasicAuthConfig, restApiTokenAuthConfig, serverBasicAuthConfig, serverConfig};
