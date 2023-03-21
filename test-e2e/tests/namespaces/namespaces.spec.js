const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Namespaces management', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should be able to create and delete namespaces', () => {
    return rdfClient.getNamespaces().then((namespaces) => {
      expect(namespaces.length).toEqual(27);
    }).then(() => {
      return rdfClient.saveNamespace('new', 'http://new.namespace.com/schema#');
    }).then(() => {
      return rdfClient.getNamespace('new');
    }).then((namespace) => {
      expect(namespace.value).toEqual('http://new.namespace.com/schema#');
      return rdfClient.saveNamespace('new', 'http://new.namespace.com/schema1#');
    }).then(() => {
      return rdfClient.getNamespace('new');
    }).then((namespace) => {
      expect(namespace.value).toEqual('http://new.namespace.com/schema1#');
      return rdfClient.deleteNamespace('new');
    }).then(() => {
      return rdfClient.getNamespaces();
    }).then((namespaces) => {
      expect(namespaces.length).toEqual(27);
    });
  });
});
