const {RDFRepositoryClient, AddStatementPayload} = require('graphdb').repository;
const {GetQueryPayload, QueryType} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;
const {XSD} = require('graphdb').model.Types;
const Utils = require('utils.js');
const Config = require('config.js');

const SUBJECT = 'http://domain/resource/resource-1';

describe('Statements with literal data types', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should store an auto-detected integer as a numeric xsd:integer', () => {
    const predicate = 'http://domain/property/property-int';
    return addLiteral(predicate, 5).then(() => {
      return ask(`ASK { <${SUBJECT}> <${predicate}> 5 }`);
    }).then((result) => {
      expect(result).toBe('true');
      return ask(`ASK { <${SUBJECT}> <${predicate}> ?o FILTER(isNumeric(?o) && ?o > 3) }`);
    }).then((result) => {
      expect(result).toBe('true');
    });
  });

  test('Should store an auto-detected decimal as a numeric xsd:decimal', () => {
    const predicate = 'http://domain/property/property-decimal';
    return addLiteral(predicate, 1.5).then(() => {
      return ask(`ASK { <${SUBJECT}> <${predicate}> 1.5 }`);
    }).then((result) => {
      expect(result).toBe('true');
      return ask(`ASK { <${SUBJECT}> <${predicate}> ?o FILTER(isNumeric(?o)) }`);
    }).then((result) => {
      expect(result).toBe('true');
    });
  });

  test('Should store an auto-detected boolean as xsd:boolean', () => {
    const predicate = 'http://domain/property/property-boolean';
    return addLiteral(predicate, true).then(() => {
      return ask(`ASK { <${SUBJECT}> <${predicate}> true }`);
    }).then((result) => {
      expect(result).toBe('true');
    });
  });

  test('Should expand the xsd prefix of an explicit data type', () => {
    const predicate = 'http://domain/property/property-explicit-int';
    return addLiteral(predicate, '7', XSD.INTEGER).then(() => {
      return ask(`ASK { <${SUBJECT}> <${predicate}> ?o
        FILTER(datatype(?o) = <http://www.w3.org/2001/XMLSchema#integer>) }`);
    }).then((result) => {
      expect(result).toBe('true');
    });
  });

  function addLiteral(predicate, value, type) {
    const payload = new AddStatementPayload()
      .setSubject(SUBJECT)
      .setPredicate(predicate)
      .setObjectLiteral(value, type);
    return rdfClient.add(payload);
  }

  function ask(query) {
    const payload = new GetQueryPayload()
      .setQuery(query)
      .setQueryType(QueryType.ASK)
      .setResponseType(RDFMimeType.BOOLEAN_RESULT);
    return rdfClient.query(payload).then((resp) => Utils.readStream(resp));
  }
});
