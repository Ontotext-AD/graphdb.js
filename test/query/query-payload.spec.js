const QueryPayload = require('query/query-payload');
const QueryLanguage = require('query/query-language');
const QueryType = require('query/query-type');
const RDFMimeType = require('http/rdf-mime-type');
const QueryContentType = require('http/query-content-type');

describe('QueryPayload', () => {
  describe('constructor', () => {
    test('should set defaults', () => {
      const queryPayload = new QueryPayload();
      expect(queryPayload.payload).toEqual({});
      expect(queryPayload.getContentType()).toEqual(QueryContentType.X_WWW_FORM_URLENCODED);
    });
  });

  describe('setQuery', () => {
    test('should throw error when query is not a string', () => {
      expect(() => new QueryPayload().setQuery(123)).toThrow(Error('Query must be a string!'));
    });
  });

  describe('setQueryLn', () => {
    test('should throw error when queryLn is not supported', () => {
      expect(() => new QueryPayload().setQueryLn('unsupported')).toThrow(`Query language must be one of sparql,serql!`);
    });
  });

  describe('setInference', () => {
    test('should throw error when inference is not a boolean', () => {
      expect(() => new QueryPayload().setInference('true')).toThrow(`Inference must be a boolean!`);
    });
  });

  describe('addBinding', () => {
    test('should throw error when binding or value are not strings', () => {
      expect(() => new QueryPayload().addBinding(123, 'value')).toThrow(`Binding and value must be strings!`);
      expect(() => new QueryPayload().addBinding('binding', 123)).toThrow(`Binding and value must be strings!`);
      expect(() => new QueryPayload().addBinding(123, {})).toThrow(`Binding and value must be strings!`);
    });
  });

  describe('setDistinct', () => {
    test('should throw error when distinct is not a boolean', () => {
      expect(() => new QueryPayload().setDistinct('false')).toThrow(`Distinct must be a boolean!`);
    });
  });

  describe('setLimit', () => {
    test('should throw error when limit is not a positive number', () => {
      expect(() => new QueryPayload().setLimit('123')).toThrow(`Limit must be a positive number!`);
      expect(() => new QueryPayload().setLimit(-123)).toThrow(`Limit must be a positive number!`);
    });
  });

  describe('setOffset', () => {
    test('should throw error when offset is not a positive number', () => {
      expect(() => new QueryPayload().setOffset('123')).toThrow(`Offset must be a positive number!`);
      expect(() => new QueryPayload().setOffset(-123)).toThrow(`Offset must be a positive number!`);
    });
  });

  describe('setTimeout', () => {
    test('should throw error when timeout is not a number', () => {
      expect(() => new QueryPayload().setTimeout('123')).toThrow(`Timeout must be a number!`);
    });
  });

  describe('setResponseType', () => {
    test('should set responseType', () => {
      const payload = new QueryPayload();
      payload.setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);
      expect(payload.getResponseType())
        .toEqual(RDFMimeType.SPARQL_RESULTS_JSON);
    });

    test('should throw error when responseType is not one of supported types', () => {
      expect(() => new QueryPayload().setResponseType('unsupported'))
        .toThrowError();
    });
  });

  describe('setContentType', () => {
    test('should set contentType', () => {
      const payload = new QueryPayload();
      payload.setContentType(QueryContentType.X_WWW_FORM_URLENCODED);
      expect(payload.getContentType()).toEqual(QueryContentType.X_WWW_FORM_URLENCODED);
    });

    test('should throw error when contentType is not supported', () => {
      expect(() => new QueryPayload().setContentType('unsupported'))
        .toThrow(Error('Content type must be one of application/x-www-form-urlencoded,application/sparql-query!'));
    });
  });

  describe('setQueryType', () => {
    test('should set queryType', () => {
      const payload = new QueryPayload();
      payload.setQueryType(QueryType.DESCRIBE);
      expect(payload.getQueryType()).toEqual('DESCRIBE');
    });

    test('should throw error when queryType is not one of the supported query types', () => {
      expect(() => new QueryPayload().setQueryType('unsupported'))
        .toThrowError();
    });
  });

  describe('getParams', () => {
    test('should throw error when contentType=sparql-query and query is missing', () => {
      const payload = new QueryPayload()
        .setContentType(QueryContentType.SPARQL_QUERY);
      expect(() => payload.getParams()).toThrow(Error('Parameter query is mandatory!'));
    });

    test('should return the query parameter only when contentType=sparql-query', () => {
      const payload = new QueryPayload()
        .setContentType(QueryContentType.SPARQL_QUERY)
        .setQuery('select * where {?s ?p ?o} limit 10');
      expect(payload.getParams()).toEqual('select * where {?s ?p ?o} limit 10');
    });

    test('should serialize and return populated parameters in the payload object when contentType=x-www-form-urlencoded', () => {
      const payload = new QueryPayload()
        .setQuery('select * where {<http://eunis.eea.europa.eu/countries/NO> ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setInference(true)
        .setDistinct(true)
        .setLimit(10)
        .setOffset(0)
        .setTimeout(5)
        .addBinding('$p', 'http://ns#type')
        .addBinding('$o', 'http://ns#Person');

      expect(payload.getParams()).toEqual('query=select%20*%20where%20%7B%3Chttp%3A%2F%2Feunis.eea.europa.eu%2Fcountries%2FNO%3E%20%3Fp%20%3Fo%7D&queryLn=sparql&infer=true&distinct=true&limit=10&offset=0&timeout=5&%24p=http%3A%2F%2Fns%23type&%24o=http%3A%2F%2Fns%23Person');
    });

    test('should throw error if query is missing', () => {
      const payload = new QueryPayload()
        .setQueryType(QueryType.SELECT);
      expect(() => payload.getParams()).toThrow(Error('Parameter query is mandatory!'));
    });

    test('should throw error if queryType is missing', () => {
      const payload = new QueryPayload()
        .setQuery('select * where {<http://eunis.eea.europa.eu/countries/NO> ?p ?o}');
      expect(() => payload.getParams()).toThrow(Error('Parameter queryType is mandatory!'));
    });

    test('should throw error if responseType is missing', () => {
      const payload = new QueryPayload()
        .setQuery('select * where {<http://eunis.eea.europa.eu/countries/NO> ?p ?o}')
        .setQueryType(QueryType.SELECT);
      expect(() => payload.getParams()).toThrow(Error('Parameter responseType is mandatory!'));
    });

    test('should throw error if responseType is not compatible with the SELECT queryType', () => {
      const payload = new QueryPayload()
        .setQuery('select * where {<http://eunis.eea.europa.eu/countries/NO> ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.TURTLE);
      expect(() => payload.getParams()).toThrowError();
    });

    test('should throw error if responseType is not compatible with the CONSTRUCT queryType', () => {
      const payload = new QueryPayload()
        .setQuery('construct {?s ?p ?o} where {?s ?p ?o}')
        .setQueryType(QueryType.CONSTRUCT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);
      expect(() => payload.getParams()).toThrowError();
    });

    test('should throw error if responseType is not compatible with the DESCRIBE queryType', () => {
      const payload = new QueryPayload()
        .setQuery('construct {?s ?p ?o} where {?s ?p ?o}')
        .setQueryType(QueryType.DESCRIBE)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);
      expect(() => payload.getParams()).toThrowError();
    });

    test('should throw error if responseType is not compatible with the АSК queryType', () => {
      const payload = new QueryPayload()
        .setQuery('ask {?s ?p ?o}')
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);
      expect(() => payload.getParams()).toThrowError();
    });
  });
});
