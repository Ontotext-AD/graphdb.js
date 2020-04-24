const path = require('path');
const {RDFRepositoryClient, GetStatementsPayload} = require('graphdb').repository;
const Utils = require('utils');
const Config = require('config');
const {GetQueryPayload, QueryType} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;
const {RDFXmlParser, N3Parser} = require('graphdb').parser;
const N3 = require('n3');
const {DataFactory} = N3;
const {namedNode, quad, defaultGraph} = DataFactory;

describe('Should test RDFStar', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath).then(() => {
      let RDFStar = path.resolve(__dirname, './data/rdf-star.ttls');
      return rdfClient.addFile(RDFStar, RDFMimeType.TURTLE_STAR, null, null);
    })
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should get RDFStar triples as string when no appropriate parser', () => {
    const expected = '\n<<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>\n' +
      '  <http://www.wikidata.org/prop/reference/P3452> <http://www.wikidata.org/entity/Q202904> .\n';

    let payload = new GetQueryPayload()
      .setQuery('describe <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>')
      .setQueryType(QueryType.DESCRIBE)
      .setResponseType(RDFMimeType.TURTLE_STAR)
      .setLimit(100);

    rdfClient.registerParser((new RDFXmlParser()));
    return rdfClient.query(payload).then((resp) => {
      resp.on('data', data => {
        expect(data.toString()).toEqual(expected);
      });
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
      expect(resp).toEqual((expected));
    });
  });

  test('Should receive proper STAR responses', () => {
    function buildPayload(type) {
      return new GetStatementsPayload()
        .setSubject('<<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>')
        .setResponseType(type);
    }

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
    const expected = Utils.loadFile('./data/rdfstar/expected_response_sparql_star.txt');

    let payload = new GetQueryPayload()
      .setQuery('select ?s where { \n' +
        '\t?s ?p ?o .\n' +
        '    <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>> ?p ?o .\n' +
        '}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_STAR_RESULTS_JSON)
      .setLimit(100);

    return rdfClient.query(payload).then((resp) => {
      resp.on('data', data => {
        expect(data.toString().trim()).toEqual(expected.trim());
      });
    });
  });

  test('Should get RDFStar triples as TSV string when querying', () => {
    const expected = Utils.loadFile('./data/rdfstar/expected_response_sparql_tsv_star.txt');

    let payload = new GetQueryPayload()
      .setQuery('select ?s where { \n' +
        '\t?s ?p ?o .\n' +
        '    <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>> ?p ?o .\n' +
        '}')
      .setQueryType(QueryType.SELECT)
      .setResponseType(RDFMimeType.SPARQL_STAR_RESULTS_TSV)
      .setLimit(100);

    return rdfClient.query(payload).then((resp) => {
      resp.on('data', data => {
        expect(data.toString().trim()).toEqual(expected.trim());
      });
    });
  });
});
