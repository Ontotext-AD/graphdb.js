const {RDFMimeType} = require('graphdb').http;
const {RDFRepositoryClient, GetStatementsPayload, AddStatementPayload} = require('graphdb').repository;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Statements management', () => {

  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.importData(rdfClient);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should verify statements', () => {

    let addPayload = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-1')
      .setPredicate('http://domain/property/relation-1')
      .setObject('Title')
      .setLanguage('en');

    let addPayloadWithContext = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-2')
      .setPredicate('http://domain/property/relation-2')
      .setObject('Book')
      .setLanguage('en')
      .setContext('http://wine.com/graph/wine2');

    let queryParamsResource1 = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-1>');

    let queryParamsResource2 = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-2>');

    let paramsInferenceTrue = new GetStatementsPayload()
      .setResponseType(RDFMimeType.N_TRIPLES)
      .setSubject('<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#CorbansDryWhiteRiesling>')
      .setInference(true);

    let paramsInferenceFalse = new GetStatementsPayload()
      .setResponseType(RDFMimeType.N_TRIPLES)
      .setSubject('<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#CorbansDryWhiteRiesling>')
      .setInference(false);

    return rdfClient.add(addPayload).then(() => {
      return rdfClient.add(addPayloadWithContext);
    }).then(() => {
      return rdfClient.get(queryParamsResource1);
    }).then((response) => {
      expect(response).toEqual({
        "http://domain/resource/resource-1": {
          "http://domain/property/relation-1": [
            {
              "value": "Title",
              "type": "literal",
              "lang": "en"
            }
          ]
        }
      });
      return rdfClient.get(queryParamsResource2)
    }).then((resp) => {
      expect(resp).toEqual({
        "http://domain/resource/resource-2": {
          "http://domain/property/relation-2": [
            {
              "value": "Book",
              "type": "literal",
              "lang": "en",
              "graphs": [
                "http://wine.com/graph/wine2"
              ]
            }
          ]
        }
      });
      return rdfClient.get(paramsInferenceTrue);
    }).then((response) => {
      expect(response.length).toBe(2035);
      return rdfClient.get(paramsInferenceFalse);
    }).then((response) => {
      expect(response.length).toBe(1244);
      return rdfClient.deleteStatements('<http://domain/resource/resource-1>', null, null);
    }).then(() => {
      return rdfClient.get(queryParamsResource1);
    }).then((resp) => {
      expect(resp).toEqual({});
      return rdfClient.deleteStatements('<http://domain/resource/resource-2>', null, null, '<http://wine.com/graph/wine2>');
    }).then(() => {
      return rdfClient.get(queryParamsResource2);
    }).then((resp) => {
      expect(resp).toEqual({});
    });
  });
});
