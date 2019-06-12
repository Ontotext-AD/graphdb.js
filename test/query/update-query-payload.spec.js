const UpdateQueryPayload = require('query/update-query-payload');
const QueryContentType = require('http/query-content-type');

describe('UpdateQueryPayload', () => {
  describe('constructor', () => {
    test('should set default contentType', () => {
      const queryPayload = new UpdateQueryPayload();
      expect(queryPayload.getContentType()).toEqual(QueryContentType.SPARQL_UPDATE);
    });
  });

  describe('setQuery', () => {
    test('should throw error when query is not a string', () => {
      expect(() => new UpdateQueryPayload().setQuery(123)).toThrow(Error('Query must be a string!'));
    });
  });

  describe('setContentType', () => {
    test('should set contentType', () => {
      const payload = new UpdateQueryPayload();
      payload.setContentType(QueryContentType.X_WWW_FORM_URLENCODED);
      expect(payload.getContentType()).toEqual(QueryContentType.X_WWW_FORM_URLENCODED);
    });

    test('should throw error when contentType is not supported', () => {
      expect(() => new UpdateQueryPayload().setContentType('unsupported'))
        .toThrow(Error('Content type must be one of application/x-www-form-urlencoded,application/sparql-update!'));
    });
  });

  describe('getSupportedContentTypes', () => {
    test('should return supported type for sparql update operation', () => {
      expect(new UpdateQueryPayload().getSupportedContentTypes()).toEqual(['application/x-www-form-urlencoded', 'application/sparql-update']);
    });
  });

  test('should populate graphs parameters in the update payload', () => {
    let payload = new UpdateQueryPayload()
      .setDefaultGraphs('<http://example.org/graph1>')
      .setNamedGraphs('<http://example.org/graph2>')
      .setRemoveGraphs('<http://example.org/graph3>')
      .setInsertGraphs('<http://example.org/graph4>');
    expect(payload.getDefaultGraphs()).toEqual('<http://example.org/graph1>');
    expect(payload.getNamedGraphs()).toEqual('<http://example.org/graph2>');
    expect(payload.getRemoveGraphs()).toEqual('<http://example.org/graph3>');
    expect(payload.getInsertGraphs()).toEqual('<http://example.org/graph4>');
    expect(payload).toEqual({
      contentType: QueryContentType.SPARQL_UPDATE,
      payload: {
        'using-graph-uri': '<http://example.org/graph1>',
        'using-named-graph-uri': '<http://example.org/graph2>',
        'remove-graph-uri': '<http://example.org/graph3>',
        'insert-graph-uri': '<http://example.org/graph4>' 
      }
    });
  });
});
