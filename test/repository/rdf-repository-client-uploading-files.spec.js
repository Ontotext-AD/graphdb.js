const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RdfRepositoryClient = require('repository/rdf-repository-client');
const RDFMimeType = require('http/rdf-mime-type');

const httpClientStub = require('../http/http-client.stub');
const testUtils = require('../utils');
const path = require('path');
const {when} = require('jest-when');

jest.mock('http/http-client');

describe('RdfRepositoryClient - uploading files', () => {

  let repoClientConfig;
  let rdfRepositoryClient;

  const endpoints = ['http://host/repositories/repo1'];
  const headers = {};
  const contentType = '';
  const readTimeout = 1000;
  const writeTimeout = 1000;

  const context = '<urn:x-local:graph1>';
  const baseURI = '<urn:x-local:graph1>';

  let testFilePath = path.resolve(__dirname, './data/add-statements-complex.txt');

  beforeEach(() => {
    HttpClient.mockImplementation(() => httpClientStub());
    repoClientConfig = new RepositoryClientConfig(endpoints, headers, contentType, readTimeout, writeTimeout);
    rdfRepositoryClient = new RdfRepositoryClient(repoClientConfig);
  });

  describe('addFile(file)', () => {

    let httpPost;
    beforeEach(() => {
      httpPost = rdfRepositoryClient.httpClients[0].post;
    });

    test('should open a readable stream of the file and send it to the server', () => {
      return rdfRepositoryClient.addFile(testFilePath, RDFMimeType.TRIG, context, baseURI).then(() => {
        expect(httpPost).toHaveBeenCalledTimes(1);

        const httpPostCall = httpPost.mock.calls[0];

        const url = httpPostCall[0];
        expect(url).toEqual('/statements');

        const requestConfig = httpPostCall[2];
        expect(requestConfig).toEqual({
          headers: {
            'Content-Type': RDFMimeType.TRIG
          },
          params: {
            baseURI,
            context
          },
          responseType: 'stream'
        });

        const fileStream = httpPostCall[1];
        return testUtils.readStream(fileStream)
      }).then((streamData) => {
        const expectedData = testUtils.loadFile(testFilePath).trim();
        expect(streamData).toEqual(expectedData);
      });
    });

    test('should reject if the server cannot consume the request', () => {
      const error = new Error('cannot-upload-file');
      when(httpPost).calledWith(expect.stringContaining('/statements')).mockRejectedValue(error);

      const promise = rdfRepositoryClient.addFile(testFilePath, RDFMimeType.TRIG, context, baseURI);
      return expect(promise).rejects.toEqual(error);
    });

    test('should disallow uploading missing files', () => {
      expect(() => rdfRepositoryClient.addFile(null, RDFMimeType.TRIG, context, baseURI)).toThrow(Error);
      expect(() => rdfRepositoryClient.addFile('', RDFMimeType.TRIG, context, baseURI)).toThrow(Error);
      expect(() => rdfRepositoryClient.addFile('missing-file-123', RDFMimeType.TRIG, context, baseURI)).toThrow(Error);
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient.addFile(testFilePath, RDFMimeType.TRIG, context, baseURI)).resolves.toEqual();
    });
  });

  describe('putFile(file)', () => {

    let httpPut;
    beforeEach(() => {
      httpPut = rdfRepositoryClient.httpClients[0].put;
    });

    test('should open a readable stream of the file and send it to the server to overwrite the data', () => {
      return rdfRepositoryClient.putFile(testFilePath, RDFMimeType.TRIG, context, baseURI).then(() => {
        expect(httpPut).toHaveBeenCalledTimes(1);

        const httpPutCall = httpPut.mock.calls[0];

        const url = httpPutCall[0];
        expect(url).toEqual('/statements');

        const requestConfig = httpPutCall[2];
        expect(requestConfig).toEqual({
          headers: {
            'Content-Type': RDFMimeType.TRIG
          },
          params: {
            baseURI,
            context
          },
          responseType: 'stream'
        });

        const fileStream = httpPutCall[1];
        return testUtils.readStream(fileStream)
      }).then((streamData) => {
        const expectedData = testUtils.loadFile(testFilePath).trim();
        expect(streamData).toEqual(expectedData);
      });
    });

    test('should reject if the server cannot consume the overwrite request', () => {
      const error = new Error('cannot-upload-file');
      when(httpPut).calledWith(expect.stringContaining('/statements')).mockRejectedValue(error);

      const promise = rdfRepositoryClient.putFile(testFilePath, RDFMimeType.TRIG, context, baseURI);
      return expect(promise).rejects.toEqual(error);
    });

    test('should disallow overwriting with missing files', () => {
      expect(() => rdfRepositoryClient.putFile(null, RDFMimeType.TRIG, context, baseURI)).toThrow(Error);
      expect(() => rdfRepositoryClient.putFile('', RDFMimeType.TRIG, context, baseURI)).toThrow(Error);
      expect(() => rdfRepositoryClient.putFile('missing-file-123', RDFMimeType.TRIG, context, baseURI)).toThrow(Error);
    });

    test('should resolve to empty response (HTTP 204)', () => {
      return expect(rdfRepositoryClient.putFile(testFilePath, RDFMimeType.TRIG, context, baseURI)).resolves.toEqual();
    });
  });

});
