const ParserRegistry = require('parser/parser-registry');
const SomeParser = require('./parser-mocks').SomeParser;
const RdfAsXmlParser = require('./parser-mocks').RdfAsXmlParser;
const RdfAsJsonParser = require('./parser-mocks').RdfAsJsonParser;
const AnotherRdfAsJsonParser = require('./parser-mocks').AnotherRdfAsJsonParser;

describe('ParserRegistry', () => {

  let registry;

  beforeEach(() => {
    registry = new ParserRegistry();
  });

  describe('initialize', () => {
    test('should be initialized with default empty map', () => {
      const registry = new ParserRegistry();
      expect(registry.parsers).toEqual({});
    });

    test('should validate provided parsers and throw error when invalid parser is provided', () => {
      expect(() => {
        new ParserRegistry([new RdfAsJsonParser(), new SomeParser()]);
      }).toThrow(Error('Parser is not provided or does not implement ContentTypeParser!'));
    });

    test('should populate provided parsers', () => {
      const registry = new ParserRegistry([new RdfAsJsonParser(), new RdfAsXmlParser()]);

      const expected = {
        'application/rdf+json': new RdfAsJsonParser(),
        'application/rdf+xml': new RdfAsXmlParser(),
      };
      expect(registry.parsers).toEqual(expected);
    });
  });

  describe('register', () => {
    test('should throw error when a parser is not provided', () => {
      expect(() => registry.register()).toThrow(Error);
    });

    test('should throw error when parser is not provided', () => {
      expect(() => registry.register(new SomeParser())).toThrow(Error('Parser is not provided or does not implement ContentTypeParser!'));
    });

    test('should register new parser', () => {
      registry.register(new RdfAsJsonParser());

      expect(Object.keys(registry.parsers)[0]).toEqual('application/rdf+json');
      expect(Object.values(registry.parsers)[0]).toBeInstanceOf(RdfAsJsonParser);
    });

    test('should override an existing parser', () => {
      registry.register(new RdfAsJsonParser());
      registry.register(new AnotherRdfAsJsonParser());

      expect(Object.keys(registry.parsers)[0]).toEqual('application/rdf+json');
      expect(Object.values(registry.parsers)[0]).toBeInstanceOf(AnotherRdfAsJsonParser);
    });
  });

  describe('get', () => {
    test('should return a registered parser of given type', () => {
      registry.register(new RdfAsJsonParser());

      expect(registry.get('application/rdf+json')).toBeInstanceOf(RdfAsJsonParser);
    });

    test('should return undefined if parser of given type is not found', () => {
      registry.register(new RdfAsJsonParser());

      expect(registry.get('application/rdf+xml')).toBeUndefined();
    });
  });
});
