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

describe('Manage GraphDB users', () => {
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

  test('Should create, read, update and delete users', () => {
    const expectedAppSettings = new AppSettings(true, true, true, false);
    const newAppSettings = new AppSettings(false, false, false, true);

    return serverClient.createUser('test_user', '123456')
      .then((response) => {
        return expect(response.response.status).toBe(201);
      }).then(() => {
        return serverClient.updateUser('test_user', '111222',
          [], new AppSettings(true, true, true, false));
      }).then((response) => {
        return expect(JSON.parse(response.response.config.data).password)
          .toBe('111222');
      }).then(() => {
        return serverClient.getUser('test_user');
      }).then((response) => {
        return expect(response.response.data.appSettings)
          .toStrictEqual(expectedAppSettings.toJson());
      }).then(() => {
        return serverClient.updateUserData('test_user',
          '111222', newAppSettings);
      }).then(() => {
        return serverClient.getUser('test_user');
      }).then((response) => {
        return expect(response.response.data.appSettings)
          .toStrictEqual(newAppSettings.toJson());
      }).then(() => {
        return serverClient.deleteUser('test_user');
      }).then((response) => {
        expect(response.response.status).toBe(204);
      }).catch((e) => {
        serverClient.deleteUser('test_user');
        throw new Error(e);
      });
  });
});
