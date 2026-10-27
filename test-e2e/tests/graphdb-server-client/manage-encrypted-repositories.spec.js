const {
  RDFRepositoryClient, RepositoryClientConfig,
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

// GraphDB must be started with a master key, see docker-compose-e2e.yml
const ENCRYPTED_REPO_NAME = 'Encrypted_repo';

describe('Manage encrypted GraphDB repositories', () => {
  const serverClient = new GraphDBServerClient(
    new ServerClientConfig(Config.serverAddress));
  const rdfClient = new RDFRepositoryClient(
    new RepositoryClientConfig(Config.serverAddress)
      .setEndpoints([`${Config.serverAddress}/repositories/${ENCRYPTED_REPO_NAME}`]));

  beforeAll(() => {
    return serverClient.getDefaultConfig(RepositoryType.GRAPHDB)
      .then((response) => {
        const params = response.response.data.params;
        params.storageEncryption.value = 'true';
        const config = new RepositoryConfig(ENCRYPTED_REPO_NAME, '', params,
          '', 'Encrypted repo', RepositoryType.GRAPHDB);
        return serverClient.createRepository(config);
      }).then(() => {
        const sampleTurtle = path.resolve(__dirname, './../data/sample-turtle.ttl');
        return rdfClient.addFile(sampleTurtle, RDFMimeType.TURTLE, null, null);
      });
  });

  afterAll(() => {
    return serverClient.deleteRepository(ENCRYPTED_REPO_NAME);
  });

  test('Should get the storage encryption of the repo config', () => {
    return serverClient.getRepositoryConfig(ENCRYPTED_REPO_NAME).then((response) => {
      expect(response.response.data.params.storageEncryption).toEqual({
        name: 'storageEncryption',
        label: 'Encrypt storage',
        value: 'true'
      });
    });
  });

  test('Should get the storage encryption of the repo config as turtle', () => {
    return serverClient.downloadRepositoryConfig(ENCRYPTED_REPO_NAME)
      .then((stream) => Utils.readStream(stream))
      .then((turtle) => {
        expect(turtle).toContain('graphdb:encrypt-storage "true"');
      });
  });

  test('Should rotate the data encryption key and keep the data readable', () => {
    let sizeBeforeRotation;
    return rdfClient.getSize()
      .then((size) => {
        sizeBeforeRotation = size;
        expect(size).toBeGreaterThan(0);
        return serverClient.rotateDataEncryptionKey(ENCRYPTED_REPO_NAME);
      }).then(() => {
        return rdfClient.getSize();
      }).then((size) => {
        expect(size).toEqual(sizeBeforeRotation);
      });
  });
});
