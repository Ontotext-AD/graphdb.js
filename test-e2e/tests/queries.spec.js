const path = require('path');
const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils');
const Config = require('config');
const {GetQueryPayload, QueryType, QueryLanguage, UpdateQueryPayload} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;

describe('Should test queries', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      let wineRdf = path.resolve(__dirname, './data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
    })
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  describe('Should test queries with different parameters', () => {
    test('Should make queries with inference parameter', () => {
      let payloadWithInferenceTrue = new GetQueryPayload()
        .setQuery('select * where {<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#StonleighSauvignonBlanc> ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setInference(true);

      let payloadWithInferenceFalse = new GetQueryPayload()
        .setQuery('select * where {<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#StonleighSauvignonBlanc> ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setInference(false);

      return rdfClient.query(payloadWithInferenceTrue).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        let expectedResponse = Utils.loadFile('./data/queries/expected_results_payload_inference_true.json');
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
        return rdfClient.query(payloadWithInferenceFalse);
      }).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        let expectedResponse = Utils.loadFile('./data/queries/expected_results_payload_inference_false.json');
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
      });
    });

    test('Should make queries with limit and offset parameters', () => {
      let payloadWithLimit10 = new GetQueryPayload()
        .setQuery('select ?s where {?s ?p <http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#Winery>}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setLimit(10);

      let payloadWithOffset10 = new GetQueryPayload()
        .setQuery('select ?s where {?s ?p <http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#Winery>}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setLimit(10)
        .setOffset(10);

      return rdfClient.query(payloadWithLimit10).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        let expectedResponse = Utils.loadFile('./data/queries/expected_result_limit10.json');
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
        return rdfClient.query(payloadWithOffset10);
      }).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        let expectedResponse = Utils.loadFile('./data/queries/expected_result_offset10.json');
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
      });
    });

    test('Should make queries with distinct parameter', () => {
      let payloadWithDistinctTrue = new GetQueryPayload()
        .setQuery('select ?s where {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setDistinct(true);

      let payloadWithDistinctFalse = new GetQueryPayload()
        .setQuery('select ?s where {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setDistinct(false);

      return rdfClient.query(payloadWithDistinctTrue).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        expect(stream.length).toBe(91942);
        return rdfClient.query(payloadWithDistinctFalse)
      }).then((resp) => {
        return Utils.readStream(resp)
      }).then((stream) => {
        expect(stream.length).toBe(338559);
      });
    });

    test('Should make queries with bindings', () => {
      let payload = new GetQueryPayload()
        .setQuery('select ?o where {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setLimit(1)
        .setOffset(1)
        .addBinding('$s', '<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#Wine>')
        .addBinding('$p', '<http://www.w3.org/2000/01/rdf-schema#label>');

      return rdfClient.query(payload).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        let expectedResponse = Utils.loadFile('./data/queries/expected_results_bindings.json');
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
      });
    });

    test('Query with set Timeout should timeout', () => {
      let query = Utils.loadFile('./data/queries/complex_query.sparql').trim();
      let payload = new GetQueryPayload()
        .setQuery(query)
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setTimeout(1);

      return rdfClient.query(payload).catch(error => {
        // The server responds with either 500 or 503
        // Note: not sure if this is on purpose or an issue
        const statusCode = error.response.status;
        expect(statusCode === 500 || statusCode === 503).toBe(true);
      });
    });
  });

  describe('Should test different type of queries', () => {
    test('Should make a DESCRIBE query', () => {
      let payload = new GetQueryPayload()
        .setQuery('describe <http://www.w3.org/2000/01/rdf-schema#label>')
        .setQueryType(QueryType.DESCRIBE)
        .setResponseType(RDFMimeType.RDF_JSON)
        .setQueryLn(QueryLanguage.SPARQL);

      return rdfClient.query(payload).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        let expectedResponse = Utils.loadFile('./data/queries/expected_result_describe.json');
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
      });
    });

    test('Should make an ASK query', () => {
      let payloadTrue = new GetQueryPayload()
        .setQuery('ask { ?s <http://www.w3.org/2000/01/rdf-schema#label> ?o }')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setResponseType(RDFMimeType.BOOLEAN_RESULT);

      let payloadFalse = new GetQueryPayload()
        .setQuery('ask { ?s <http://www.w3.org/2000/01/rdf-schema#labels> ?o }')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setResponseType(RDFMimeType.BOOLEAN_RESULT);

      return rdfClient.query(payloadTrue).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        expect(stream).toBe('true');
        return rdfClient.query(payloadFalse);
      }).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        expect(stream).toBe('false');
      });
    });

    test('Should make a CONSTRUCT query', () => {
      let query = Utils.loadFile('./data/queries/construct_query.sparql').trim();
      let expectedResponse = Utils.loadFile('./data/queries/expected_response_construct_query.json').trim();

      let payload = new GetQueryPayload()
        .setQuery(query)
        .setQueryType(QueryType.CONSTRUCT)
        .setResponseType(RDFMimeType.RDF_JSON)
        .setQueryLn(QueryLanguage.SPARQL);

      return rdfClient.query(payload).then((resp) => {
        return Utils.readStream(resp)
      }).then((stream) => {
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse))
      });
    });
  });

  describe('Should test different update queries', () => {
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

    test('Should load data in a named graph', () => {
      let expected = Utils.loadFile('./data/queries/expected_results_load_data.json');

      let clearGraph = new UpdateQueryPayload()
        .setQuery('DROP GRAPH <http://example/worldcat/>');

      let loadData = new UpdateQueryPayload()
        .setQuery('LOAD <http://experiment.worldcat.org/oclc/41238513.ttl> into graph <http://example/worldcat/>');

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
});
