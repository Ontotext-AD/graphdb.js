const {
  RDFRepositoryClient,
  RepositoryType, RepositoryConfig
} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {
  GraphDBServerClient,
  ServerClientConfig
} = require('graphdb').server;
const path = require('path');
const Utils = require('utils.js');
const Config = require('config.js');

const TEST_REPO_NAME = 'Test_repo';
const NEW_REPO_NAME = 'New_repo';

describe('Manage GraphDB repositories', () => {
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

  test('Should get repo default config', () => {
    const expectedResponse = Utils.loadFile('./data/graphdb-server-client/' +
      'expected_response_default_config.txt');
    return serverClient.getDefaultConfig(RepositoryType.GRAPHDB).then((response) => {
      expect(response.response.data).toStrictEqual(JSON.parse(expectedResponse));
    }).catch((e) => {
      throw new Error(e);
    });
  });

  test('Should get repo config', () => {
    const expectedResponse = Utils.loadFile('./data/graphdb-server-client/' +
      'expected_response_repo_config.txt');
    return serverClient.getRepositoryConfig(TEST_REPO_NAME).then((response) => {
      expect(response.response.data).toStrictEqual(JSON.parse(expectedResponse));
    }).catch((e) => {
      throw new Error(e);
    });
  });

  test('Should get repo config as turtle', () => {
    let expected;
    const sampleRdf = path.resolve(__dirname, './../data/graphdb-server-client/' +
      'expected_response_repo_config_turtle.txt');
    Utils.getReadStream(sampleRdf).on('data', (data) => expected = data);

    return serverClient.downloadRepositoryConfig(TEST_REPO_NAME).then((stream) => {
      stream.on('data', (data) => {
        expect(data).toEqual(expected);
      });
    }).catch((e) => {
      throw new Error(e);
    });
  });

  test('Should create and delete repo', () => {
    // It doesn't work with Map
    const params = {
      "defaultNS": {
        "name": "defaultNS",
        "label": "Default namespaces for imports(';' delimited)",
        "value": ""
      },
      "imports": {
        "name": "imports",
        "label": "Imported RDF files(';' delimited)",
        "value": ""
      }
    };
    const config = new RepositoryConfig(NEW_REPO_NAME, '',
      params, '', 'Repo title', RepositoryType.GRAPHDB);

    return serverClient.getRepositoryIDs()
      .then((response) => {
        const expected = [TEST_REPO_NAME];
        expect(response.sort()).toEqual(expected);
      }).then(() => {
        return serverClient.createRepository(config);
      }).then(() => {
        return serverClient.getRepositoryIDs();
      }).then((response) => {
        const expected = [NEW_REPO_NAME, TEST_REPO_NAME];
        expect(response.sort()).toEqual(expected);
      }).then(() => {
        return serverClient.deleteRepository(config.id);
      }).then(() => {
        return serverClient.getRepositoryIDs();
      }).then((response) => {
        const expected = [TEST_REPO_NAME];
        expect(response).toEqual(expected);
      }).catch((e) => {
        throw new Error(e);
      });
  });
});
