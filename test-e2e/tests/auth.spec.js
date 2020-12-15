const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {ServerClient} = require('graphdb').server;
const path = require('path');
const Utils = require('utils');
const Config = require('config');

describe('Should test auth', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiBasicAuthConfig);

  beforeAll((done) => {
    Utils.createRepo(Config.testRepoPath).then(() => {
      let wineRdf = path.resolve(__dirname, './data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null).then(() => {
        return Utils.toggleSecurity(true).then(() => {
          done();
        });
      });
    });
  });

  afterAll(() => {
    return Utils.toggleSecurity(false).then(() => {
      return Utils.deleteRepo('Test_repo');
    });
  });

  test('Should list namespces', () => {
    rdfClient.getNamespaces().then(() => {
      return rdfClient.getSize();
    }).then((response) => {
      expect(response).toBe(1839);
    });
  });

  test('Should delete all statements', () => {
    return rdfClient.deleteAllStatements().then(() => {
      return rdfClient.getSize();
    }).then((response) => {
      expect(response).toBe(0);
    });
  });

  test('Should delete all namespaces', () => {
    return rdfClient.deleteNamespaces().then(() => {
      return rdfClient.getNamespaces();
    }).then((resp) => {
      expect(resp.length).toBe(0)
    });
  });


  test('Should delete secured repo via server client',  () => {
    Utils.createSecuredRepo(Config.testRepo2Path);
    const serverClient = new ServerClient(Config.serverBasicAuthConfig);
    serverClient.deleteRepository('Test_repo_2').then(()=> {
      return serverClient.hasRepository('Test_repo_2').then((resp) => {
        expect(resp).toBeFalsy();
      })
    })
  });
});
