const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {
  GraphDBServerClient,
  AppSettings,
  ServerClientConfig
} = require('graphdb').server;
const path = require('path');
const Utils = require('utils.js');
const Config = require('config.js');

const TEST_REPO_NAME = 'Test_repo';

describe('Manage GraphDB security', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);
  const serverConfig = new ServerClientConfig(Config.serverAddress)
    .useGdbTokenAuthentication('admin', 'root');
  const serverClient = new GraphDBServerClient(serverConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      const wineRdf = path.resolve(__dirname, './../data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
    }).then(() => {
      return Utils.toggleSecurity(true);
    }).catch((e) => {
      throw new Error(e);
    });
  });

  afterAll(() => {
    return Utils.toggleSecurity(false)
      .then(() => {
        return Utils.deleteRepo(TEST_REPO_NAME);
      }).catch((e) => {
        throw new Error(e);
      });
  });

  afterEach(() => {
    serverClient.logout(serverConfig);
  });

  test('Should check and toggle security repo', () => {
    return serverClient.isSecurityEnabled()
      .then((enabled) => {
        return expect(enabled).toBe(true);
      }).then(() => {
        return serverClient.toggleSecurity(false);
      }).then(() => {
        return serverClient.isSecurityEnabled();
      }).then((enabled) => {
        return expect(enabled).toBe(false);
      }).then(() => {
        return serverClient.toggleSecurity(true);
      }).then(() => {
        return serverClient.isSecurityEnabled();
      }).then((enabled) => {
        expect(enabled).toBe(true);
      }).catch((e) => {
        throw new Error(e);
      });
  });

  test('Should update free access', () => {
    const authorities = [
      'WRITE_REPO_Test_repo',
      'READ_REPO_Test_repo'
    ];
    const appSettings = new AppSettings({
      DEFAULT_INFERENCE: true, DEFAULT_SAMEAS: true, IGNORE_SHARED_QUERIES: false, EXECUTE_COUNT: true});

    return serverClient.getFreeAccess()
      .then((response) => {
        return expect(response.isEnabled()).toStrictEqual(false);
      }).then(() => {
        return serverClient.updateFreeAccess(true, authorities, appSettings);
      }).then(() => {
        return serverClient.getFreeAccess();
      }).then((response) => {
        return expect(response.isEnabled()).toStrictEqual(true);
      }).then(() => {
        return serverClient.updateFreeAccess(false, authorities, appSettings);
      }).then(() => {
        return serverClient.getFreeAccess();
      }).then((response) => {
        expect(response.isEnabled()).toStrictEqual(false);
      }).catch((e) => {
        throw new Error(e);
      });
  });
});
