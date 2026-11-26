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
const ENCRYPTED_REPO_NAME = Utils.uniqueName('Encrypted_repo');

describe('Manage encrypted GraphDB repositories', () => {
  const serverClient = new GraphDBServerClient(
    new ServerClientConfig(Config.serverAddress));
  const rdfClient = new RDFRepositoryClient(
    new RepositoryClientConfig(Config.serverAddress)
      .setEndpoints([`${Config.serverAddress}/repositories/${ENCRYPTED_REPO_NAME}`]));

  beforeAll(() => {
    return serverClient.getDefaultConfig(RepositoryType.GRAPHDB)
      .then((config) => {
        const params = config.params;
        params.storageEncryption.value = 'true';
        const repositoryConfig = new RepositoryConfig({
          id: ENCRYPTED_REPO_NAME,
          location: '',
          params: params,
          sesameType: '',
          title: 'Encrypted repo',
          type: RepositoryType.GRAPHDB});
        return serverClient.createRepository(repositoryConfig);
      }).then(() => {
        const sampleTurtle = path.resolve(__dirname, './../data/sample-turtle.ttl');
        return rdfClient.addFile(sampleTurtle, RDFMimeType.TURTLE, null, null);
      });
  });

  afterAll(() => {
    return serverClient.deleteRepository(ENCRYPTED_REPO_NAME);
  });

  test('Should get the storage encryption of the repo config', () => {
    return serverClient.getRepositoryConfig(ENCRYPTED_REPO_NAME).then((config) => {
      expect(config.params.storageEncryption).toEqual({
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
