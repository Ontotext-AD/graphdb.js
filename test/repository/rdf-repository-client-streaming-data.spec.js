const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RdfRepositoryClient = require('repository/rdf-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const HttpRequestBuilder = require('http/http-request-builder');
const {ObjectReadableMock} = require('stream-mock');

const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

describe('RdfRepositoryClient - streaming data', () => {
  let repoClientConfig;
  let rdfRepositoryClient;

  const endpoints = ['http://host/repositories/repo1'];
  const headers = {};
  const contentType = '';
  const readTimeout = 1000;
  const writeTimeout = 1000;

  beforeEach(() => {
    HttpClient.mockImplementation(() => httpClientStub());

    repoClientConfig = new RepositoryClientConfig()
      .setEndpoints(endpoints)
      .setHeaders(headers)
      .setDefaultRDFMimeType(contentType)
      .setReadTimeout(readTimeout)
      .setWriteTimeout(writeTimeout);
    rdfRepositoryClient = new RdfRepositoryClient(repoClientConfig);
  });

  describe('upload', () => {
    const context = '<urn:x-local:graph1>';
    const baseURI = '<urn:x-local:graph1>';
    const contentType = RDFMimeType.TURTLE;

    test('should upload rdf data provided as a stream', (done) => {
      const source = streamSource();
      const stream = new ObjectReadableMock(source);
      const expectedIt = source[Symbol.iterator]();

      return rdfRepositoryClient.upload(stream, contentType, context, baseURI)
        .then(() => {
          stream.on('data', (chunk) => {
            expect(chunk).toEqual(expectedIt.next().value);
          });
          stream.on('end', done);
        });
    });

    test('should make a POST request with proper parameters and headers', () => {
      const postMock = rdfRepositoryClient.httpClients[0].post;

      return rdfRepositoryClient.upload({}, contentType, context, baseURI).then(() => {
        verifyUploadRequest(postMock);
      });
    });

    test('should make a POST request with properly encoded context parameter', () => {
      const postMock = rdfRepositoryClient.httpClients[0].post;

      // Not encoded as N-Triple
      return rdfRepositoryClient.upload({}, contentType, 'urn:x-local:graph1', baseURI).then(() => {
        verifyUploadRequest(postMock);
      });
    });

    function verifyUploadRequest(postMock) {
      const expectedRequestConfig = new HttpRequestBuilder().setHeaders({
        'Content-Type': 'text/turtle'
      }).setParams({
        context,
        baseURI
      }).setResponseType('stream');

      expect(postMock).toHaveBeenCalledTimes(1);
      expect(postMock).toHaveBeenCalledWith('/statements', {}, expectedRequestConfig);
    }
  });

  describe('overwrite', () => {
    const context = '<urn:x-local:graph1>';
    const baseURI = '<urn:x-local:graph1>';
    const contentType = RDFMimeType.TURTLE;

    test('should overwrite statements using provided data as a stream', (done) => {
      const source = streamSource();
      const stream = new ObjectReadableMock(source);
      const expectedIt = source[Symbol.iterator]();

      return rdfRepositoryClient.overwrite(stream, contentType, context, baseURI)
        .then(() => {
          stream.on('data', (chunk) => {
            expect(chunk).toEqual(expectedIt.next().value);
          });
          stream.on('end', done);
        });
    });

    test('should make a PUT request with proper parameters and headers', () => {
      const putMock = rdfRepositoryClient.httpClients[0].put;

      return rdfRepositoryClient.overwrite({}, contentType, context, baseURI).then(() => {
        verifyOverwriteRequest(putMock);
      });
    });

    test('should make a PUT request with properly encoded context parameter', () => {
      const putMock = rdfRepositoryClient.httpClients[0].put;

      // Not encoded as N-Triple
      return rdfRepositoryClient.overwrite({}, contentType, 'urn:x-local:graph1', baseURI).then(() => {
        verifyOverwriteRequest(putMock);
      });
    });

    function verifyOverwriteRequest(putMock) {
      const expectedRequestConfig = new HttpRequestBuilder().setHeaders({
        'Content-Type': 'text/turtle'
      }).setParams({
        context,
        baseURI
      }).setResponseType('stream');

      expect(putMock).toHaveBeenCalledTimes(1);
      expect(putMock).toHaveBeenCalledWith('/statements', {}, expectedRequestConfig);
    }
  });

  function streamSource() {
    return [
      '<rdf:Description rdf:about="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#subPropertyOf"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/><rdf:type rdf:resource="http://www.w3.org/2002/07/owl#TransitiveProperty"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#domain"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>'
    ];
  }
});
