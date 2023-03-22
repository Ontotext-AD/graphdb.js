const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Namespaces delete', () => {

  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should delete all namespaces', () => {
    return rdfClient.deleteNamespaces().then(() => {
      return rdfClient.getNamespaces();
    }).then((resp) => {
      expect(resp.length).toBe(0)
    });
  });
});
