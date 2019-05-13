const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const AddStatementPayload = require('repository/add-statement-payload');

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
        .setObject(obj('uri-1'))
        .get();

      const expected = testUtils.loadFile('repository/data/add-statements-triple.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifySentPayload(expected));
    });

    test('should properly convert triple payload with blank nodes to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject('_:1')
        .setPredicate(pred('relation-1'))
        .setObject('_:2')
        .get();

      const expected = testUtils.loadFile('repository/data/add-statements-triple-bnodes.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifySentPayload(expected));
    });

    test('should properly convert triple literal payload to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject('Title')
        .setLanguage('en')
        .get();

      const expected = testUtils.loadFile('repository/data/add-statements-literal.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifySentPayload(expected));
    });

    test('should properly convert triple literal payload with data type to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject('true')
        .setDataType('xsd:boolean')
        .get();

      const expected = testUtils.loadFile('repository/data/add-statements-literal-data-type.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifySentPayload(expected));
    });

    test('should properly convert triple payload with single context to quad and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject(obj('uri-1'))
        .setContext(context('data-graph-1'))
        .get();

      const expected = testUtils.loadFile('repository/data/add-statements-context.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifySentPayload(expected));
    });

    test('should properly convert triple payload with multiple contexts to several quads and send a request', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject('Title')
        .setLanguage('en')
        .setContext([context('data-graph-1'), context('data-graph-2')])
        .get();

      const expected = testUtils.loadFile('repository/data/add-statements-contexts.txt').trim();
      return rdfRepositoryClient.add(payload).then(() => verifySentPayload(expected));
    });

    test('should reject adding the payload if it is empty', () => {
      const payload = new AddStatementPayload().get();
      expect(() => rdfRepositoryClient.add(payload)).toThrow(Error);
      verifyNoPayload();
    });

    test('should reject adding the payload if it lacks required terms', () => {
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .get();
      expect(() => rdfRepositoryClient.add(payload)).toThrow(Error);
      verifyNoPayload();
    });

    test('should reject adding the payload when the server request is unsuccessful', () => {
      rdfRepositoryClient.httpClients[0].post.mockRejectedValue({});
      const payload = new AddStatementPayload()
        .setSubject(subj('resource-1'))
        .setPredicate(pred('relation-1'))
        .setObject(obj('uri-1'))
        .get();
      return expect(rdfRepositoryClient.add(payload)).rejects.toBeTruthy();
    });
  });

  describe('addQuads(quads)', () => {
    test('should convert the quads to turtle and send a request', () => {
      const quads = [
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

      const expected = testUtils.loadFile('repository/data/add-statements-complex.txt').trim();

      return rdfRepositoryClient.addQuads(quads).then(() => verifySentPayload(expected));
    });

    test('should reject adding quads when the server request is unsuccessful', () => {
      when(rdfRepositoryClient.httpClients[0].post).calledWith('/statements').mockRejectedValue('error-adding');
      const quads = [getQuad('resource-1', 'relation-1', 'uri-1')];
      return expect(rdfRepositoryClient.addQuads(quads)).rejects.toEqual('error-adding');
    });
  });

  function verifySentPayload(expected) {
    const post = rdfRepositoryClient.httpClients[0].post;
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/statements', expected, {
      timeout: 200,
      headers: {
        'Content-Type': RDFMimeType.TURTLE
      }
    });
  }

  function verifyNoPayload() {
    const post = rdfRepositoryClient.httpClients[0].post;
    expect(post).toHaveBeenCalledTimes(0);
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
});
