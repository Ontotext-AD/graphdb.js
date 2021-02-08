const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const path = require('path');
const Utils = require('utils');
const Config = require('config');

describe('Should test repository client auth', () => {
  const authConfig = Config.restApiBasicAuthConfig;
  const rdfBasicAuthClient = new RDFRepositoryClient(authConfig);

  const authTokenConfig = Config.restApiTokenAuthConfig;
  const rdfTokenAuthClient = new RDFRepositoryClient(authTokenConfig);


  beforeAll((done) => {
    Utils.createRepo(Config.testRepoPath)
      .then(() => {
        return Utils.toggleSecurity(true);
      }).then(() => {
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  afterAll((done) => {
    return Utils.toggleSecurity(false)
      .then(() => {
        return Utils.deleteRepo('Test_repo');
      }).then(() => {
        done();
      }).catch((e) => {
        throw new Error(e);
      });
  });

  test('Should add and delete all statements with BASIC auth', (done) => {
    addAndDeleteStatements(rdfBasicAuthClient, done);
  });

  test('Should add and delete all statements with TOKEN auth', (done) => {
    addAndDeleteStatements(rdfTokenAuthClient, done);
  });
});

function addAndDeleteStatements(client, done) {
  const wineRdf = path.resolve(__dirname, './data/wine.rdf');
  return client.addFile(wineRdf, RDFMimeType.RDF_XML, null, null)
    .then(() => {
      return client.deleteAllStatements();
    }).then(() => {
      return client.getSize();
    }).then((response) => {
      expect(response).toBe(0);
      done();
    }).catch((e) => {
      throw new Error(e);
    });
}
