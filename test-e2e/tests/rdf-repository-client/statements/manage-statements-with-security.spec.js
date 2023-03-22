const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const path = require('path');
const Utils = require('utils.js');
const Config = require('config.js');

describe('Manage statements with security', () => {
  const authConfig = Config.restApiBasicAuthConfig;
  const rdfBasicAuthClient = new RDFRepositoryClient(authConfig);

  const authTokenConfig = Config.restApiTokenAuthConfig;
  const rdfTokenAuthClient = new RDFRepositoryClient(authTokenConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      return Utils.toggleSecurity(true);
    }).catch((e) => {
      throw new Error(e);
    });
  });

  afterAll(() => {
    return Utils.toggleSecurity(false).then(() => {
      return Utils.deleteRepo('Test_repo');
    }).catch((e) => {
      throw new Error(e);
    });
  });

  test('Should add and delete all statements with BASIC auth', () => {
    return addAndDeleteStatements(rdfBasicAuthClient);
  });

  test('Should add and delete all statements with TOKEN auth', () => {
    return addAndDeleteStatements(rdfTokenAuthClient);
  });
});

function addAndDeleteStatements(client) {
  const wineRdf = path.resolve(__dirname, './../../data/wine.rdf');
  return client.addFile(wineRdf, RDFMimeType.RDF_XML, null, null)
    .then(() => {
      return client.deleteAllStatements();
    }).then(() => {
      return client.getSize();
    }).then((response) => {
      expect(response).toBe(0);
    }).catch((e) => {
      throw new Error(e);
    });
}
