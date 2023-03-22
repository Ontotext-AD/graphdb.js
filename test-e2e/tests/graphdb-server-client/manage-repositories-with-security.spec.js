const {RepositoryConfig, RepositoryType} = require('graphdb').repository;
const {GraphDBServerClient, ServerClientConfig} = require('graphdb').server;
const Utils = require('utils.js');
const Config = require('config.js');

const NEW_REPO = 'New_repo';

describe('Manage GraphDB repositories with security enabled', () => {
  beforeAll(() => {
    return Utils.toggleSecurity(true).catch((e) => {
      throw new Error(e);
    });
  });

  afterAll(() => {
    return Utils.toggleSecurity(false).catch((e) => {
      throw new Error(e);
    });
  });

  test('Should add and delete repository with BASIC auth', () => {
    const config = new ServerClientConfig(Config.serverAddress)
      .useBasicAuthentication('admin', 'root');
    const serverClient = new GraphDBServerClient(config);
    return createRepository(serverClient);
  });

  test('Should add and delete repository with TOKEN auth', () => {
    const config = new ServerClientConfig(Config.serverAddress)
      .useGdbTokenAuthentication('admin', 'root');
    const serverClient = new GraphDBServerClient(config);
    return createRepository(serverClient);
  });
});

function createRepository(serverClient) {
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
  const config = new RepositoryConfig(NEW_REPO, '',
    params, '', 'Repo title', RepositoryType.GRAPHDB);

  return serverClient.getRepositoryIDs()
    .then((response) => {
      const expected = [];
      expect(response.sort()).toEqual(expected);
    }).then(() => {
      return serverClient.createRepository(config);
    }).then(() => {
      return serverClient.getRepositoryIDs();
    }).then((response) => {
      const expected = [NEW_REPO];
      expect(response.sort()).toEqual(expected);
    }).then(() => {
      return serverClient.deleteRepository(config.id);
    }).then(() => {
      return serverClient.getRepositoryIDs();
    }).then((response) => {
      const expected = [];
      expect(response).toEqual(expected);
    }).catch((e) => {
      throw new Error(e);
    });
}
