const {RDFRepositoryClient, GetStatementsPayload} = require('graphdb').repository;
const {JsonLDParser} = require('graphdb').parser;
const {GetQueryPayload, UpdateQueryPayload, QueryType, QueryLanguage} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;
const {Readable} = require('stream');
const N3 = require('n3');
const {RdfXmlParser} = require('rdfxml-streaming-parser');
const {SparqlJsonParser} = require('sparqljson-parse');
const {SparqlXmlParser} = require('sparqlxml-parse');
const Utils = require('utils.js');
const Config = require('config.js');

/**
 * Reads RDF 1.2 triple terms back from GraphDB 12 and checks that every parser used by the client turns them into
 * RDF/JS Quad terms (termType 'Quad').
 *
 * Triple terms are only inserted in object position (via rdf:reifies). RDF 1.2 does not allow a triple term as a
 * subject, and n3 2.x rejects such documents.
 */
const EX = 'http://example.com/';
const RDF_REIFIES = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies';

const INSERT_QUERY = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX ex: <http://example.com/>
  INSERT {
    ex:statement1 rdf:reifies <<( ex:alice ex:knows ex:bob )>> .
    ex:statement1 ex:confidence 0.95 .
    ex:statement2 rdf:reifies <<( ex:carol ex:name "Carol" )>> .
    ex:statement2 ex:source "test-source" .
  } WHERE {}
`;

const SELECT_QUERY = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  SELECT ?statement ?triple WHERE {
    ?statement rdf:reifies ?triple .
  } ORDER BY ?statement
`;

const CONSTRUCT_QUERY = `
  CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }
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
  ['JSON-LD', RDFMimeType.JSON_LD, parseJsonLd]
];

// [name, response mime type, parser from response text to an array of result rows]
const SPARQL_RESULT_FORMATS = [
  ['SPARQL JSON', RDFMimeType.SPARQL_RESULTS_JSON, parseSparqlJson],
  ['SPARQL XML', RDFMimeType.SPARQL_RESULTS_XML, parseSparqlXml]
];

describe('RDF 1.2 triple terms', () => {
  beforeAll(async () => {
    await Utils.createRepo(Config.testRepoPath);
    await rdfClient.update(new UpdateQueryPayload().setQuery(INSERT_QUERY));
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
});