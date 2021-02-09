/* eslint-disable max-len */
const {ServerClientConfig, ServerClient} = require('graphdb').server;
const {RepositoryClientConfig} = require('graphdb').repository;
const Utils = require('utils');
const Config = require('config');

describe('Should test repositories', () => {
  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      return Utils.createRepo(Config.testRepo2Path);
    });
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should verify repositories', () => {
    const config = new ServerClientConfig(Config.serverAddress);
    const client = new ServerClient(config);
    const repositoryClientConfig = new RepositoryClientConfig(Config.serverAddress)
      .setEndpoints([`${Config.serverAddress}/repositories/`])
      .setReadTimeout(3001)
      .setWriteTimeout(3001);

    return client.getRepositoryIDs().then((response) => {
      const expected = ['Test_repo', 'Test_repo_2'];
      expect(response.sort()).toEqual(expected);
      return client.hasRepository('Test_repo');
    }).then((response) => {
      expect(response).toBeTruthy();
      return client.deleteRepository('Test_repo_2');
    }).then(() => {
      return client.hasRepository('Test_repo_2');
    }).then((resp) => {
      expect(resp).toBeFalsy();
      return client.getRepository('Test_repo', repositoryClientConfig);
    }).then((response) => {
      expect(response.repositoryClientConfig.endpoints).toEqual([`${Config.serverAddress}/repositories/`]);
      expect(response.repositoryClientConfig.readTimeout).toBe(3001);
      expect(response.repositoryClientConfig.writeTimeout).toBe(3001);
      expect(response.repositoryClientConfig.headers).toStrictEqual({});
      expect(response.repositoryClientConfig.defaultRDFMimeType).toBe('application/sparql-results+json');
    });
  });
});
