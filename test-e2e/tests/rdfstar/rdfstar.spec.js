const path = require('path');
const {RDFRepositoryClient, GetStatementsPayload} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');
const {GetQueryPayload, QueryType} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;
const {RDFXmlParser, N3Parser} = require('graphdb').parser;
const N3 = require('n3');
const {DataFactory} = N3;
const {namedNode, quad, defaultGraph} = DataFactory;

describe('Should test RDFStar', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);
  let expected;
  let response;

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      let RDFStar = path.resolve(__dirname, './../data/rdf-star.ttls');
      return rdfClient.addFile(RDFStar, RDFMimeType.TURTLE_STAR, null, null);
    }).catch((e) => {
      throw new Error(e);
    });
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should get RDFStar triples as string when no appropriate parser', () => {
    let payload = new GetQueryPayload()
      .setQuery('describe <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>')
      .setQueryType(QueryType.DESCRIBE)
      .setResponseType(RDFMimeType.TURTLE_STAR)
      .setLimit(100);

    rdfClient.registerParser((new RDFXmlParser()));
    return rdfClient.query(payload).then((resp) => {
      expected = '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n' +
        '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n' +
        '@prefix rdf4j: <http://rdf4j.org/schema/rdf4j#> .\n' +
        '@prefix sesame: <http://www.openrdf.org/schema/sesame#> .\n' +
        '@prefix owl: <http://www.w3.org/2002/07/owl#> .\n' +
        '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n' +
        '@prefix fn: <http://www.w3.org/2005/xpath-functions#> .\n' +
        '\n<<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>\n' +
        '  <http://www.wikidata.org/prop/reference/P3452> <http://www.wikidata.org/entity/Q202904> .\n';

      response = resp;
      response.on('data', onData);
    });
  });

  test('Should get RDFStar triples base64 encoded when got with not RDFStar header', () => {
    let expected = [quad(
      namedNode('urn:rdf4j:triple:PDw8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1E0NzI-IDxodHRwOi8vd3d3Lndpa2lkYXRhLm9yZy9wcm9wL2RpcmVjdC9QMTg4OT4gPGh0dHA6Ly93d3cud2lraWRhdGEub3JnL2VudGl0eS9RMjAyOTA0Pj4-'),
      namedNode('http://www.wikidata.org/prop/reference/P3452'),
      namedNode('http://www.wikidata.org/entity/Q202904'),
      defaultGraph())];

    let payload = new GetStatementsPayload()
      .setResponseType(RDFMimeType.N3)
      .setSubject('<<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>');

    rdfClient.registerParser((new N3Parser()));
    return rdfClient.get(payload).then((resp) => {
      expect(resp).toEqual(expected);
    });
  });

  test('Should receive proper STAR responses', () => {
    let expectedTurtleStar = Utils.loadFile('./data/rdfstar/expected_response_turtle_star.txt');
    let expectedTrigStar = Utils.loadFile('./data/rdfstar/expected_response_trig_star.txt');

    let payload = buildPayload(RDFMimeType.TURTLE_STAR);
    return rdfClient.get(payload).then((resp) => {
      expect(resp.trim()).toEqual(expectedTurtleStar.trim());
      payload = buildPayload(RDFMimeType.TRIG_STAR);
      return rdfClient.get(payload);
    }).then((resp) => {
      expect(resp.trim()).toEqual(expectedTrigStar.trim());
    });
  });

  test('Should get RDFStar triples as JSON string when querying', () => {
    let payload = new GetQueryPayload()
      .setQuery('select ?s where { \n' +
        '\t?s ?p ?o .\n' +
        '    <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>> ?p ?o .\n' +
        '}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_STAR_RESULTS_JSON)
      .setLimit(100);

    return rdfClient.query(payload).then((resp) => {
      expected = Utils.loadFile('./data/rdfstar/expected_response_sparql_star.txt');
      response = resp;
      response.on('data', onData);
    });
  });

  test('Should get RDFStar triples as TSV string when querying', () => {
    let payload = new GetQueryPayload()
      .setQuery('select ?s where { \n' +
        '\t?s ?p ?o .\n' +
        '    <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>> ?p ?o .\n' +
        '}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_STAR_RESULTS_TSV)
      .setLimit(100);

    return rdfClient.query(payload).then((resp) => {
      expected = Utils.loadFile('./data/rdfstar/expected_response_sparql_tsv_star.txt');
      response = resp;
      response.on('data', onData);
    });
  });

  function onData(data) {
    expect(data.toString().trim()).toEqual(expected.trim());
    unsubscribe();
  }

  function unsubscribe() {
    response.removeListener('data', onData);
  }

  function buildPayload(type) {
    return new GetStatementsPayload()
      .setSubject('<<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>')
      .setResponseType(type);
  }
});
