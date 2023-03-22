const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');
const {GetQueryPayload, QueryType, QueryLanguage, UpdateQueryPayload} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;

describe('Update query', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should make an INSERT query, verify the data has been inserted in a named graph and drop the graph', () => {
    let query = Utils.loadFile('./data/queries/insert_query.sparql');
    let expected = Utils.loadFile('./data/queries/expected_results_named_graph.json');
    let expectedEmptyGraph = Utils.loadFile('./data/queries/expected_results_named_graph_empty.json');

    let insertData = new UpdateQueryPayload()
      .setQuery(query);

    let dropGraph = new UpdateQueryPayload()
      .setQuery('DROP GRAPH <http://wine.com/graph/wine2>');

    let selectData = new GetQueryPayload()
      .setQuery('SELECT ?s ?p ?o FROM <http://wine.com/graph/wine2> WHERE {?s ?p ?o}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
      .setQueryLn(QueryLanguage.SPARQL);

    return rdfClient.update(insertData).then(() => {
      return rdfClient.query(selectData)
    }).then((resp) => {
      return Utils.readStream(resp);
    }).then((stream) => {
      expect(JSON.parse(stream)).toEqual(JSON.parse(expected));
      return rdfClient.update(dropGraph);
    }).then(() => {
      return rdfClient.query(selectData);
    }).then((resp) => {
      return Utils.readStream(resp);
    }).then((stream) => {
      expect(JSON.parse(stream)).toEqual(JSON.parse(expectedEmptyGraph));
    });
  });

  test('Should insert data, replace it and verify the change', () => {
    let queryInsert = Utils.loadFile('./data/queries/insert_query.sparql');
    let queryDeleteInsert = Utils.loadFile('./data/queries/delete_insert_query.sparql');
    let expected = Utils.loadFile('./data/queries/expected_result_delete_insert_data.json');
    let expectedEmptyGraph = Utils.loadFile('./data/queries/expected_results_named_graph_empty.json');

    let insertData = new UpdateQueryPayload()
      .setQuery(queryInsert);

    let replaceData = new UpdateQueryPayload()
      .setQuery(queryDeleteInsert);

    let selectData = new GetQueryPayload()
      .setQuery('SELECT ?s ?p ?o FROM <http://wine.com/graph/wine2> WHERE {?s ?p ?o}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
      .setQueryLn(QueryLanguage.SPARQL);

    let clearGraph = new UpdateQueryPayload()
      .setQuery('CLEAR GRAPH <http://wine.com/graph/wine2>');

    return rdfClient.update(insertData).then(() => {
      return rdfClient.update(replaceData);
    }).then(() => {
      return rdfClient.query(selectData)
    }).then((resp) => {
      return Utils.readStream(resp)
    }).then((stream) => {
      expect(JSON.parse(stream)).toEqual(JSON.parse(expected));
      return rdfClient.update(clearGraph);
    }).then(() => {
      return rdfClient.query(selectData);
    }).then((resp) => {
      return Utils.readStream(resp);
    }).then((stream) => {
      expect(JSON.parse(stream)).toEqual(JSON.parse(expectedEmptyGraph));
    });
  });
});
