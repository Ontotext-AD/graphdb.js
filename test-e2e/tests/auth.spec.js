const {RDFRepositoryClient} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {ServerClient, ServerClientConfig} = require('graphdb').server;
const path = require('path');
const Utils = require('utils');
const Config = require('config');

describe('Should test auth', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiBasicAuthConfig);

  beforeAll((done) => {
    Utils.createRepo(Config.testRepoPath).then(() => {
      const wineRdf = path.resolve(__dirname, './data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
    }).then(() => {
      return Utils.toggleSecurity(true);
    }).then(() => {
      done();
    });
  });

  afterAll(() => {
    return Utils.toggleSecurity(false).then(() => {
      return Utils.deleteRepo('Test_repo');
    });
  });

  test('Should delete all statements', () => {
    return rdfClient.deleteAllStatements().then(() => {
      return rdfClient.getSize();
    }).then((response) => {
      return expect(response).toBe(0);
    }).catch((e) => {
      throw new Error(e);
    });
  });

  test('Should delete secured repo via server client', () => {
    Utils.createSecuredRepo(Config.testRepo2Path);
    const serverConfig = new ServerClientConfig(Config.serverAddress, 10000,
      new Map(), 'admin', 'root', true, true);
    const serverClient = new ServerClient(serverConfig);
    serverClient.deleteRepository('Test_repo_2').then(() => {
      return serverClient.hasRepository('Test_repo_2');
    }).then((resp) => {
      return expect(resp).toBeFalsy();
    }).catch((e) => {
      throw new Error(e);
    });
  });
});
