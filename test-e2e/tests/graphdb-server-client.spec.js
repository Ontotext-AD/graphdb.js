const {RDFRepositoryClient,
  RepositoryType, RepositoryConfig} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {
  GraphDBServerClient,
  AppSettings,
  ServerClientConfig} = require('graphdb').server;
const path = require('path');
const Utils = require('utils');
const Config = require('config');

const TEST_REPO = 'Test_repo';
const NEW_REPO = 'New_repo';

describe('Should test graphDB server client', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);
  const serverConfig = new ServerClientConfig(Config.serverAddress)
    .useGdbTokenAuthentication('admin', 'root');
  const serverClient = new GraphDBServerClient(serverConfig);

  beforeAll((done) => {
    Utils.createRepo(Config.testRepoPath).then(() => {
      const wineRdf = path.resolve(__dirname, './data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
    }).then(() => {
      return Utils.toggleSecurity(true);
    }).then(() => {
      done();
    }).catch((e) => {
      throw new Error(e);
    });
  });

  afterAll((done) => {
    Utils.toggleSecurity(false)
      .then(() => {
        return Utils.deleteRepo(TEST_REPO);
      }).then(() => {
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  afterEach(() => {
    serverClient.logout(serverConfig);
  });

  test('Should get repo type default config', (done) => {
    const expectedResponse = Utils.loadFile('./data/graphdb-server-client/' +
      'expected_response_default_config_free_repo.txt');
    serverClient.getDefaultConfig(RepositoryType.FREE)
      .then((response) => {
        expect(response.response.data)
          .toStrictEqual(JSON.parse(expectedResponse));
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  test('Should get repo config', (done) => {
    const expectedResponse = Utils.loadFile('./data/graphdb-server-client/' +
      'expected_response_repo_config.txt');
    serverClient.getRepositoryConfig(TEST_REPO)
      .then((response) => {
        expect(response.response.data)
          .toStrictEqual(JSON.parse(expectedResponse));
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  test('Should get repo config as turtle', (done) => {
    let expected;
    const sampleRdf = path.resolve(__dirname, './data/graphdb-server-client/' +
      'expected_response_repo_config_turtle.txt');
    Utils.getReadStream(sampleRdf).on('data', (data) => expected = data);

    serverClient.downloadRepositoryConfig(TEST_REPO)
      .then((stream) => {
        stream.on('data', (data) => {
          expect(data).toEqual(expected);
          done();
        });
      });
  });

  test('Should create and delete repo', (done) => {
    const config = new RepositoryConfig(NEW_REPO, '',
      new Map(), '', 'Repo title', RepositoryType.FREE);

    serverClient.getRepositoryIDs()
      .then((response) => {
        const expected = [TEST_REPO];
        expect(response.sort()).toEqual(expected);
      }).then(() => {
        return serverClient.createRepository(config);
      }).then(() => {
        return serverClient.getRepositoryIDs();
      }).then((response) => {
        const expected = [NEW_REPO, TEST_REPO];
        expect(response.sort()).toEqual(expected);
      }).then(() => {
        return serverClient.deleteRepository(config.id);
      }).then(() => {
        return serverClient.getRepositoryIDs();
      }).then((response) => {
        const expected = [TEST_REPO];
        expect(response).toEqual(expected);
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  test('Should check and toggle security repo', (done) => {
    serverClient.isSecurityEnabled()
      .then((response) => {
        return expect(response.response.data).toBe(true);
      }).then(() => {
        return serverClient.toggleSecurity(false);
      }).then(() => {
        return serverClient.isSecurityEnabled();
      }).then((response) => {
        return expect(response.response.data).toBe(false);
      }).then(() => {
        return serverClient.toggleSecurity(true);
      }).then(() => {
        return serverClient.isSecurityEnabled();
      }).then((response) => {
        expect(response.response.data).toBe(true);
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  test('Should update free access', (done) => {
    const authorities = [
      'WRITE_REPO_Test_repo',
      'READ_REPO_Test_repo'
    ];
    const appSettings = new AppSettings(true,
      true, false, true);

    serverClient.getFreeAccess()
      .then((response) => {
        return expect(response.response.data.enabled).toStrictEqual(false);
      }).then(() => {
        return serverClient.updateFreeAccess(true, authorities, appSettings);
      }).then((response) => {
        return expect(response.response.status).toBe(200);
      }).then(() => {
        return serverClient.getFreeAccess();
      }).then((response) => {
        return expect(response.response.data.enabled).toStrictEqual(true);
      }).then(() => {
        return serverClient.updateFreeAccess(false, authorities, appSettings);
      }).then((response) => {
        return expect(response.response.status).toBe(200);
      }).then(() => {
        return serverClient.getFreeAccess();
      }).then((response) => {
        expect(response.response.data.enabled).toStrictEqual(false);
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  test('Should create, read, update and delete users', (done) => {
    const expextedAppSettings = new AppSettings(true, true, true, false);
    const newAppSettings = new AppSettings(false, false, false, true);

    serverClient.createUser('test_user', '123456')
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
          .toStrictEqual(expextedAppSettings.toJson());
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
        done();
      }).catch((e) => {
        serverClient.deleteUser('test_user');
        throw new Error(e);
      });
  });
});
