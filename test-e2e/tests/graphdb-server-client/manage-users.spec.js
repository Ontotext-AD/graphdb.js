const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {
  GraphDBServerClient,
  AppSettings,
  ServerClientConfig
} = require('graphdb').server;
const {Authority} = require('graphdb').security;
const path = require('path');
const Utils = require('utils.js');
const Config = require('config.js');

const TEST_REPO_NAME = 'Test_repo';
const MAINTAINER = 'maintainer';
const ROLE_USERNAME = 'role_user';

describe('Manage GraphDB users', () => {
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
    });
  });

  afterAll(() => {
    return Utils.toggleSecurity(false)
      .then(() => {
        return Utils.deleteRepo(TEST_REPO_NAME);
      });
  });

  afterEach(() => {
    serverClient.logout(serverConfig);
  });

  test('Should create, read, update and delete users', () => {
    const expectedAppSettings = new AppSettings(true, true, true, false);
    const newAppSettings = new AppSettings(false, false, false, true);

    return serverClient.createUser('test_user', '123456')
      .then((response) => {
        return expect(response.response.status).toBe(201);
      }).then(() => {
        return serverClient.updateUser('test_user', '111222',
          [], new AppSettings(true, true, true, false));
      }).then((response) => {
        return expect(JSON.parse(response.response.config.data).password)
          .toBe('111222');
      }).then(() => {
        return serverClient.getUser('test_user');
      }).then((response) => {
        return expect(response.response.data.appSettings)
          .toStrictEqual(expectedAppSettings.toJson());
      }).then(() => {
        return serverClient.updateUserData('test_user',
          '111222', newAppSettings);
      }).then(() => {
        return serverClient.getUser('test_user');
      }).then((response) => {
        return expect(response.response.data.appSettings)
          .toStrictEqual(newAppSettings.toJson());
      }).then(() => {
        return serverClient.deleteUser('test_user');
      }).then((response) => {
        expect(response.response.status).toBe(204);
      }).catch((e) => {
        return serverClient.deleteUser('test_user').catch(() => {})
          .then(() => {
            throw e;
          });
      });
  });

  test.each([
    [Authority.USER],
    [Authority.MONITORING],
    [Authority.REPO_MANAGER],
    [Authority.ADMIN],
    [Authority.CLUSTER],
    [Authority.USER, Authority.CUSTOM_ROLE_PREFIX + 'TESTER']
  ])('Should grant the user role %s', (...authorities) => {
    return serverClient.createUser(ROLE_USERNAME, '123456', authorities)
      .then(() => {
        return serverClient.getUser(ROLE_USERNAME);
      }).then((response) => {
        expect(response.response.data.grantedAuthorities)
          .toEqual(expect.arrayContaining(authorities));
      }).finally(() => {
        return serverClient.deleteUser(ROLE_USERNAME).catch(() => {});
      });
  });

  test('Should grant GraphQL-only additional permissions', () => {
    const authorities = [
      Authority.USER,
      Authority.READ_REPO_PREFIX + TEST_REPO_NAME + Authority.GRAPHQL_ONLY_SUFFIX,
      Authority.WRITE_REPO_PREFIX + TEST_REPO_NAME + Authority.GRAPHQL_ONLY_SUFFIX
    ];

    return serverClient.createUser(ROLE_USERNAME, '123456', authorities)
      .then(() => {
        return serverClient.getUser(ROLE_USERNAME);
      }).then((response) => {
        expect(response.response.data.grantedAuthorities)
          .toEqual(expect.arrayContaining(authorities));
      }).finally(() => {
        return serverClient.deleteUser(ROLE_USERNAME).catch(() => {});
      });
  });

  test('Should grant and revoke the repository maintain permission', () => {
    const readWrite = [
      Authority.USER,
      Authority.READ_REPO_PREFIX + TEST_REPO_NAME,
      Authority.WRITE_REPO_PREFIX + TEST_REPO_NAME
    ];
    const maintain = [
      ...readWrite,
      Authority.MAINTAIN_REPO_PREFIX + TEST_REPO_NAME
    ];

    return serverClient.createUser(MAINTAINER, '123456', maintain)
      .then((response) => {
        return expect(response.response.status).toBe(201);
      }).then(() => {
        return serverClient.getUser(MAINTAINER);
      }).then((response) => {
        return expect(response.response.data.grantedAuthorities)
          .toEqual(expect.arrayContaining(maintain));
      }).then(() => {
        return serverClient.updateUser(MAINTAINER, undefined, readWrite);
      }).then((response) => {
        expect(response.response.status).toBe(200);
        return serverClient.getUser(MAINTAINER);
      }).then((response) => {
        return expect(response.response.data.grantedAuthorities)
          .not.toContain(Authority.MAINTAIN_REPO_PREFIX + TEST_REPO_NAME);
      }).finally(() => {
        return serverClient.deleteUser(MAINTAINER).catch(() => {});
      });
  });

  // GraphDB rejects an encoded '%' in the path with 400 when security is
  // enabled, so a username with '%' can be managed only without security.
  test.each(['a#b', 'a+b', 'a/b'])(
    'Should manage and log in the user %s', (username) => {
      const userConfig = new ServerClientConfig(Config.serverAddress)
        .useGdbTokenAuthentication(username, '123456');
      const userClient = new GraphDBServerClient(userConfig);

      return serverClient.createUser(username, '123456', [Authority.USER])
        .then((response) => {
          expect(response.response.status).toBe(201);
          return serverClient.getUser(username);
        }).then((response) => {
          expect(response.response.data.username).toBe(username);
          return serverClient.updateUser(username, '123456',
            [Authority.USER, Authority.READ_REPO_PREFIX + TEST_REPO_NAME]);
        }).then(() => {
          return serverClient.getUser(username);
        }).then((response) => {
          expect(response.response.data.grantedAuthorities)
            .toContain(Authority.READ_REPO_PREFIX + TEST_REPO_NAME);
          return userClient.getRepositoryIDs();
        }).then((repositoryIDs) => {
          expect(repositoryIDs).toContain(TEST_REPO_NAME);
          expect(userClient.user.getUsername()).toBe(username);
          return serverClient.deleteUser(username);
        }).then((response) => {
          expect(response.response.status).toBe(204);
          return expect(serverClient.getUser(username)).rejects
            .toHaveProperty('response.status', 404);
        }).finally(() => {
          return serverClient.deleteUser(username).catch(() => {});
        });
    });

  test('Should manage the user a%b when security is disabled', () => {
    const username = 'a%b';
    return Utils.toggleSecurity(false)
      .then(() => {
        return serverClient.createUser(username, '123456', [Authority.USER]);
      }).then((response) => {
        expect(response.response.status).toBe(201);
        return serverClient.updateUser(username, '123456',
          [Authority.USER, Authority.MONITORING]);
      }).then(() => {
        return serverClient.getUser(username);
      }).then((response) => {
        expect(response.response.data.username).toBe(username);
        expect(response.response.data.grantedAuthorities)
          .toContain(Authority.MONITORING);
        return serverClient.deleteUser(username);
      }).then((response) => {
        expect(response.response.status).toBe(204);
      }).finally(() => {
        return serverClient.deleteUser(username).catch(() => {})
          .then(() => Utils.toggleSecurity(true));
      });
  });
});
