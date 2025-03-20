/* eslint-disable max-len */
const {RDFMimeType} = require('graphdb').http;
const {ServerClientConfig} = require('graphdb').server;
const {RepositoryClientConfig} = require('graphdb').repository;

// Variables used in tests
let serverAddress = process.env.GRAPHDB_BASE_URL || 'http://localhost:7200';
const testRepoPath = './tests/data/repositories/GDB_Free/repository1.ttl';
const testRepo2Path = './tests/data/repositories/GDB_Free/repository2.ttl';

// Initialize empty configs that will be populated later
let restApiConfig;
let restApiBasicAuthConfig;
let restApiTokenAuthConfig;
let serverBasicAuthConfig;
let serverConfig;

// Function to initialize configs with current serverAddress
const initializeConfigs = () => {
  restApiConfig = new RepositoryClientConfig(serverAddress)
    .setEndpoints([`${serverAddress}/repositories/Test_repo`])
    .setHeaders({
      'Accept': RDFMimeType.SPARQL_RESULTS_XML
    });

  restApiBasicAuthConfig = new RepositoryClientConfig(serverAddress)
    .setEndpoints([`${serverAddress}/repositories/Test_repo`])
    .setHeaders({
      'Accept': RDFMimeType.SPARQL_RESULTS_XML
    })
    .useBasicAuthentication('admin', 'root');

  restApiTokenAuthConfig = new RepositoryClientConfig(serverAddress)
    .setEndpoints([`${serverAddress}/repositories/Test_repo`])
    .setHeaders({
      'Accept': RDFMimeType.SPARQL_RESULTS_XML
    })
    .useGdbTokenAuthentication('admin', 'root');

  serverBasicAuthConfig = new ServerClientConfig(serverAddress)
    .setHeaders({
      'Accept': RDFMimeType.SPARQL_RESULTS_JSON
    })
    .useBasicAuthentication('admin', 'root');

  serverConfig = new ServerClientConfig(serverAddress)
    .setHeaders({
      'Accept': RDFMimeType.SPARQL_RESULTS_JSON
    });
};

const updateServerAddress = (newAddress) => {
  // ESLint warning can be fixed by using console.info or adding /* eslint-disable no-console */
  console.info(`Updating server address to: ${newAddress}`);
  serverAddress = newAddress;
  initializeConfigs(); // Recreate all configs with the new address
};

// Initialize with default address
initializeConfigs();

module.exports = {
  get restApiConfig() {
    return restApiConfig;
  },
  get restApiBasicAuthConfig() {
    return restApiBasicAuthConfig;
  },
  get restApiTokenAuthConfig() {
    return restApiTokenAuthConfig;
  },
  get serverBasicAuthConfig() {
    return serverBasicAuthConfig;
  },
  get serverConfig() {
    return serverConfig;
  },
  get serverAddress() {
    return serverAddress;
  },
  testRepoPath,
  testRepo2Path,
  updateServerAddress
};
