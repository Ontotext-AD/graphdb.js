const path = require('path');
const {RDFRepositoryClient, GetStatementsPayload} = require('graphdb').repository;
const {JsonLDParser, RDFJsonParser} = require('graphdb').parser;
const {GetQueryPayload, UpdateQueryPayload, QueryType, QueryLanguage} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;
const {TermConverter} = require('graphdb').model;
const {Readable} = require('stream');
const N3 = require('n3');
const {RdfXmlParser} = require('rdfxml-streaming-parser');
const {SparqlJsonParser} = require('sparqljson-parse');
const {SparqlXmlParser} = require('sparqlxml-parse');
const Utils = require('utils.js');
const Config = require('config.js');

/**
 * Reads RDF 1.2 triple terms back from GraphDB 12 and checks that every parser used by the client turns them into
 * RDF/JS Quad terms (termType 'Quad'). The exact responses of GraphDB are checked against the expected files in
 * data/rdf12.
 *
 * Triple terms are only inserted in object position (via rdf:reifies). RDF 1.2 does not allow a triple term as a
 * subject, and GraphDB 12 rejects such a request.
 */
const EX = 'http://example.com/';
const RDF_REIFIES = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies';
const FIXTURE = path.resolve(__dirname, './../../data/rdf12-triple-terms.ttl');
const TRIG_FIXTURE = path.resolve(__dirname, './../../data/rdf12-triple-terms.trig');
const STATEMENT1 = `<${EX}statement1>`;
const TRIPLE_TERM = '<<( <http://example.com/alice> <http://example.com/knows> <http://example.com/bob> )>>';

const SELECT_QUERY = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  SELECT ?statement ?triple WHERE {
    ?statement rdf:reifies ?triple .
  } ORDER BY ?statement
`;

const CONSTRUCT_QUERY = `
  CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }
`;

const REIFIER_CONSTRUCT_QUERY = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  CONSTRUCT { ?s ?p ?o } WHERE { ?s rdf:reifies ?triple . ?s ?p ?o }
`;

const NAMED_GRAPH_QUERY = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  SELECT ?graph ?statement ?triple WHERE {
    GRAPH ?graph { ?statement rdf:reifies ?triple }
  }
