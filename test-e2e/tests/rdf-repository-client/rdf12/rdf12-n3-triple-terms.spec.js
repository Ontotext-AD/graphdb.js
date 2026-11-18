const N3 = require('n3');

/**
 * Pins the n3 2.x behaviour the client relies on. n3 2.0 removed RDF-star parsing and implements RDF 1.2 instead,
 * so these tests document the term shapes that changed compared to n3 1.x. They do not need a running GraphDB.
 */
describe('n3 2.x term handling', () => {
  const {DataFactory} = N3;
  const {namedNode, literal, quad} = DataFactory;

  const tripleTerm = () => quad(namedNode('http://example.com/a'), namedNode('http://example.com/b'), literal('v'));

  test('Should still be loadable with require() and expose the classes the client uses', () => {
    expect(typeof N3.Parser).toBe('function');
    expect(typeof N3.Writer).toBe('function');
    expect(typeof N3.StreamParser).toBe('function');
    expect(typeof N3.DataFactory.quad).toBe('function');
  });

  test('Should create a triple term as a Quad term through DataFactory', () => {
    const term = tripleTerm();
    expect(term.termType).toBe('Quad');
    expect(term.subject.value).toBe('http://example.com/a');
    expect(term.object.value).toBe('v');
  });

  test('Should create a literal with a base direction', () => {
    const term = literal('hello', {language: 'en', direction: 'ltr'});
    expect(term.language).toBe('en');
    expect(term.direction).toBe('ltr');
  });

  test('Should parse an RDF 1.2 triple term in object position into a Quad term', () => {
    const quads = new N3.Parser({format: 'application/n-triples'})
      .parse('<http://example.com/x> <http://example.com/r> <<( <http://example.com/a> <http://example.com/b> "v" )>> .');
    expect(quads).toHaveLength(1);
    expect(quads[0].object.termType).toBe('Quad');
    expect(quads[0].object.subject.value).toBe('http://example.com/a');
    expect(quads[0].object.object.value).toBe('v');
  });

  test('Should reject a triple term in subject position', () => {
    const parse = () => new N3.Parser({format: 'application/n-triples'})
      .parse('<<( <http://example.com/a> <http://example.com/b> "v" )>> <http://example.com/c> "1" .');
    expect(parse).toThrow(/triple term/i);
  });

  test('Should parse << s p o >> as an RDF 1.2 reified triple instead of a Quad subject', () => {
    // n3 1.x (with a '*' format) returned one quad whose subject was the embedded triple (RDF-star). n3 2.x returns
    // a blank node reifier that rdf:reifies the triple term, and the statement about it is made on the reifier.
    const quads = new N3.Parser({format: 'text/turtle'})
      .parse('<< <http://example.com/a> <http://example.com/b> <http://example.com/c> >> <http://example.com/d> "1" .');
    expect(quads).toHaveLength(2);

    const reification = quads.find((q) => q.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies');
    expect(reification.subject.termType).toBe('BlankNode');
    expect(reification.object.termType).toBe('Quad');

    const statement = quads.find((q) => q.predicate.value === 'http://example.com/d');
    expect(statement.subject.termType).toBe('BlankNode');
    expect(statement.subject.value).toBe(reification.subject.value);
  });

  test('Should write a triple term as <<( s p o )>>', async () => {
    const writer = new N3.Writer({format: 'N-Triples'});
    writer.addQuad(quad(tripleTerm(), namedNode('http://example.com/c'), literal('1')));
    // Resolve with the result and assert outside the callback, so a failure is reported instead of timing out.
    const result = await new Promise((resolve, reject) => {
      writer.end((error, output) => (error ? reject(error) : resolve(output)));
    });
    expect(result).toContain('<<( <http://example.com/a> <http://example.com/b> "v" )>>');
  });
});
