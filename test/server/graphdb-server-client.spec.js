const ServerClientConfig = require('server/server-client-config');
const GraphDBServerClient = require('server/graphdb-server-client');
const RepositoryType = require('repository/repository-type');
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

    test('getRepositoryIDs should return repository IDs for local and remote GDB instances', () => {
        GraphdbServerStubs.stubGetRepositoriesRequest(server);
        return server.getRepositoryIDs()
            .then((repositoryIDs) => {
                expect(repositoryIDs).toEqual(['localRepoOneId', 'localRepoTwoId']);
            });
    });

    test('hasRepository should throw an error if called without an ID', () => {
        expect(() => server.hasRepository()).toThrow('Repository id is required parameter!');
    });

    test('hasRepository should return true if repository with the passed ID exists in the local GDB instance', () => {
        GraphdbServerStubs.stubGetRepositoriesRequest(server);
        return server.hasRepository('localRepoOneId')
            .then(hasRepository => {
                expect(hasRepository).toBeTruthy();
            });
    });

    test('hasRepository should return false if repository with the passed ID exists in the local GDB instance but check it in the remote repository', () => {
        GraphdbServerStubs.stubGetRepositoriesRequest(server, GET_REMOTE_REPOSITORIES_RESPONSE);
        return server.hasRepository('localRepoOneId', 'http://example.com:7200')
            .then(hasRepository => {
                expect(hasRepository).toBeFalsy();
            });
    });

    test('hasRepository should return true if repository with the passed ID exists in the remote GDB instance', () => {
        GraphdbServerStubs.stubGetRepositoriesRequest(server, GET_REMOTE_REPOSITORIES_RESPONSE);
        return server.hasRepository('remoteRepoTwoId', 'http://example.com:7200')
            .then(hasRepository => {
                expect(hasRepository).toBeTruthy();
            });
    });

    test('hasRepository should return false if repository with the passed ID exists in the remote GDB instance but check it in the local repository', () => {
        GraphdbServerStubs.stubGetRepositoriesRequest(server, GET_REMOTE_REPOSITORIES_RESPONSE);
        return server.hasRepository('localRepoOneId')
            .then(hasRepository => {
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
                expect(config).toHaveProperty('url', '/rest/repositories/repositoryTwoId?location=http://example.com:7200');
            });
    });

    test('getDefaultConfig should throw an error if called without a repository type', () => {
        expect(() => server.getDefaultConfig()).toThrow('Repository type is required parameter!');
    });

    test('getDefaultConfig should call server to get the default repository configuration', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

        return server.getDefaultConfig(RepositoryType.GRAPHDB)
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'get');
                expect(config).toHaveProperty('url', '/rest/repositories/default-config/graphdb');
            });
    });

    test('getRepositoryConfig should throw an error if called without a repository ID', () => {
        expect(() => server.getRepositoryConfig()).toThrow('Repository id is required parameter!');
    });

    test('getRepositoryConfig should call server to get the local repository configuration', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

        return server.getRepositoryConfig('repositoryOneId')
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'get');
                expect(config).toHaveProperty('url', '/rest/repositories/repositoryOneId');
            });
    });

    test('getRepositoryConfig should call server to get the remote repository configuration', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

        return server.getRepositoryConfig('repoTwoId', 'http://example.com:7200')
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'get');
                expect(config).toHaveProperty('url', '/rest/repositories/repoTwoId?location=http://example.com:7200');
            });
    });

    test('downloadRepositoryConfig should call server to download the local repository configuration', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: {}});

        return server.downloadRepositoryConfig('repoOneId')
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'get');
                expect(config).toHaveProperty('url', '/rest/repositories/repoOneId/download-ttl');
            });
    });

    test('downloadRepositoryConfig should call server to get the remote repository configuration', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: {}});

        return server.downloadRepositoryConfig('repoTwoId', 'http://example.com:7200')
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'get');
                expect(config).toHaveProperty('url', '/rest/repositories/repoTwoId/download-ttl?location=http://example.com:7200');
            });
    });

    test('createRepository should call server to create a local repository', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
        const repositoryConfig = new RepositoryConfig('new-repo-id', undefined, undefined, 'graphdb:SailRepository', 'The new repository title', RepositoryType.GRAPHDB);

        return server.createRepository(repositoryConfig)
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'put');
                expect(config).toHaveProperty('url', '/rest/repositories/new-repo-id');
                expect(config).toHaveProperty('data', {
                    "id": "new-repo-id",
                    "location": undefined,
                    "params": {},
                    "sesameType": "graphdb:SailRepository",
                    "title": "The new repository title",
                    "type": "graphdb"
                });
            });
    });

    test('createRepository should call server to create a remote repository', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();
        const repositoryConfig = new RepositoryConfig('new-repo-id', 'http://example.com:7200', undefined, 'graphdb:SailRepository', 'The new repository title', RepositoryType.ONTOP);

        return server.createRepository(repositoryConfig)
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'put');
                expect(config).toHaveProperty('url', '/rest/repositories/new-repo-id?location=http://example.com:7200');
                expect(config).toHaveProperty('data', {
                    "id": "new-repo-id",
                    "location": "http://example.com:7200",
                    "params": {},
                    "sesameType": "graphdb:SailRepository",
                    "title": "The new repository title",
                    "type": "ontop"
                });
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
                expect(result.response.data).toBeTruthy();
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
                expect(result.response.data).toBeFalsy();
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
        const appSettings = new AppSettings(true, true, true, true);

        return server.updateFreeAccess(true, authorities, appSettings)
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'post');
                expect(config).toHaveProperty('url', '/rest/security/free-access');
                expect(config).toHaveProperty('data', {
                    "appSettings": {
                        "DEFAULT_INFERENCE": true,
                        "DEFAULT_SAMEAS": true,
                        "EXECUTE_COUNT": true,
                        "IGNORE_SHARED_QUERIES": true
                    }, "authorities": ["WRITE_REPO_Test_repo", "READ_REPO_Test_repo"],
                    "enabled": true
                });
            });
    });

    test('updateFreeAccess should disable the free access status of the GraphDB instance', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

        const authorities = ['WRITE_REPO_Test_repo'];
        const appSettings = new AppSettings(false, false, false, false);

        return server.updateFreeAccess(false, authorities, appSettings)
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'post');
                expect(config).toHaveProperty('url', '/rest/security/free-access');
                expect(config).toHaveProperty('data', {
                    "appSettings": {
                        "DEFAULT_INFERENCE": false,
                        "DEFAULT_SAMEAS": false,
                        "EXECUTE_COUNT": false,
                        "IGNORE_SHARED_QUERIES": false
                    }, "authorities": ["WRITE_REPO_Test_repo"],
                    "enabled": false
                });
            });
    });

    test('getFreeAccess should return true when free access is enabled', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: true});

        return server.getFreeAccess()
            .then((result) => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'get');
                expect(config).toHaveProperty('url', '/rest/security/free-access');
                expect(result.response.data).toBeTruthy();
            });
    });

    test('getFreeAccess should return false when free access is disabled', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue({data: false});

        return server.getFreeAccess()
            .then((result) => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'get');
                expect(config).toHaveProperty('url', '/rest/security/free-access');
                expect(result.response.data).toBeFalsy();
            });
    });

    test('createUser should call the GraphDB instance to create a user', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

        const authorities = ['WRITE_REPO_Test_repo'];
        const appSettings = new AppSettings(false, false, false, false);

        return server.createUser("user_name", "user_password", authorities, appSettings)
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'post');
                expect(config).toHaveProperty('url', '/rest/security/users/user_name');
                expect(config).toHaveProperty('data', {
                    "appSettings": {
                        "DEFAULT_INFERENCE": false,
                        "DEFAULT_SAMEAS": false,
                        "EXECUTE_COUNT": false,
                        "IGNORE_SHARED_QUERIES": false
                    },
                    "grantedAuthorities": ["WRITE_REPO_Test_repo"],
                    "password": "user_password",
                    "username": "user_name",
                });
            });
    });

    test('updateUser should call the GraphDB instance to update the user', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

        const authorities = ['WRITE_REPO_Test_repo'];
        const appSettings = new AppSettings(false, false, false, false);

        return server.updateUser("user_name", "user_password", authorities, appSettings)
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'put');
                expect(config).toHaveProperty('url', '/rest/security/users/user_name');
                expect(config).toHaveProperty('data', {
                    "appSettings": {
                        "DEFAULT_INFERENCE": false,
                        "DEFAULT_SAMEAS": false,
                        "EXECUTE_COUNT": false,
                        "IGNORE_SHARED_QUERIES": false
                    },
                    "grantedAuthorities": ["WRITE_REPO_Test_repo"],
                    "password": "user_password",
                    "username": "user_name",
                });
            });
    });

    test('updateUserData should call the GraphDB instance to update the user data', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();


        return server.updateUserData("user_name", "user_password")
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'patch');
                expect(config).toHaveProperty('url', '/rest/security/users/user_name');
                expect(config).toHaveProperty('data', {
                    "appSettings": {},
                    "password": "user_password",
                    "username": "user_name",
                });
            });
    });

    test('getUser should call the GraphDB instance to fetch a user by its name', () => {
        GraphdbServerStubs.stubGetUserRequest(server)
        return server.getUser('user_name')
            .then((response) => {
                expect(response).toHaveProperty('response.data', {
                    "appSettings": {
                        "DEFAULT_INFERENCE": false,
                        "DEFAULT_SAMEAS": false,
                        "EXECUTE_COUNT": true,
                        "IGNORE_SHARED_QUERIES": false
                    },
                    "dateCreated": 1742827204075,
                    "gptThreads": [],
                    "grantedAuthorities": ["ROLE_USER"],
                    "password": "",
                    "username": "test_user"
                })
            });
    });

    test('deleteUser should call the GraphDB instance to delete a user', () => {
        const requestSpy = jest.spyOn(server.httpClient.axios, 'request').mockResolvedValue();

        return server.deleteUser("user_name")
            .then(() => {
                expect(requestSpy).toHaveBeenCalled();
                const config = requestSpy.mock.calls[0][0];
                expect(config).toHaveProperty('method', 'delete');
                expect(config).toHaveProperty('url', '/rest/security/users/user_name');
            });
    });
});
