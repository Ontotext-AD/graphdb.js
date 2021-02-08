const {RepositoryConfig, RepositoryType} = require('graphdb').repository;
const {GraphDBServerClient} = require('graphdb').server;
const {ClientConfigBuilder} = require('graphdb').http;
const Utils = require('utils');
const Config = require('config');

const NEW_REPO = 'New_repo';

describe('Should test server client auth', () => {
  beforeAll((done) => {
    Utils.toggleSecurity(true).then(() => {
      done();
    }).catch((e) => {
      throw new Error(e);
    });
  });

  afterAll((done) => {
    return Utils.toggleSecurity(false).then(() => {
      done();
    }).catch((e) => {
      throw new Error(e);
    });
  });

  test('Should add and delete repository with BASIC auth', (done) => {
    const config = new ClientConfigBuilder()
      .serverConfig(Config.serverAddress)
      .useBasicAuthentication('admin', 'root');
    const serverClient = new GraphDBServerClient(config);
    createRepository(serverClient, done);
  });

  test('Should add and delete repository with TOKEN auth', (done) => {
    const config = new ClientConfigBuilder()
      .serverConfig(Config.serverAddress)
      .useGdbTokenAuthentication('admin', 'root');
    const serverClient = new GraphDBServerClient(config);
    createRepository(serverClient, done);
  });
});

function createRepository(serverClient, done) {
  const config = new RepositoryConfig(NEW_REPO, '',
    new Map(), '', 'Repo title', RepositoryType.FREE);

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
      done();
    }).catch((e) => {
      throw new Error(e);
    });
}
