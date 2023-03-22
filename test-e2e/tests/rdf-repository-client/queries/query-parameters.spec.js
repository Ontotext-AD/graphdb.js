const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');
const {GetQueryPayload, QueryType, QueryLanguage, UpdateQueryPayload} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;

describe('Query parameters', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

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
