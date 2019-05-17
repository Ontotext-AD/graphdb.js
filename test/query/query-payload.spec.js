const QueryPayload = require('query/query-payload');

describe('QueryPayload', () => {
  describe('constructor', () => {
    test('should set defaults', () => {
      const queryPayload = new QueryPayload();
      expect(queryPayload.payload).toEqual({});
      expect(queryPayload.contentType).toEqual(null);
    });
  });

  describe('setInference', () => {
    test('should throw error when inference is not a boolean', () => {
      expect(() => new QueryPayload().setInference('true')).toThrow(`Inference must be a boolean!`);
    });
  });

  describe('setTimeout', () => {
    test('should throw error when timeout is not a number', () => {
      expect(() => new QueryPayload().setTimeout('123')).toThrow(`Timeout must be a number!`);
    });
  });

  describe('setContentType', () => {
    test('should throw error if contentType is not string', () => {
      const payload = new QueryPayload();
      expect(() => payload.setContentType(123)).toThrow(Error);
    });
  });

  describe('validateParams', () => {
    test('should return false by default as the method should be implemented from successors', () => {
      expect(new QueryPayload().validateParams()).toBeFalsy();
    });
  });
});
