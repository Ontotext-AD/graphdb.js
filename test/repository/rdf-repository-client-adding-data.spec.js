const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const AddStatementPayload = require('repository/add-statement-payload');
const XSD = require('model/types').XSD;

const N3 = require('n3');
const {DataFactory} = N3;
const {namedNode, literal, quad} = DataFactory;

const httpClientStub = require('../http/http-client.stub');
const testUtils = require('../utils');
const {when} = require('jest-when');

jest.mock('http/http-client');

/*
 * Tests statements insertion via RDFRepositoryClient
 */
describe('RDFRepositoryClient - adding data', () => {

  let repoClientConfig;
  let rdfRepositoryClient;

  beforeEach(() => {
    repoClientConfig = new RepositoryClientConfig([
      'http://localhost:8080/repositories/test'
    ], {}, '', 100, 200);

    HttpClient.mockImplementation(() => httpClientStub());

    rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);
  });

  describe('add(payload)', () => {
    test('should properly convert triple payload to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject(obj('uri-1'));

      const expected = testUtils.loadFile('repository/data/add-statements-triple.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert triple payload with blank nodes to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject('_:1')
        .setPredicate(pred('relation-1'))
        .setObject('_:2');

      const expected = testUtils.loadFile('repository/data/add-statements-triple-bnodes.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert triple literal payload with language to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject('Title')
        .setLanguage('en');

      const expected = testUtils.loadFile('repository/data/add-statements-literal-language.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert triple literal payload with data type to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('property-boolean'))
        .setObject('true')
        .setDataType('xsd:boolean');

      const expected = testUtils.loadFile('repository/data/add-statements-literal-boolean.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert string literal payload to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('property-string'))
        .setObjectLiteral('Some value');

      const expected = testUtils.loadFile('repository/data/add-statements-literal.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert string literal with language payload to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObjectLiteral('Title', XSD.STRING, 'en');

      const expected = testUtils.loadFile('repository/data/add-statements-literal-language.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert integer literal payload to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('property-int'))
        .setObjectLiteral(4);

      const expected = testUtils.loadFile('repository/data/add-statements-literal-integer.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert float literal payload to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('property-float'))
        .setObjectLiteral(3.1415);

      const expected = testUtils.loadFile('repository/data/add-statements-literal-decimal.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert boolean literal payload to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('property-boolean'))
        .setObjectLiteral(true);

      const expected = testUtils.loadFile('repository/data/add-statements-literal-boolean.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected));
    });

    test('should properly convert triple payload with single context to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject(obj('uri-1'))
        .setContext(context('data-graph-1'));

      const expectedGraph = encodedContext('data-graph-1');
      const expected = testUtils.loadFile('repository/data/add-statements-context.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected, expectedGraph));
    });

    test('should properly convert triple payload with multiple contexts to several quads and send a request', () => {
      const graphs = [context('data-graph-1'), context('data-graph-2')];
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject('Title')
        .setLanguage('en')
        .setContext(graphs);

      const expectedGraphs = [encodedContext('data-graph-1'), encodedContext('data-graph-2')];
      const expected = testUtils.loadFile('repository/data/add-statements-contexts.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected, expectedGraphs));
    });

    test('should allow to specify base URI for resolving of relative URIs', () => {
      const payload = new AddStatementPayload()
        .setBaseURI('http://base/uri')
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject(obj('uri-1'));

      const expected = testUtils.loadFile('repository/data/add-statements-triple.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifyAddPayload(expected, undefined, 'http://base/uri'))
    });

    test('should resolve to empty response (HTTP 204)', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject(obj('uri-1'));
      return expect(rdfRepositoryClient.add(payload)).resolves.toEqual();
    });

    test('should throw error when a payload is not provided', () => {
      expect(() => rdfRepositoryClient.add()).toThrow(Error('Cannot add statement without payload'));
    });

    test('should reject adding the payload if it is empty', () => {
      const payload = new AddStatementPayload();
      expect(() => rdfRepositoryClient.add(payload)).toThrow(Error);
      verifyNoPayload();
    });

    test('should reject adding the payload if it lacks required terms', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'));
      expect(() => rdfRepositoryClient.add(payload)).toThrow(Error);
      verifyNoPayload();
    });

    test('should reject adding the payload when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].post.mockRejectedValue({});
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject(obj('uri-1'));
      return expect(rdfRepositoryClient.add(payload)).rejects.toBeTruthy();
    });
  });

  describe('addQuads(quads)', () => {
    test('should throw error when no data is provided', () => {
      const quads = [];
      return expect(rdfRepositoryClient.addQuads(quads))
        .rejects.toEqual(Error('Turtle/trig data is required when adding statements'));
    });

    test('should convert the quads to turtle and send a request', () => {
      const quads = getQuadsDataSet();

      const expected = testUtils.loadFile('repository/data/add-statements-complex.txt').trim();

      return rdfRepositoryClient.addQuads(quads).then(() => verifyAddPayload(expected));
    });

    test('should allow to specify base URI and context when adding quads', () => {
      const quads = getQuadsDataSet();
      const graph = context('data-graph-1');
      const baseUri = 'http://base/uri';

      const expected = testUtils.loadFile('repository/data/add-statements-complex.txt').trim();
      const expectedGraph = '<' + graph + '>';
      return rdfRepositoryClient.addQuads(quads, graph, baseUri)
        .then(() => verifyAddPayload(expected, expectedGraph, baseUri));
    });

    test('should resolve to empty response (HTTP 204)', () => {
      const quads = getQuadsDataSet();
      return expect(rdfRepositoryClient.addQuads(quads)).resolves.toEqual();
    });

    test('should reject adding quads when the server request is unsuccessful', () => {
      when(rdfRepositoryClient.httpClients[0].post).calledWith('/statements').mockRejectedValue('error-adding');
      const quads = [getQuad('resource-1', 'relation-1', 'uri-1')];
      return expect(rdfRepositoryClient.addQuads(quads)).rejects.toEqual('error-adding');
    });
  });

  describe('putQuads(quads)', () => {
    test('should convert the quads to turtle and send an overwrite request', () => {
      const quads = getQuadsDataSet();

      const expected = testUtils.loadFile('repository/data/add-statements-complex.txt').trim();

      return rdfRepositoryClient.putQuads(quads).then(() => verifyPutPayload(expected));
    });

    test('should allow to specify base URI and context when putting quads', () => {
      const quads = getQuadsDataSet();
      const graph = context('data-graph-1');
      const baseUri = 'http://base/uri';

      const expected = testUtils.loadFile('repository/data/add-statements-complex.txt').trim();
      const expectedGraph = '<' + graph + '>';
      return rdfRepositoryClient.putQuads(quads, graph, baseUri)
        .then(() => verifyPutPayload(expected, expectedGraph, baseUri));
    });

    test('should resolve to empty response (HTTP 204)', () => {
      const quads = getQuadsDataSet();
      return expect(rdfRepositoryClient.putQuads(quads)).resolves.toEqual();
    });

    test('should reject putting quads when the server request is unsuccessful', () => {
      when(rdfRepositoryClient.httpClients[0].put).calledWith('/statements').mockRejectedValue('error-overwriting');
      const quads = [getQuad('resource-1', 'relation-1', 'uri-1')];
      return expect(rdfRepositoryClient.putQuads(quads)).rejects.toEqual('error-overwriting');
    });
  });

  function verifyAddPayload(expected, context, baseURI) {
    const post = rdfRepositoryClient.httpClients[0].post;
    verifySentPayload(post, expected, context, baseURI);
  }

  function verifyPutPayload(expected, context, baseURI) {
    const put = rdfRepositoryClient.httpClients[0].put;
    verifySentPayload(put, expected, context, baseURI);
  }

  function verifySentPayload(method, expected, context, baseURI) {
    expect(method).toHaveBeenCalledTimes(1);
    expect(method).toHaveBeenCalledWith('/statements', expected, {
      headers: {
        'Content-Type': RDFMimeType.TRIG
      },
      params: {
        context,
        baseURI
      }
    });
  }

  function verifyNoPayload() {
    const post = rdfRepositoryClient.httpClients[0].post;
    expect(post).toHaveBeenCalledTimes(0);
  }

  function getQuadsDataSet() {
    return [
      getQuad('resource-1', 'relation-1', 'uri-1'),
      getQuad('resource-1', 'relation-2', 'uri-2'),
      getQuadLiteral('resource-1', 'boolean-property', 'true', namedNode('xsd:boolean')),
      getQuadLiteral('resource-1', 'title', 'Title', 'en'),
      getQuadLiteral('resource-1', 'title', 'Titel', 'de'),

      getQuad('resource-2', 'relation-1', 'uri-2', 'data-graph-1'),
      getQuad('resource-2', 'relation-2', 'uri-3', 'data-graph-1'),
      getQuadLiteral('resource-2', 'title', 'Title', 'en', 'data-graph-2'),
      getQuadLiteral('resource-2', 'title', 'Titel', 'de', 'data-graph-2'),

      getQuad('resource-3', 'relation-1', 'uri-4', 'data-graph-1'),
    ];
  }

  // Utilities for building terms

  function getQuad(s, p, o, g) {
    if (g) {
      return quad(namedNode(subj(s)), namedNode(pred(p)), namedNode(obj(o)), namedNode(context(g)));
    }
    return quad(namedNode(subj(s)), namedNode(pred(p)), namedNode(obj(o)));
  }

  function getQuadLiteral(s, p, o, t, g) {
    if (g) {
      return quad(namedNode(subj(s)), namedNode(pred(p)), literal(o, t), namedNode(context(g)));
    }
    return quad(namedNode(subj(s)), namedNode(pred(p)), literal(o, t));
  }

  function subj(id) {
    return `http://domain/resource/${id}`;
  }

  function pred(id) {
    return `http://domain/property/${id}`;
  }

  function obj(id) {
    return `http://domain/value/${id}`;
  }

  function context(id) {
    return `http://domain/graph/${id}`;
  }

  function encodedContext(id) {
    return '<' + context(id) + '>';
  }
});
