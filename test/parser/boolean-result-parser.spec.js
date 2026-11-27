const {Readable} = require('stream');
const BooleanResultParser = require('parser/boolean-result-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('BooleanResultParser', () => {
  let parser;

  beforeEach(() => {
    parser = new BooleanResultParser();
  });

  test('Should parse true result', (done) => {
    const stream = Readable.from(['true']);

    parser.parse(stream).then((result) => {
      expect(result).toBe(true);
      done();
    }).catch(done);
  });

  test('Should parse false result', (done) => {
    const stream = Readable.from(['false']);

    parser.parse(stream).then((result) => {
      expect(result).toBe(false);
      done();
    }).catch(done);
  });

  test('Should trim whitespace', (done) => {
    const stream = Readable.from([' true \n']);

    parser.parse(stream).then((result) => {
      expect(result).toBe(true);
      done();
    }).catch(done);
  });

  test('Should handle multipart chunks', (done) => {
    const stream = Readable.from(['tr', 'ue']);

    parser.parse(stream).then((result) => {
      expect(result).toBe(true);
      done();
    }).catch(done);
  });

  test('Should parse the result regardless of letter case', (done) => {
    const stream = Readable.from(['TRUE']);

    parser.parse(stream).then((result) => {
      expect(result).toBe(true);
      done();
    }).catch(done);
  });

  test('Should reject a value that is neither true nor false', (done) => {
    const stream = Readable.from(['yes']);

    parser.parse(stream).catch((error) => {
      expect(error.message).toBe('Invalid value: expected "true" or "false", got "yes"');
      done();
    });
  });

  test('Should return supported type', () => {
    expect(parser.getSupportedType()).toEqual(RDFMimeType.BOOLEAN_RESULT);
  });

  test('Should indicate non-streaming', () => {
    expect(parser.isStreaming()).toBe(false);
  });

  test('Should handle stream errors', (done) => {
    const stream = new Readable({
      read() {
        this.destroy(new Error('Stream error'));
      }
    });

    parser.parse(stream).catch((error) => {
      expect(error.message).toBe('Stream error');
      done();
    });
  });
});
