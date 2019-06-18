const TermConverter = require('model/term-converter');
const N3 = require('n3');

jest.mock('n3');

/*
 * Testing corner cases in TermConverter
 */
describe('TermConverter', () => {
  test('should reject adding quads if serialization fails', () => {
    N3.Writer = () => {
      return {
        addQuads: jest.fn(),
        end: (callback) => callback('error')
      };
    };
    expect(() => TermConverter.toString([])).toThrow('error');
  });
});
