const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Statements delete', () => {

  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should delete all statements', () => {
    return rdfClient.deleteAllStatements().then(() => {
      return rdfClient.getSize();
    }).then((response) => {
      expect(response).toBe(0);
    });
  });
});
