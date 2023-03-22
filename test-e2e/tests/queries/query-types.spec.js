const {RDFRepositoryClient} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');
const {GetQueryPayload, QueryType, QueryLanguage, UpdateQueryPayload} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;

describe('Query types', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

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
