const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RdfRepositoryClient = require('repository/rdf-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const HttpRequestBuilder = require('http/http-request-builder');
const Stream = require('stream');

const httpClientStub = require('../http/http-client.stub');
const testUtils = require('../utils');
const path = require('path');
const MediaType = require("http/media-type");

jest.mock('http/http-client');

describe('RdfRepositoryClient - uploading files', () => {
  let repoClientConfig;
  let rdfRepositoryClient;
  let httpRequest;

  const context = '<urn:x-local:graph1>';
  const baseURI = '<urn:x-local:graph1>';
  const testFilePath = path
    .resolve(__dirname, './data/add-statements-complex.txt');

  beforeEach(() => {
    const endpoints = ['http://host/repositories/repo1'];
    const headers = {};
    const contentType = '';
    const readTimeout = 1000;

    const writeTimeout = 1000;
    HttpClient.mockImplementation(() => httpClientStub());
    repoClientConfig = new RepositoryClientConfig('http://host')
      .setEndpoints(endpoints)
      .setHeaders(headers)
      .setDefaultRDFMimeType(contentType)
      .setReadTimeout(readTimeout)
      .setWriteTimeout(writeTimeout);
    rdfRepositoryClient = new RdfRepositoryClient(repoClientConfig);
    httpRequest = rdfRepositoryClient.httpClients[0].request;
  });

  describe('addFile(file)', () => {
    test('should open a readable stream of the file and send it ' +
      'to the server', () => {
      return rdfRepositoryClient
        .addFile(testFilePath, RDFMimeType.TRIG, context, baseURI)
        .then(() => {
          expect(httpRequest).toHaveBeenCalledTimes(1);
          const requestBuilder = httpRequest.mock.calls[0][0];
          verifyUploadRequestBuilder(requestBuilder, MediaType.TEXT_PLAIN);
          return testUtils.readStream(requestBuilder.getData());
        }).then((streamData) => {
          const expectedData = testUtils.loadFile(testFilePath).trim();
          expect(streamData).toEqual(expectedData);
        });
    });

    test('should reject if the server cannot consume the request', () => {
      const error = new Error('cannot-upload-file');
      httpRequest.mockRejectedValue(error);

      const promise = rdfRepositoryClient
        .addFile(testFilePath, RDFMimeType.TRIG, context, baseURI);
      return expect(promise).rejects.toEqual(error);
    });

    test('should disallow uploading missing files', () => {
      expect(() => rdfRepositoryClient
        .addFile(null, RDFMimeType.TRIG, context, baseURI))
        .toThrow(Error);
      expect(() => rdfRepositoryClient
        .addFile('', RDFMimeType.TRIG, context, baseURI))
        .toThrow(Error);
      expect(() => rdfRepositoryClient
        .addFile('missing-file-123', RDFMimeType.TRIG, context, baseURI))
        .toThrow(Error);
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient
        .addFile(testFilePath, RDFMimeType.TRIG, context, baseURI)).resolves
        .toEqual();
    });
  });

  describe('putFile(file)', () => {
    test('should open a readable stream of the file and send it to ' +
      'the server to overwrite the data', () => {
      return rdfRepositoryClient
        .putFile(testFilePath, RDFMimeType.TRIG, context, baseURI)
        .then(() => {
          expect(httpRequest).toHaveBeenCalledTimes(1);
          const requestBuilder = httpRequest.mock.calls[0][0];
          verifyUploadRequestBuilder(requestBuilder);
          return testUtils.readStream(requestBuilder.getData());
        }).then((streamData) => {
          const expectedData = testUtils.loadFile(testFilePath).trim();
          expect(streamData).toEqual(expectedData);
        });
    });

    test('should reject if the server cannot consume the ' +
      'overwrite request', () => {
      const error = new Error('cannot-upload-file');
      httpRequest.mockRejectedValue(error);

      const promise = rdfRepositoryClient
        .putFile(testFilePath, RDFMimeType.TRIG, context, baseURI);
      return expect(promise).rejects.toEqual(error);
    });

    test('should disallow overwriting with missing files', () => {
      expect(() => rdfRepositoryClient
        .putFile(null, RDFMimeType.TRIG, context, baseURI))
        .toThrow(Error);
      expect(() => rdfRepositoryClient
        .putFile('', RDFMimeType.TRIG, context, baseURI))
        .toThrow(Error);
      expect(() => rdfRepositoryClient
        .putFile('missing-file-123', RDFMimeType.TRIG, context, baseURI))
        .toThrow(Error);
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient
        .putFile(testFilePath, RDFMimeType.TRIG, context, baseURI)).resolves
        .toEqual();
    });
  });

  function verifyUploadRequestBuilder(requestBuilder, responseType = 'stream') {
    expect(requestBuilder).toBeInstanceOf(HttpRequestBuilder);
    expect(requestBuilder.getMethod()).toEqual('put');
    expect(requestBuilder.getUrl()).toEqual('/statements');
    expect(requestBuilder.getData()).toBeInstanceOf(Stream);
    expect(requestBuilder.getHeaders()).toEqual({
      'Content-Type': RDFMimeType.TRIG
    });
    expect(requestBuilder.getParams()).toEqual({
      baseURI,
      context
    });
    expect(requestBuilder.getResponseType()).toEqual(responseType);
  }
});
