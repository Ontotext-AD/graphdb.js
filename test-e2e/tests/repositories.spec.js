const {RepositoryClientConfig} = require('graphdb').repository;
const {ServerClient, ServerClientConfig} = require('graphdb').server;
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
    let config = new ServerClientConfig(Config.serverAddress, 0, {});
    let client = new ServerClient(config);
    let repositoryClientConfig = new RepositoryClientConfig([`${Config.serverAddress}/repositories/`], {}, '', 3001, 3001);

    return client.getRepositoryIDs().then((response) => {
      let expected = ['Test_repo_2', 'Test_repo'];
      expect(response).toEqual(expected);
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
      expect(response.repositoryClientConfig.defaultRDFMimeType).toBe('');
    });
  });
});