`;

// --- helpers -----------------------------------------------------------------------------------------------------

function collect(stream) {
  return new Promise((resolve, reject) => {
    const items = [];
    stream.on('data', (item) => items.push(item));
    stream.on('error', reject);
    stream.on('end', () => resolve(items));
  });
}

/**
 * Normalizes whatever the client returns for a response body to text. The client may hand back a string, a Buffer or
 * an already parsed JSON value (axios parses JSON content types, which is what happens for JSON-LD).
 */
function toText(response) {
  if (typeof response === 'string') {
    return response;
  }
  if (Buffer.isBuffer(response)) {
    return response.toString('utf8');
  }
  return JSON.stringify(response);
}

function getStatements(mimeType) {
  const payload = new GetStatementsPayload().setResponseType(mimeType);
  return rdfClient.get(payload).then(toText);
}

function getStatementsAbout(subject, mimeType) {
  const payload = new GetStatementsPayload().setSubject(subject).setResponseType(mimeType);
  return rdfClient.get(payload).then(toText);
}

// GraphDB returns the namespaces in an order that depends on how they were added, so the prefixes are compared
// regardless of their order.
function sortPrefixes(rdf) {
  const lines = rdf.trim().split('\n');
  const prefixes = lines.filter((line) => line.startsWith('@prefix')).sort();
  const rest = lines.filter((line) => !line.startsWith('@prefix'));
  return [...prefixes, ...rest].join('\n');
}

/**
 * rdfClient.query() resolves with a stream, which has to be read before the body can be used.
 */
function runQuery(query, queryType, mimeType) {
  const payload = new GetQueryPayload()
    .setQuery(query)
    .setQueryType(queryType)
    .setResponseType(mimeType)
    .setQueryLn(QueryLanguage.SPARQL);
  return rdfClient.query(payload).then((response) => {
    if (response && typeof response.on === 'function') {
      return Utils.readStream(response);
    }
    return response;
  }).then(toText);
}

function parseWithN3(format) {
  return (text) => Promise.resolve(new N3.Parser({format}).parse(text));
}

function parseRdfXml(text) {
  // rdfxml-streaming-parser only emits triple terms when the document declares rdf:version="1.2". Without it, they
  // are dropped silently, so fail early with a clear message instead of a confusing missing-term assertion.
  if (!/version\s*=\s*["']1\.2["']/.test(text)) {
    throw new Error('The RDF/XML response does not declare rdf:version="1.2", so triple terms cannot be parsed.');
  }
  return collect(Readable.from([text]).pipe(new RdfXmlParser()));
}

// The client's own JSON-LD parser turns the triple terms that GraphDB encodes as IRIs into Quad terms.
function parseJsonLd(text) {
  return collect(new JsonLDParser().parse(Readable.from([text])));
}

// The client's own RDF/JSON parser turns the triple terms that GraphDB encodes as IRIs into Quad terms.
function parseRdfJson(text) {
  return Promise.resolve(new RDFJsonParser().parse(text));
}

function parseSparqlJson(text) {
  return Promise.resolve(new SparqlJsonParser().parseJsonResults(JSON.parse(text)));
}

function parseSparqlXml(text) {
  return Promise.resolve(new SparqlXmlParser().parseXmlResultsStream(Readable.from([text]))).then(collect);
}

// Result rows are plain objects keyed by variable name; also support Bindings-like objects.
function getVar(row, name) {
  return typeof row.get === 'function' ? row.get(name) : row[name];
}

// --- assertions --------------------------------------------------------------------------------------------------

function expectTripleTerm(term, subject, predicate, object) {
  expect(term).toBeDefined();
  expect(term.termType).toBe('Quad');
  expect(term.subject.value).toBe(subject);
  expect(term.predicate.value).toBe(predicate);
  expect(term.object.value).toBe(object);
}

function reifiedTriple(quads, reifier) {
  const reification = quads.find((q) => q.subject.value === reifier && q.predicate.value === RDF_REIFIES);
  return reification && reification.object;
}

function expectInsertedData(quads) {
  expectTripleTerm(reifiedTriple(quads, `${EX}statement1`), `${EX}alice`, `${EX}knows`, `${EX}bob`);
  expectTripleTerm(reifiedTriple(quads, `${EX}statement2`), `${EX}carol`, `${EX}name`, 'Carol');

  // Statements around the triple terms keep their ordinary terms.
  const confidence =
    quads.find((q) => q.subject.value === `${EX}statement1` && q.predicate.value === `${EX}confidence`);
  expect(confidence.object.termType).toBe('Literal');
  expect(confidence.object.value).toBe('0.95');
}

function expectSelectRows(rows) {
  expect(rows).toHaveLength(2);
  const [first, second] = rows;
  expect(getVar(first, 'statement').value).toBe(`${EX}statement1`);
  expectTripleTerm(getVar(first, 'triple'), `${EX}alice`, `${EX}knows`, `${EX}bob`);
  expect(getVar(second, 'statement').value).toBe(`${EX}statement2`);
  expectTripleTerm(getVar(second, 'triple'), `${EX}carol`, `${EX}name`, 'Carol');
}

// --- tests -------------------------------------------------------------------------------------------------------

const rdfClient = new RDFRepositoryClient(Config.restApiConfig);

// [name, response mime type, parser from response text to an array of quads]
// GraphDB's N3 serialization is Turtle-compatible, so it is read with the Turtle parser.
const RDF_FORMATS = [
  ['Turtle', RDFMimeType.TURTLE, parseWithN3('text/turtle')],
  ['TriG', RDFMimeType.TRIG, parseWithN3('application/trig')],
  ['N-Triples', RDFMimeType.N_TRIPLES, parseWithN3('application/n-triples')],
  ['N-Quads', RDFMimeType.N_QUADS, parseWithN3('application/n-quads')],
  ['N3', RDFMimeType.N3, parseWithN3('text/turtle')],
  ['RDF/XML', RDFMimeType.RDF_XML, parseRdfXml],
  ['JSON-LD', RDFMimeType.JSON_LD, parseJsonLd],
  ['RDF/JSON', RDFMimeType.RDF_JSON, parseRdfJson]
];

// [name, response mime type, parser from response text to an array of result rows]
const SPARQL_RESULT_FORMATS = [
  ['SPARQL JSON', RDFMimeType.SPARQL_RESULTS_JSON, parseSparqlJson],
  ['SPARQL XML', RDFMimeType.SPARQL_RESULTS_XML, parseSparqlXml]
];

describe('RDF 1.2 triple terms', () => {
  beforeAll(async () => {
    await Utils.createRepo(Config.testRepoPath);
    await rdfClient.addFile(FIXTURE, RDFMimeType.TURTLE, null, null);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  describe('getStatements', () => {
    test.each(RDF_FORMATS)('Should read triple terms as Quad terms in %s', async (name, mimeType, parse) => {
      const text = await getStatements(mimeType);
      expect(text.length).toBeGreaterThan(0);
      expectInsertedData(await parse(text));
    });
  });

  describe('CONSTRUCT', () => {
    test.each(RDF_FORMATS)('Should read triple terms as Quad terms in %s', async (name, mimeType, parse) => {
      const text = await runQuery(CONSTRUCT_QUERY, QueryType.CONSTRUCT, mimeType);
      expect(text.length).toBeGreaterThan(0);
      expectInsertedData(await parse(text));
    });
  });

  describe('SELECT', () => {
    test.each(SPARQL_RESULT_FORMATS)('Should read triple terms as Quad terms in %s', async (name, mimeType, parse) => {
      const text = await runQuery(SELECT_QUERY, QueryType.SELECT, mimeType);
      expectSelectRows(await parse(text));
    });
  });

  describe('exact responses', () => {
    test('Should return the reified triple term in Turtle', async () => {
      const text = await getStatementsAbout(STATEMENT1, RDFMimeType.TURTLE);
      expect(sortPrefixes(text)).toEqual(sortPrefixes(Utils.loadFile('./data/rdf12/expected_response_turtle.txt')));
    });

    test('Should return the reified triple term in TriG', async () => {
      const text = await getStatementsAbout(STATEMENT1, RDFMimeType.TRIG);
      expect(sortPrefixes(text)).toEqual(sortPrefixes(Utils.loadFile('./data/rdf12/expected_response_trig.txt')));
    });

    test('Should return the reifier and its triple term in CONSTRUCT Turtle output', async () => {
      const text = await runQuery(REIFIER_CONSTRUCT_QUERY, QueryType.CONSTRUCT, RDFMimeType.TURTLE);
      expect(text).toMatch(/rdf:reifies <<\( \S*alice>? \S*knows>? \S*bob>? \)>>/);
      expect(text).toMatch(/rdf:reifies <<\( \S*carol>? \S*name>? "Carol" \)>>/);
    });

    test('Should return the triple terms in SPARQL JSON', async () => {
      const text = await runQuery(SELECT_QUERY, QueryType.SELECT, RDFMimeType.SPARQL_RESULTS_JSON);
      expect(text.trim()).toEqual(Utils.loadFile('./data/rdf12/expected_response_sparql_json.txt').trim());
    });

    test('Should return the triple terms in SPARQL TSV', async () => {
      const text = await runQuery(SELECT_QUERY, QueryType.SELECT, RDFMimeType.SPARQL_RESULTS_TSV);
      expect(text.trim()).toEqual(Utils.loadFile('./data/rdf12/expected_response_sparql_tsv.txt').trim());
    });
  });

  describe('JSON-LD', () => {
    test('Should return a triple term as a urn:rdf4j:tripleTerm IRI that TermConverter decodes', async () => {
      const text = await getStatementsAbout(STATEMENT1, RDFMimeType.JSON_LD);
      const [encodedTripleTerm] = text.match(/urn:rdf4j:tripleTerm:[\w-]+/);
      expect(TermConverter.fromBase64TripleTerm(encodedTripleTerm)).toEqual(TRIPLE_TERM);
    });
  });

  describe('triple terms outside the object position', () => {
    test('Should reject a triple term as the subject with HTTP 400', async () => {
      await expect(getStatementsAbout(TRIPLE_TERM, RDFMimeType.TURTLE))
        .rejects.toMatchObject({response: {status: 400}});
    });
  });

  describe('named graph upload', () => {
    const GRAPH = `${EX}graph1`;

    beforeAll(async () => {
      await rdfClient.addFile(TRIG_FIXTURE, RDFMimeType.TRIG, null, null);
    });

    afterAll(async () => {
      await rdfClient.update(new UpdateQueryPayload().setQuery(`CLEAR GRAPH <${GRAPH}>`));
    });

    test('Should read a triple term uploaded in a TriG named graph', async () => {
      const text = await runQuery(NAMED_GRAPH_QUERY, QueryType.SELECT, RDFMimeType.SPARQL_RESULTS_JSON);
      const rows = await parseSparqlJson(text);
      expect(rows).toHaveLength(1);
      expect(getVar(rows[0], 'graph').value).toBe(GRAPH);
      expect(getVar(rows[0], 'statement').value).toBe(`${EX}statement3`);
      expectTripleTerm(getVar(rows[0], 'triple'), `${EX}dave`, `${EX}knows`, `${EX}erin`);
    });
  });

  describe('RDF-star Content-Type', () => {
    test('Should accept Turtle sent with the deprecated RDF-star Content-Type as RDF 1.2', async () => {
      await rdfClient.addFile(FIXTURE, RDFMimeType.TURTLE_STAR, null, null);
      const text = await getStatementsAbout(STATEMENT1, RDFMimeType.TURTLE);
      expect(text).toMatch(/rdf:reifies <<\( \S*alice>? \S*knows>? \S*bob>? \)>>/);
    });
  });
});
