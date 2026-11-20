const ServerClientConfig = require('server/server-client-config');
const GraphDBServerClient = require('server/graphdb-server-client');
const RepositoryType = require('repository/repository-type');
const RepositoryClientConfig = require('repository/repository-client-config');
const RepositoryConfig = require('repository/repository-config');
const GraphdbServerStubs = require('../stubs/graphdb-server-stubs');
const AppSettings = require('server/app-settings');

const GET_REMOTE_REPOSITORIES_RESPONSE = 'server/data/graphdb-server-get-remote-repositories-response.json';

describe('ServerClient', () => {
  let config;
  let server;

  beforeEach(() => {
    config = new ServerClientConfig('http://server/url')
      .setTimeout(0)
      .setHeaders({});
    server = new GraphDBServerClient(config);
  });

  test('getRepositories should return repository IDs for local and remote GDB instances', () => {
    GraphdbServerStubs.stubGetRepositoriesRequest(server);
    return server.getRepositories()
      .then((response) => {
        expect(response.getRepositoryIds()).toEqual(['localRepoOneId', 'localRepoTwoId']);
      });
  });

  test('getRepositories should call the /all endpoint for the given location', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: {}});
    return server.getRepositories('http://example.com:7200')
      .then(() => {
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('url', '/rest/repositories/all?location=http%3A%2F%2Fexample.com%3A7200');
      });
  });

  test('getUsers should return the list of users', () => {
    GraphdbServerStubs.stubRequest(server, [{username: 'user_one'}, {username: 'user_two'}]);
    return server.getUsers()
      .then((users) => {
        expect(users.map((user) => user.getUsername())).toEqual(['user_one', 'user_two']);
      });
  });

  test('getRepository should check the existence in the given location', () => {
    const repositoryConfig = new RepositoryClientConfig('http://example.com:7200')
      .setEndpoints(['http://example.com:7200/repositories/repoTwoId']);
    jest.spyOn(server, 'hasRepository').mockResolvedValue(true);
    return server.getRepository('repoTwoId', repositoryConfig, 'http://example.com:7200')
      .then(() => {
        expect(server.hasRepository).toHaveBeenCalledWith('repoTwoId', 'http://example.com:7200');
      });
  });

  test('hasRepository should throw an error if called without an ID', () => {
    expect(() => server.hasRepository()).toThrow('Repository id is required parameter!');
  });

  test('hasRepository should return true if repository with the passed ID exists in the local GDB instance', () => {
    GraphdbServerStubs.stubGetRepositoriesRequest(server);
    return server.hasRepository('localRepoOneId')
      .then((hasRepository) => {
        expect(hasRepository).toBeTruthy();
      });
  });

  test('hasRepository should return false if repository with the passed ID exists in the local GDB instance but check it in the remote repository', () => {
    GraphdbServerStubs.stubGetRepositoriesRequest(server, GET_REMOTE_REPOSITORIES_RESPONSE);
    return server.hasRepository('localRepoOneId', 'http://example.com:7200')
      .then((hasRepository) => {
        expect(hasRepository).toBeFalsy();
      });
  });

  test('hasRepository should return true if repository with the passed ID exists in the remote GDB instance', () => {
    GraphdbServerStubs.stubGetRepositoriesRequest(server, GET_REMOTE_REPOSITORIES_RESPONSE);
    return server.hasRepository('remoteRepoTwoId', 'http://example.com:7200')
      .then((hasRepository) => {
        expect(hasRepository).toBeTruthy();
      });
  });

  test('hasRepository should return false if repository with the passed ID exists in the remote GDB instance but check it in the local repository', () => {
    GraphdbServerStubs.stubGetRepositoriesRequest(server, GET_REMOTE_REPOSITORIES_RESPONSE);
    return server.hasRepository('localRepoOneId')
      .then((hasRepository) => {
        expect(hasRepository).toBeFalsy();
      });
  });

  test('deleteRepository should throw an error if called without an ID', () => {
    expect(() => server.deleteRepository()).toThrow('Repository id is required parameter!');
  });

  test('deleteRepository should call server to delete a local repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.deleteRepository('repoOneId')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'delete');
        expect(config).toHaveProperty('url', '/rest/repositories/repoOneId');
      });
  });

  test('deleteRepository should call server to delete a remote repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.deleteRepository('repositoryTwoId', 'http://example.com:7200')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'delete');
        expect(config)
          .toHaveProperty('url', '/rest/repositories/repositoryTwoId?location=http%3A%2F%2Fexample.com%3A7200');
      });
  });

  test('should URL-encode the location query parameter', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.deleteRepository('repositoryTwoId', 'http://example.com:7200/a&b=c')
      .then(() => {
        const config = requestSpy.mock.calls[0][0];
        expect(config)
          .toHaveProperty(
            'url', '/rest/repositories/repositoryTwoId?location=http%3A%2F%2Fexample.com%3A7200%2Fa%26b%3Dc');
      });
  });

  test('getDefaultConfig should throw an error if called without a repository type', () => {
    expect(() => server.getDefaultConfig()).toThrow('Repository type is required parameter!');
  });

  test('getDefaultConfig should call server to get the default repository configuration', () => {
    const mockData = {
      id: 'graphdb',
      location: undefined,
      params: {},
      sesameType: 'graphdb:SailRepository',
      title: 'Default GraphDB Config',
      type: 'graphdb'
    };
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request')
      .mockResolvedValue({data: mockData});

    return server.getDefaultConfig(RepositoryType.GRAPHDB)
      .then((config) => {
        expect(requestSpy).toHaveBeenCalled();
        const reqConfig = requestSpy.mock.calls[0][0];
        expect(reqConfig).toHaveProperty('method', 'get');
        expect(reqConfig).toHaveProperty('url', '/rest/repositories/default-config/graphdb');
        expect(config.toJson()).toStrictEqual(mockData);
      });
  });

  test('getRepositoryConfig should throw an error if called without a repository ID', () => {
    expect(() => server.getRepositoryConfig()).toThrow('Repository id is required parameter!');
  });

  test('getRepositoryConfig should call server to get the local repository configuration', () => {
    const mockData = {
      id: 'repositoryOneId',
      location: undefined,
      params: {},
      sesameType: 'graphdb:SailRepository',
      title: 'Repository One',
      type: 'graphdb'
    };
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request')
      .mockResolvedValue({data: mockData});

    return server.getRepositoryConfig('repositoryOneId')
      .then((config) => {
        expect(requestSpy).toHaveBeenCalled();
        const reqConfig = requestSpy.mock.calls[0][0];
        expect(reqConfig).toHaveProperty('method', 'get');
        expect(reqConfig).toHaveProperty('url', '/rest/repositories/repositoryOneId');
        expect(config.toJson()).toStrictEqual(mockData);
      });
  });

  test('getRepositoryConfig should call server to get the remote repository configuration', () => {
    const mockData = {
      id: 'repoTwoId',
      location: 'http://example.com:7200',
      params: {},
      sesameType: 'ontop:OntopRepository',
      title: 'Remote Repository',
      type: 'ontop'
    };
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request')
      .mockResolvedValue({data: mockData});

    return server.getRepositoryConfig('repoTwoId', 'http://example.com:7200')
      .then((config) => {
        expect(requestSpy).toHaveBeenCalled();
        const reqConfig = requestSpy.mock.calls[0][0];
        expect(reqConfig).toHaveProperty('method', 'get');
        expect(reqConfig).toHaveProperty('url', '/rest/repositories/repoTwoId?location=http%3A%2F%2Fexample.com%3A7200');
        expect(config.toJson()).toStrictEqual(mockData);
      });
  });

  test('downloadRepositoryConfig should throw an error if called without a repository ID', () => {
    expect(() => server.downloadRepositoryConfig()).toThrow('Repository id is required parameter!');
  });

  test('downloadRepositoryConfig should call server to download the local repository configuration', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: {}});

    return server.downloadRepositoryConfig('repoOneId')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'get');
        expect(config).toHaveProperty('url', '/rest/repositories/repoOneId');
        expect(config.headers).toHaveProperty('Accept', 'text/turtle');
      });
  });

  test('downloadRepositoryConfig should call server to get the remote repository configuration', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: {}});

    return server.downloadRepositoryConfig('repoTwoId', 'http://example.com:7200')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'get');
        expect(config)
          .toHaveProperty('url', '/rest/repositories/repoTwoId?location=http%3A%2F%2Fexample.com%3A7200');
        expect(config.headers).toHaveProperty('Accept', 'text/turtle');
      });
  });

  test('createRepository should throw an error if called without a config', () => {
    expect(() => server.createRepository()).toThrow('RepositoryConfig is required parameter!');
  });

  test('createRepository should call server to create a local repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
    const repositoryConfig = new RepositoryConfig({
      id: 'new-repo-id',
      location: undefined,
      params: undefined,
      sesameType: 'graphdb:SailRepository',
      title: 'The new repository title',
      type: RepositoryType.GRAPHDB});

    return server.createRepository(repositoryConfig)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/repositories');
        expect(config).toHaveProperty('data', {
          'id': 'new-repo-id',
          'location': undefined,
          'params': {},
          'sesameType': 'graphdb:SailRepository',
          'title': 'The new repository title',
          'type': 'graphdb'
        });
      });
  });

  test('createRepository should call server to create a remote repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
    const repositoryConfig = new RepositoryConfig({id: 'new-repo-id', location: 'http://example.com:7200', params: undefined, sesameType: 'graphdb:SailRepository', title: 'The new repository title', type: RepositoryType.ONTOP});

    return server.createRepository(repositoryConfig)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/repositories');
        expect(config).toHaveProperty('data', {
          'id': 'new-repo-id',
          'location': 'http://example.com:7200',
          'params': {},
          'sesameType': 'graphdb:SailRepository',
          'title': 'The new repository title',
          'type': 'ontop'
        });
      });
  });

  test('updateRepository should throw an error if called without a config', () => {
    expect(() => server.updateRepository()).toThrow('RepositoryConfig is required parameter!');
  });

  test('updateRepository should throw an error if the config has no id', () => {
    const repositoryConfig = new RepositoryConfig({
      location: undefined,
      params: undefined,
      sesameType: 'graphdb:SailRepository',
      title: 'The repository title',
      type: RepositoryType.GRAPHDB});
    expect(() => server.updateRepository(repositoryConfig)).toThrow('Repository id is required parameter!');
  });

  test('updateRepository should call server to update a local repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
    const repositoryConfig = new RepositoryConfig({
      id: 'repo-id',
      location: undefined,
      params: undefined,
      sesameType: 'graphdb:SailRepository',
      title: 'The updated repository title',
      type: RepositoryType.GRAPHDB});

    return server.updateRepository(repositoryConfig)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'put');
        expect(config).toHaveProperty('url', '/rest/repositories/repo-id');
        expect(config).toHaveProperty('data', {
          'id': 'repo-id',
          'location': undefined,
          'params': {},
          'sesameType': 'graphdb:SailRepository',
          'title': 'The updated repository title',
          'type': 'graphdb'
        });
      });
  });

  test('updateRepository should call server to update a remote repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
    const repositoryConfig = new RepositoryConfig({id: 'repo-id', location: 'http://example.com:7200', params: undefined, sesameType: 'graphdb:SailRepository', title: 'The updated repository title', type: RepositoryType.ONTOP});

    return server.updateRepository(repositoryConfig)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'put');
        expect(config).toHaveProperty('url', '/rest/repositories/repo-id');
        expect(config).toHaveProperty('data', {
          'id': 'repo-id',
          'location': 'http://example.com:7200',
          'params': {},
          'sesameType': 'graphdb:SailRepository',
          'title': 'The updated repository title',
          'type': 'ontop'
        });
      });
  });

  test('rotateDataEncryptionKey should throw an error if called without a repository ID', () => {
    expect(() => server.rotateDataEncryptionKey()).toThrow('Repository id is required parameter!');
  });

  test('rotateDataEncryptionKey should call server to rotate the data encryption key of a local repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.rotateDataEncryptionKey('repoOneId')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/repositories/repoOneId/rotate-data-encryption-key');
      });
  });

  test('rotateDataEncryptionKey should call server to rotate the data encryption key of a remote repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.rotateDataEncryptionKey('repoTwoId', 'http://example.com:7200')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config)
          .toHaveProperty(
            'url', '/rest/repositories/repoTwoId/rotate-data-encryption-key?location=http%3A%2F%2Fexample.com%3A7200');
      });
  });

  test('isSecurityEnabled should return true when security is enabled', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: true});

    return server.isSecurityEnabled()
      .then((result) => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'get');
        expect(config).toHaveProperty('url', '/rest/security');
        expect(result).toBeTruthy();
      });
  });

  test('isSecurityEnabled should return false when security is disabled', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: false});

    return server.isSecurityEnabled()
      .then((result) => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'get');
        expect(config).toHaveProperty('url', '/rest/security');
        expect(result).toBe(false);
      });
  });

  test('toggleSecurity should call the GraphDB instance to enable the security', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.toggleSecurity(true)
      .then((result) => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/security?useSecurity=true');
        expect(config).toHaveProperty('data', 'true');
      });
  });

  test('toggleSecurity should call the GraphDB instance to disable the security', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.toggleSecurity(false)
      .then((result) => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/security?useSecurity=false');
        expect(config).toHaveProperty('data', 'false');
      });
  });

  test('updateFreeAccess should enable the free access status of the GraphDB instance', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    const authorities = ['WRITE_REPO_Test_repo', 'READ_REPO_Test_repo'];
    const appSettings = new AppSettings({
      DEFAULT_INFERENCE: true, DEFAULT_SAMEAS: true, IGNORE_SHARED_QUERIES: true, EXECUTE_COUNT: true});

    return server.updateFreeAccess(true, authorities, appSettings)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/security/free-access');
        expect(config).toHaveProperty('data', {
          'appSettings': {
            'DEFAULT_INFERENCE': true,
            'DEFAULT_SAMEAS': true,
            'EXECUTE_COUNT': true,
            'IGNORE_SHARED_QUERIES': true,
            'DEFAULT_VIS_GRAPH_SCHEMA': true
          }, 'authorities': ['WRITE_REPO_Test_repo', 'READ_REPO_Test_repo'],
          'enabled': true
        });
      });
  });

  test('updateFreeAccess should disable the free access status of the GraphDB instance', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    const authorities = ['WRITE_REPO_Test_repo'];
    const appSettings = new AppSettings({
      DEFAULT_INFERENCE: false, DEFAULT_SAMEAS: false, IGNORE_SHARED_QUERIES: false, EXECUTE_COUNT: false});

    return server.updateFreeAccess(false, authorities, appSettings)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/security/free-access');
        expect(config).toHaveProperty('data', {
          'appSettings': {
            'DEFAULT_INFERENCE': false,
            'DEFAULT_SAMEAS': false,
            'EXECUTE_COUNT': false,
            'IGNORE_SHARED_QUERIES': false,
            'DEFAULT_VIS_GRAPH_SCHEMA': true
          }, 'authorities': ['WRITE_REPO_Test_repo'],
          'enabled': false
        });
      });
  });

  test('getFreeAccess should return true when free access is enabled', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request')
      .mockResolvedValue({data: {enabled: true, authorities: ['READ_REPO_Test_repo'], appSettings: {}}});

    return server.getFreeAccess()
      .then((result) => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'get');
        expect(config).toHaveProperty('url', '/rest/security/free-access');
        expect(result.isEnabled()).toBeTruthy();
        expect(result.getAuthorities()).toEqual(['READ_REPO_Test_repo']);
      });
  });

  test('getFreeAccess should return false when free access is disabled', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request')
      .mockResolvedValue({data: {enabled: false, authorities: [], appSettings: {}}});

    return server.getFreeAccess()
      .then((result) => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'get');
        expect(config).toHaveProperty('url', '/rest/security/free-access');
        expect(result.isEnabled()).toBeFalsy();
      });
  });

  test('createUser should call the GraphDB instance to create a user', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    const authorities = ['WRITE_REPO_Test_repo'];
    const appSettings = new AppSettings(
      {DEFAULT_INFERENCE: false, DEFAULT_SAMEAS: false, IGNORE_SHARED_QUERIES: false, EXECUTE_COUNT: false});

    return server.createUser('user_name', 'user_password', authorities, appSettings)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/security/users/user_name');
        expect(config).toHaveProperty('data', {
          'appSettings': {
            'DEFAULT_INFERENCE': false,
            'DEFAULT_SAMEAS': false,
            'EXECUTE_COUNT': false,
            'IGNORE_SHARED_QUERIES': false,
            'DEFAULT_VIS_GRAPH_SCHEMA': true
          },
          'grantedAuthorities': ['WRITE_REPO_Test_repo'],
          'password': 'user_password',
          'username': 'user_name'
        });
      });
  });

  test('updateUser should call the GraphDB instance to update the user', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    const authorities = ['WRITE_REPO_Test_repo'];
    const appSettings = new AppSettings(
      {DEFAULT_INFERENCE: false, DEFAULT_SAMEAS: false, IGNORE_SHARED_QUERIES: false, EXECUTE_COUNT: false});

    return server.updateUser('user_name', 'user_password', authorities, appSettings)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'put');
        expect(config).toHaveProperty('url', '/rest/security/users/user_name');
        expect(config).toHaveProperty('data', {
          'appSettings': {
            'DEFAULT_INFERENCE': false,
            'DEFAULT_SAMEAS': false,
            'EXECUTE_COUNT': false,
            'IGNORE_SHARED_QUERIES': false,
            'DEFAULT_VIS_GRAPH_SCHEMA': true
          },
          'grantedAuthorities': ['WRITE_REPO_Test_repo'],
          'password': 'user_password',
          'username': 'user_name'
        });
      });
  });

  test('updateUserData should call the GraphDB instance to update the user data', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();


    return server.updateUserData('user_name', 'user_password')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'patch');
        expect(config).toHaveProperty('url', '/rest/security/users/user_name');
        expect(config).toHaveProperty('data', {
          'appSettings': {},
          'password': 'user_password',
          'username': 'user_name'
        });
      });
  });

  test('getUser should call the GraphDB instance to fetch a user by its name', () => {
    GraphdbServerStubs.stubGetUserRequest(server);
    return server.getUser('user_name')
      .then((response) => {
        expect(response.getUsername()).toBe('test_user');
        expect(response.getPassword()).toBe('');
        expect(response.getGrantedAuthorities()).toEqual(['ROLE_USER']);
        expect(response.getAppSettings()).toEqual({
          'DEFAULT_INFERENCE': false,
          'DEFAULT_SAMEAS': false,
          'EXECUTE_COUNT': true,
          'IGNORE_SHARED_QUERIES': false
        });
        expect(response.getDateCreated()).toBe(1742827204075);
      });
  });

  test('deleteUser should call the GraphDB instance to delete a user', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.deleteUser('user_name')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'delete');
        expect(config).toHaveProperty('url', '/rest/security/users/user_name');
      });
  });

  test.each([
    ['createUser', 'post', (username) => server.createUser(username, 'user_password')],
    ['updateUser', 'put', (username) => server.updateUser(username, 'user_password')],
    ['updateUserData', 'patch', (username) => server.updateUserData(username, 'user_password')],
    ['getUser', 'get', (username) => server.getUser(username)],
    ['deleteUser', 'delete', (username) => server.deleteUser(username)]
  ])('%s should URL-encode the username in the request path', (name, method, call) => {
    // getUser returns a parsed UserResponse, others return void
    const mockData = name === 'getUser' ? {data: {username: 'test', password: '', grantedAuthorities: [], appSettings: {}}} : {};
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue(mockData);

    return call('a#b+c%d?e f!\'()*/g')
      .then(() => {
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', method);
        expect(config).toHaveProperty('url', '/rest/security/users/a%23b%2Bc%25d%3Fe%20f%21%27%28%29%2A/g');
      });
  });

  test('restartRepository should throw an error if called without a repository ID', () => {
    expect(() => server.restartRepository()).toThrow('Repository id is required parameter!');
  });

  test('restartRepository should call server to restart a local repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.restartRepository('repoOneId')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/repositories/repoOneId/restart');
      });
  });

  test('restartRepository should call server to restart a remote repository', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

    return server.restartRepository('repositoryTwoId', 'http://example.com:7200')
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config)
          .toHaveProperty('url', '/rest/repositories/repositoryTwoId/restart?location=http%3A%2F%2Fexample.com%3A7200');
      });
  });

  test('createRepository should support FEDX repository type', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
    const repositoryConfig = new RepositoryConfig({
      id: 'fedx-repo',
      location: undefined,
      params: undefined,
      sesameType: 'fedx:FedXRepository',
      title: 'FedX Repository',
      type: RepositoryType.FEDX
    });

    return server.createRepository(repositoryConfig)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'post');
        expect(config).toHaveProperty('url', '/rest/repositories');
        expect(config).toHaveProperty('data', {
          'id': 'fedx-repo',
          'location': undefined,
          'params': {},
          'sesameType': 'fedx:FedXRepository',
          'title': 'FedX Repository',
          'type': 'fedx'
        });
      });
  });

  test('updateRepository should support FEDX repository type', () => {
    const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
    const repositoryConfig = new RepositoryConfig({
      id: 'fedx-repo',
      location: undefined,
      params: undefined,
      sesameType: 'fedx:FedXRepository',
      title: 'FedX Repository Updated',
      type: RepositoryType.FEDX
    });

    return server.updateRepository(repositoryConfig)
      .then(() => {
        expect(requestSpy).toHaveBeenCalled();
        const config = requestSpy.mock.calls[0][0];
        expect(config).toHaveProperty('method', 'put');
        expect(config).toHaveProperty('url', '/rest/repositories/fedx-repo');
        expect(config).toHaveProperty('data', {
          'id': 'fedx-repo',
          'location': undefined,
          'params': {},
          'sesameType': 'fedx:FedXRepository',
          'title': 'FedX Repository Updated',
          'type': 'fedx'
        });
      });
  });
});
