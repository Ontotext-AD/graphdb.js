const TermConverter = require('model/term-converter');

const TRIPLE_TERM = '<<( <http://ex.org/s> <http://ex.org/p> <http://ex.org/o> )>>';
const TRIPLE_TERM_WITH_LITERAL = '<<( <http://ex.org/s> <http://ex.org/p> "София"@bg )>>';
const ENCODED_PAYLOAD = 'PDwoIDxodHRwOi8vZXgub3JnL3M-IDxodHRwOi8vZXgub3JnL3A-ICLQodC-0YTQuNGPIkBiZyApPj4';
const ENCODED_TRIPLE_TERM_WITH_LITERAL = `urn:rdf4j:tripleTerm:${ENCODED_PAYLOAD}`;

describe('TermConverter', () => {
  describe('getQuads()', () => {
    test('should support variables', () => {
      const quads = TermConverter.getQuads('subject', '?p', '?o');
      expect(quads.length).toEqual(1);

      const quad = quads[0];
      const subjectTerm = quad.subject;
      expect(subjectTerm.termType).toEqual('NamedNode');
      expect(subjectTerm.value).toEqual('subject');

      const predicateTerm = quad.predicate;
      expect(predicateTerm.termType).toEqual('Variable');
      expect(predicateTerm.value).toEqual('p');

      const objectTerm = quad.object;
      expect(objectTerm.termType).toEqual('Variable');
      expect(objectTerm.value).toEqual('o');
    });
  });

  describe('fromBase64TripleTerm()', () => {
    test('should decode correctly', () => {
      const encoded = 'urn:rdf4j:tripleTerm:' +
        'PDwoIDxodHRwOi8vZXgub3JnL3M-IDxodHRwOi8vZXgub3JnL3A-IDxodHRwOi8vZXgub3JnL28-ICk-Pg';
      const decoded = TermConverter.fromBase64TripleTerm(encoded);
      expect(decoded).toEqual(TRIPLE_TERM);
    });

    test('should decode non-ASCII literals as UTF-8', () => {
      const decoded = TermConverter.fromBase64TripleTerm(ENCODED_TRIPLE_TERM_WITH_LITERAL);
      expect(decoded).toEqual(TRIPLE_TERM_WITH_LITERAL);
    });

    test('should not decode without the urn:rdf4j:tripleTerm: prefix', () => {
      const decoded = TermConverter.fromBase64TripleTerm(ENCODED_PAYLOAD);
      expect(decoded).toEqual(ENCODED_PAYLOAD);
    });

    test('should decode the urn:rdf4j:triple: prefix that GraphDB 11 returned', () => {
      const encoded = `urn:rdf4j:triple:${ENCODED_PAYLOAD}`;
      const decoded = TermConverter.fromBase64TripleTerm(encoded);
      expect(decoded).toEqual(TRIPLE_TERM_WITH_LITERAL);
    });
  });

  describe('toBase64TripleTerm()', () => {
    test('should encode correctly', () => {
      const encoded = TermConverter.toBase64TripleTerm(TRIPLE_TERM);
      expect(encoded).toEqual('urn:rdf4j:tripleTerm:' +
        'PDwoIDxodHRwOi8vZXgub3JnL3M-IDxodHRwOi8vZXgub3JnL3A-IDxodHRwOi8vZXgub3JnL28-ICk-Pg');
    });

    test('should encode non-ASCII literals as UTF-8', () => {
      const encoded = TermConverter.toBase64TripleTerm(TRIPLE_TERM_WITH_LITERAL);
      expect(encoded).toEqual(ENCODED_TRIPLE_TERM_WITH_LITERAL);
    });

    test('should round trip a triple term', () => {
      const decoded = TermConverter.fromBase64TripleTerm(TermConverter.toBase64TripleTerm(TRIPLE_TERM_WITH_LITERAL));
      expect(decoded).toEqual(TRIPLE_TERM_WITH_LITERAL);
    });

    test('should not encode values that are not triple terms', () => {
      const value = '<http://ex.org/s>';
      const encoded = TermConverter.toBase64TripleTerm(value);
      expect(encoded).toEqual(value);
    });

    test('should not encode the RDF-star syntax, which is not an RDF 1.2 triple term', () => {
      const rdfStar = '<< <http://ex.org/s> <http://ex.org/p> <http://ex.org/o> >>';
      const encoded = TermConverter.toBase64TripleTerm(rdfStar);
      expect(encoded).toEqual(rdfStar);
    });
  });

  describe('parseTripleTerm()', () => {
    test('should parse a triple term to a quad with the triple as the subject and the object', () => {
      const quad = TermConverter.parseTripleTerm(TRIPLE_TERM);
      expect(quad.subject.value).toEqual('http://ex.org/s');
      expect(quad.predicate.value).toEqual('http://ex.org/p');
      expect(quad.object.value).toEqual('http://ex.org/o');
    });

    test('should parse a triple term with a literal object', () => {
      const quad = TermConverter.parseTripleTerm(TRIPLE_TERM_WITH_LITERAL);
      expect(quad.object.termType).toEqual('Literal');
      expect(quad.object.value).toEqual('София');
      expect(quad.object.language).toEqual('bg');
    });

    test('should return null for a value that is not a triple term', () => {
      expect(TermConverter.parseTripleTerm('<http://ex.org/s>')).toBeNull();
      expect(TermConverter.parseTripleTerm(undefined)).toBeNull();
    });

    test('should return null for a triple term that cannot be parsed', () => {
      expect(TermConverter.parseTripleTerm('<<( <http://ex.org/s> <http://ex.org/p> )>>')).toBeNull();
    });
  });

  describe('deprecated RDF-star helpers', () => {
    test('fromBase64RdfStarTriple() should decode like fromBase64TripleTerm()', () => {
      expect(TermConverter.fromBase64RdfStarTriple(ENCODED_TRIPLE_TERM_WITH_LITERAL))
        .toEqual(TermConverter.fromBase64TripleTerm(ENCODED_TRIPLE_TERM_WITH_LITERAL));
    });

    test('toBase64RdfStarTriple() should encode like toBase64TripleTerm()', () => {
      expect(TermConverter.toBase64RdfStarTriple(TRIPLE_TERM_WITH_LITERAL))
        .toEqual(TermConverter.toBase64TripleTerm(TRIPLE_TERM_WITH_LITERAL));
    });
  });
});
