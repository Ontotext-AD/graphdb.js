const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Secured: Namespaces management', () => {
  const rdfSecuredClient =
    new RDFRepositoryClient(Config.restApiBasicAuthConfig);

  beforeAll(() => {
    return Utils.importDataSecurely(rdfSecuredClient);
  });

  afterAll(() => {
    return Utils.deleteRepoSecurely('Test_repo');
  });

  test('Should list namespaces', () => {
    return rdfSecuredClient.getNamespaces().then(() => {
      return rdfSecuredClient.getSize();
    }).then((response) => {
      expect(response).toBe(1839);
    });
  });

  test('Should delete all namespaces', () => {
    return rdfSecuredClient.deleteNamespaces().then(() => {
      return rdfSecuredClient.getNamespaces();
    }).then((resp) => {
      expect(resp.length).toBe(0);
    });
  });
});
