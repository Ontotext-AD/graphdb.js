const HttpClient = require('http/http-client');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const GetStatementsPayload = require('repository/get-statements-payload');
const RDFMimeType = require('http/rdf-mime-type');
const TurtleParser = require('parser/turtle-parser');
const NTriplesParser = require('parser/n-triples-parser');
const NQuadsParser = require('parser/n-quads-parser');
const N3Parser = require('parser/n3-parser');
const TriGParser = require('parser/trig-parser');

const DataFactory = require('n3').DataFactory;
const namedNode = DataFactory.namedNode;
const literal = DataFactory.literal;
const defaultGraph = DataFactory.defaultGraph;
const quad = DataFactory.quad;

const {ObjectReadableMock} = require('stream-mock');

const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

import data from './statements.data';

describe('RDFRepositoryClient - reading statements', () => {
  let config;
  let repository;
  const endpoints = ['http://host/repositories/repo1'];
  const headers = {};
  const contentType = '';
  const readTimeout = 1000;
  const writeTimeout = 1000;

  describe('statements#get returning Quads', () => {
    beforeEach(() => {
      HttpClient.mockImplementation(() => httpClientStub());

      config = new RepositoryClientConfig(endpoints, headers, contentType,
        readTimeout, writeTimeout);
      repository = new RDFRepositoryClient(config);
    });

    const expected = [quad(
      namedNode('http://eunis.eea.europa.eu/countries/AZ'),
      namedNode('http://eunis.eea.europa.eu/rdf/schema.rdf#population'),
      literal(7931000),
      defaultGraph())];

    function mockHttpGET(type) {
      repository.httpClients[0].get.mockImplementation(() => Promise.resolve({
        data: data.repositories.repo1.statements.GET[type]
      }));
    }

    function buildPayload(type) {
      return new GetStatementsPayload()
        .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
        .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
        .setResponseType(type)
        .get();
    }

    test('should fetch statement in N-Triples format and return it converted to quads', () => {
      repository.registerParser(new NTriplesParser());

      mockHttpGET(RDFMimeType.N_TRIPLES);

      const payload = buildPayload(RDFMimeType.N_TRIPLES);
      return expect(repository.get(payload)).resolves.toEqual(expected);
    });

    test('should fetch statement in N3 format and return it converted to quads', () => {
      repository.registerParser(new N3Parser());

      mockHttpGET(RDFMimeType.N3);

      const payload = buildPayload(RDFMimeType.N3);
      return expect(repository.get(payload)).resolves.toEqual(expected);
    });

    test('should fetch statement in TriG format and return it converted to quads', () => {
      repository.registerParser(new TriGParser());

      mockHttpGET(RDFMimeType.TRIG);

      const payload = buildPayload(RDFMimeType.TRIG);
      return expect(repository.get(payload)).resolves.toEqual(expected);
    });

    test('should fetch statement in N-Quads format and return it converted to quads', () => {
      repository.registerParser(new NQuadsParser());

      mockHttpGET(RDFMimeType.N_QUADS);

      const payload = buildPayload(RDFMimeType.N_QUADS);
      return expect(repository.get(payload)).resolves.toEqual(expected);
    });

    test('should fetch statement in Turtle format and return it converted to quads', () => {
      repository.registerParser(new TurtleParser());

      mockHttpGET(RDFMimeType.TURTLE);

      const payload = buildPayload(RDFMimeType.TURTLE);
      return expect(repository.get(payload)).resolves.toEqual(expected);
    });
  });

  describe('statements#get returning plain string', () => {
    beforeEach(() => {
      HttpClient.mockImplementation(() => httpClientStub());

      config = new RepositoryClientConfig(endpoints, headers, contentType,
        readTimeout, writeTimeout);
      repository = new RDFRepositoryClient(config);
    });

    test('should reject with error if response fails', () => {
      repository.httpClients[0].get.mockImplementation(() => Promise.reject({response: 'Server error'}));

      const payload = new GetStatementsPayload().get();
      return expect(repository.get(payload)).rejects.toEqual({response: 'Server error'});
    });

    test('should populate http header and parameters according to provided data', () => {
      repository.httpClients[0].get.mockImplementation(() => {
        return Promise.resolve({data: ''});
      });

      const payload = new GetStatementsPayload()
        .setResponseType(RDFMimeType.RDF_JSON)
        .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
        .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
        .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
        .setContext('<http://example.org/graph3>')
        .setInference(true)
        .get();

      return repository.get(payload).then(() => {
        verifyGetRequest();
      });
    });

    test('should convert the provided payload to N-Triple resources if not already encoded', () => {
      const payload = new GetStatementsPayload()
        .setResponseType(RDFMimeType.RDF_JSON)
        .setSubject('http://eunis.eea.europa.eu/countries/AZ')
        .setPredicate('http://eunis.eea.europa.eu/rdf/schema.rdf#population')
        .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
        .setContext('http://example.org/graph3')
        .setInference(true)
        .get();

      return repository.get(payload).then(() => {
        verifyGetRequest();
      });
    });

    function verifyGetRequest() {
      const httpGet = repository.httpClients[0].get;
      expect(httpGet).toHaveBeenCalledWith('/statements', {
        headers: {'Accept': RDFMimeType.RDF_JSON},
        params: {
          infer: true,
          subj: '<http://eunis.eea.europa.eu/countries/AZ>',
          pred: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>',
          obj: '"7931000"^^http://www.w3.org/2001/XMLSchema#integer',
          context: '<http://example.org/graph3>'
        }
      });
    }

    test('should fetch and return single statement as plain string', () => {
      repository.httpClients[0].get.mockImplementation(() => Promise.resolve({
        data: data.repositories.repo1.statements.GET['single_application/rdf+xml']
      }));

      const payload = new GetStatementsPayload()
        .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
        .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
        .setResponseType(RDFMimeType.RDF_XML)
        .get();

      const expectedPayload = {
        subject: '<http://eunis.eea.europa.eu/countries/AZ>',
        predicate: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>',
        responseType: 'application/rdf+xml'
      };
      expect(payload).toEqual(expectedPayload);

      const expectedResponse = '<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns="http://eunis.eea.europa.eu/rdf/schema.rdf#"><rdf:Description rdf:about="http://eunis.eea.europa.eu/countries/AZ"><population rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">7931000</population></rdf:Description></rdf:RDF>';
      return expect(repository.get(payload)).resolves.toEqual(expectedResponse);
    });

    test('should fetch and return all statement as plain string', () => {
      repository.httpClients[0].get.mockImplementation(() => Promise.resolve({
        data: data.repositories.repo1.statements.GET['all_application/rdf+xml']
      }));
      const expected = '<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns="http://eunis.eea.europa.eu/rdf/schema.rdf#"><rdf:Description rdf:about="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description><rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#subPropertyOf"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/><rdf:type rdf:resource="http://www.w3.org/2002/07/owl#TransitiveProperty"/></rdf:Description><rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#subClassOf"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/><rdf:type rdf:resource="http://www.w3.org/2002/07/owl#TransitiveProperty"/></rdf:Description><rdf:Description rdf:about="http://www.w3.org/2000/01/rdf-schema#domain"><rdf:type rdf:resource="http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"/></rdf:Description></rdf:RDF>';

      const payload = new GetStatementsPayload().get();
      return expect(repository.get(payload)).resolves.toEqual(expected);
    });
  });

  describe('download', () => {
    beforeEach(() => {
      HttpClient.mockImplementation(() => httpClientStub());

      config = new RepositoryClientConfig(endpoints, headers, contentType,
        readTimeout, writeTimeout);
      repository = new RDFRepositoryClient(config);
    });

    test('should fetch data and return readable stream to the client', (done) => {
      const source = streamSource();
      const stream = new ObjectReadableMock(source);
      const expected = expectedStream();
      const expectedIt = expected[Symbol.iterator]();

      const payload = new GetStatementsPayload()
        .setResponseType(RDFMimeType.TURTLE)
        .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
        .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
        .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
        .setContext('<http://example.org/graph3>')
        .get();

      repository.httpClients[0].get.mockResolvedValue({
        data: stream
      });

      return repository.download(payload).then((stream) => {
        stream.on('data', (chunk) => {
          expect(chunk).toEqual(expectedIt.next().value);
        });
        stream.on('end', done);
      });
    });

    test('should make a GET request with proper arguments', () => {
      const getMock = repository.httpClients[0].get;
      const payload = new GetStatementsPayload()
        .setResponseType(RDFMimeType.TURTLE)
        .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
        .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
        .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
        .setContext('<http://example.org/graph3>')
        .setInference(true)
        .get();

      return repository.download(payload).then(() => {
        verifyDownloadRequest(getMock);
      });
    });

    test('should convert the download request to N-Triple resources if not already encoded', () => {
      const getMock = repository.httpClients[0].get;
      const payload = new GetStatementsPayload()
        .setResponseType(RDFMimeType.TURTLE)
        .setSubject('http://eunis.eea.europa.eu/countries/AZ')
        .setPredicate('http://eunis.eea.europa.eu/rdf/schema.rdf#population')
        .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
        .setContext('http://example.org/graph3')
        .setInference(true)
        .get();

      return repository.download(payload).then(() => {
        verifyDownloadRequest(getMock);
      });
    });

    function verifyDownloadRequest(getMock) {
      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith('/statements', {
        headers: {
          'Accept': 'text/turtle'
        },
        responseType: 'stream',
        params: {
          subj: '<http://eunis.eea.europa.eu/countries/AZ>',
          pred: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>',
          obj: '"7931000"^^http://www.w3.org/2001/XMLSchema#integer',
          context: '<http://example.org/graph3>',
          infer: true
        }
      });
    }

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
});
