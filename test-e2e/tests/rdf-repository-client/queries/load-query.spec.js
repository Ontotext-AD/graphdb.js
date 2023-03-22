const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');
const {GetQueryPayload, QueryType, QueryLanguage, UpdateQueryPayload} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;
const express = require('express');

describe('Load query', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  // This test depends on loading a resource via URI -> serve test/data via Express static server
  let expressApp;
  beforeEach(() => {
    expressApp = express().use(express.static('tests/data/')).listen(3000);
  });

  afterEach(() => {
    // close is async and needs a Promise
    return new Promise(resolve => {
      expressApp.close(() => resolve());
    });
  });

  test('Should load data in a named graph', () => {
    let expected = Utils.loadFile('./data/queries/expected_results_load_data.json');

    let clearGraph = new UpdateQueryPayload()
      .setQuery('DROP GRAPH <http://example/worldcat/>');

    let loadData = new UpdateQueryPayload()
      .setQuery('LOAD <http://localhost:3000/experiment-worldcat.ttl> into graph <http://example/worldcat/>');

    let selectData = new GetQueryPayload()
      .setQuery('SELECT ?s ?p ?o FROM <http://example/worldcat/> WHERE {?s ?p ?o}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
      .setQueryLn(QueryLanguage.SPARQL);

    return rdfClient.update(loadData).then(() => {
      return rdfClient.query(selectData);
    }).then((resp) => {
      return Utils.readStream(resp);
    }).then((stream) => {
      expect(JSON.parse(stream)).toEqual(JSON.parse(expected));
      return rdfClient.update(clearGraph);
    });
  });
});
