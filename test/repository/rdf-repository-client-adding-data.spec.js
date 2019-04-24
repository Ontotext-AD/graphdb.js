const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RdfRepositoryClient = require('repository/rdf-repository-client');
const RDFContentType = require('http/rdf-content-type');

const N3 = require('n3');
const {DataFactory} = N3;
const {namedNode, literal, quad} = DataFactory;

const httpClientStub = require('../http/http-client.stub');
const testUtils = require('../utils');
const {when} = require('jest-when');

jest.mock('http/http-client');

/*
 * Tests statements insertion via RdfRepositoryClient
 */
describe('RdfRepositoryClient - adding data', () => {

  let repoClientConfig;
  let rdfRepositoryClient;

  beforeEach(() => {
    // No timeout so it won't slow the test suite when testing rejections.
    repoClientConfig = new RepositoryClientConfig([
      'http://localhost:8080/repositories/test'
    ], {}, '', 100, 200, 0, 0);

    HttpClient.mockImplementation(() => httpClientStub());

    rdfRepositoryClient = new RdfRepositoryClient(repoClientConfig);
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
    let post = rdfRepositoryClient.httpClients[0].post;
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/statements', expected, {
      timeout: 200,
      headers: {
        'Content-Type': RDFContentType.TURTLE
      }
    });
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
