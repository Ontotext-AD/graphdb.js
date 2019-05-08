const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const RdfRepositoryClient = require('repository/rdf-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
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

    repoClientConfig = new RepositoryClientConfig(endpoints, headers, contentType, readTimeout, writeTimeout);
    rdfRepositoryClient = new RdfRepositoryClient(repoClientConfig);
  });

  describe('upload', () => {
    const context = '<urn:x-local:graph1>';
    const baseURI = '<urn:x-local:graph1>';
    const contentType = RDFMimeType.TURTLE;

    test('should upload rdf data provided as a stream', (done) => {
      const source = streamSource();
      const stream = new ObjectReadableMock(source);
      const expected = expectedStream();
      const expectedIt = expected[Symbol.iterator]();

      return rdfRepositoryClient.upload(stream, context, baseURI, contentType)
        .then(() => {
          stream.on('data', (chunk) => {
            expect(chunk).toEqual(expectedIt.next().value);
          });
          stream.on('end', done);
        });
    });

    test('should make a POST request with proper parameters and headers', () => {
      const postMock = rdfRepositoryClient.httpClients[0].post;

      return rdfRepositoryClient.upload({}, context, baseURI, contentType).then(() => {
        expect(postMock).toHaveBeenCalledTimes(1);
        expect(postMock).toHaveBeenCalledWith('/statements?context=%3Curn%3Ax-local%3Agraph1%3E&baseURI=%3Curn%3Ax-local%3Agraph1%3E', {}, {
          headers: {
            'Content-Type': 'text/turtle'
          },
          timeout: 1000,
          responseType: 'stream'
        });
      });
    });
  });

  describe('overwrite', () => {
    const context = '<urn:x-local:graph1>';
    const baseURI = '<urn:x-local:graph1>';
    const contentType = RDFMimeType.TURTLE;

    test('should overwrite statements using provided data as a stream', (done) => {
      const source = streamSource();
      const stream = new ObjectReadableMock(source);
      const expected = expectedStream();
      const expectedIt = expected[Symbol.iterator]();

      return rdfRepositoryClient.overwrite(stream, context, baseURI, contentType)
        .then(() => {
          stream.on('data', (chunk) => {
            expect(chunk).toEqual(expectedIt.next().value);
          });
          stream.on('end', done);
        });
    });

    test('should make a PUT request with proper parameters and headers', () => {
      const putMock = rdfRepositoryClient.httpClients[0].put;

      return rdfRepositoryClient.overwrite({}, context, baseURI, contentType).then(() => {
        expect(putMock).toHaveBeenCalledTimes(1);
        expect(putMock).toHaveBeenCalledWith('/statements?context=%3Curn%3Ax-local%3Agraph1%3E&baseURI=%3Curn%3Ax-local%3Agraph1%3E', {}, {
          headers: {
            'Content-Type': 'text/turtle'
          },
          timeout: 1000,
          responseType: 'stream'
        });
      });
    });
  });

  describe('resolveUrl', () => {
    test('should build url with context and baseURL', () => {
      expect(rdfRepositoryClient.resolveUrl('ctx', 'baseuri')).toEqual('/statements?context=ctx&baseURI=baseuri');
    });

    test('should build url without context nor baseURI', () => {
      expect(rdfRepositoryClient.resolveUrl()).toEqual('/statements');
    });

    test('should build url with context only', () => {
      expect(rdfRepositoryClient.resolveUrl('ctx')).toEqual('/statements?context=ctx');
    });

    test('should build url with baseURI only', () => {
      expect(rdfRepositoryClient.resolveUrl(null, 'baseuri')).toEqual('/statements?baseURI=baseuri');
    });

    test('should build url with context having null as string value', () => {
      expect(rdfRepositoryClient.resolveUrl('null')).toEqual('/statements?context=null');
    });
  });

  function streamSource() {
    return [
      '<rdf:Description rdf:about="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#subPropertyOf"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/><rdf:type rdf:resource="http://www.w3.org/2002/07/owl#TransitiveProperty"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#domain"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>'
    ];
  }

  function expectedStream() {
    return [
      '<rdf:Description rdf:about="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#subPropertyOf"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/><rdf:type rdf:resource="http://www.w3.org/2002/07/owl#TransitiveProperty"/></rdf:Description>',
      '<rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#domain"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description>'
    ];
  }
});
