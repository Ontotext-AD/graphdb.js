const {RDFRepositoryClient, RepositoryType} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {GraphDBServerClient, ServerClientConfig} = require('graphdb').server;
const path = require('path');
const Utils = require('utils');
const Config = require('config');

describe('Should test graphDB server client', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);
  const serverConfig = new ServerClientConfig(Config.serverAddress, 10000,
    new Map(), 'admin', 'root', true, true);
  const serverClient = new GraphDBServerClient(serverConfig);

  beforeAll((done) => {
    Utils.createRepo(Config.testRepoPath).then(() => {
      const wineRdf = path.resolve(__dirname, './data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
    }).then(() => {
      return Utils.toggleSecurity(true);
    }).then(() => {
      done();
    });
  });

  afterAll(() => {
    return Utils.toggleSecurity(false).then(() => {
      return Utils.deleteRepo('Test_repo');
    });
  });

  test('Should get repo type default config', () => {
    const expectedResponse = Utils.loadFile('./data/graphdb-server-client/' +
      'expected_response_default_config_free_repo.txt');
    return serverClient.getDefaultConfig(RepositoryType.FREE)
      .then((response) => {
        expect(response.response.data)
          .toStrictEqual(JSON.parse(expectedResponse));
      });
  });

  test('Should get repo config', () => {
    const expectedResponse = Utils.loadFile('./data/graphdb-server-client/' +
      'expected_response_repo_config.txt');
    return serverClient.getRepositoryConfig('Test_repo')
      .then((response) => {
        expect(response.response.data)
          .toStrictEqual(JSON.parse(expectedResponse));
      });
  });

  test('Should get repo config as turtle', () => {
    const expectedResponse = Utils.loadFile('./data/graphdb-server-client/' +
      'expected_response_repo_config_turtle.txt');
    return serverClient.getRepositoryConfig('Test_repo', 'text/turtle')
      .then((response) => {
        expect(response.replace(/\s+/g, ''))
          .toStrictEqual(expectedResponse.replace(/\s+/g, ''));
      });
  });

  test('Should create and delete repo', () => {
    const config = {
      id: 'TEST_CREATE',
      params: {},
      title: '',
      type: RepositoryType.FREE
    };
    return serverClient.createRepository(config)
      .then(() => {
        return serverClient.getRepositoryIDs();
      }).then((response) => {
        const expected = ['TEST_CREATE', 'Test_repo'];
        expect(response.sort()).toEqual(expected);
      }).then(() => {
        return serverClient.deleteRepository(config.id);
      }).then(() => {
        return serverClient.getRepositoryIDs();
      }).then((response) => {
        const expected = ['Test_repo'];
        expect(response).toEqual(expected);
      });
  });

  test('Should check ang toggle security repo', () => {
    return serverClient.isSecurityEnabled()
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
        return expect(response.response.data).toBe(true);
      });
  });

  test('Should update free access', () => {
    const authorities = [
      'WRITE_REPO_Test_repo',
      'READ_REPO_Test_repo'
    ];
    const appSettings = {
      'DEFAULT_INFERENCE': true,
      'DEFAULT_SAMEAS': true,
      'IGNORE_SHARED_QUERIES': false,
      'EXECUTE_COUNT': true
    };

    return serverClient.getFreeAccess()
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
        return expect(response.response.data.enabled).toStrictEqual(false);
      });
  });

  test('Should create, read, update and delete users', () => {
    const expextedAppSettings = {
      'DEFAULT_INFERENCE': true,
      'DEFAULT_SAMEAS': true,
      'EXECUTE_COUNT': true,
      'IGNORE_SHARED_QUERIES': false
    };

    const newAppSettings = {
      'DEFAULT_INFERENCE': false,
      'DEFAULT_SAMEAS': false,
      'EXECUTE_COUNT': false,
      'IGNORE_SHARED_QUERIES': true
    };
    return serverClient.createUser('test_user', '123456')
      .then((response) => {
        return expect(response.response.status).toBe(201);
      }).then(() => {
        return serverClient.updateUser('test_user', '111222');
      }).then((response) => {
        return expect(JSON.parse(response.response.config.data).password)
          .toBe('111222');
      }).then(() => {
        return serverClient.getUser('test_user');
      }).then((response) => {
        return expect(response.response.data.appSettings)
          .toStrictEqual(expextedAppSettings);
      }).then(() => {
        return serverClient.updateUserData('test_user',
          '111222', newAppSettings);
      }).then(() => {
        return serverClient.getUser('test_user');
      }).then((response) => {
        return expect(response.response.data.appSettings)
          .toStrictEqual(newAppSettings);
      }).then(() => {
        return serverClient.deleteUser('test_user');
      }).then((response) => {
        return expect(response.response.status).toBe(204);
      }).catch((e) => {
        serverClient.deleteUser('test_user');
        throw new Error(e);
      });
  });
});
