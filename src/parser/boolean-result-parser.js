const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');

/**
 * Parse a boolean result stream (text/boolean) and convert it to a Promise
 * that resolves to a boolean value.
 *
 * The text/boolean format is used by GraphDB for ASK query results and
 * contains a single line with either "true" or "false".
 *
 * @class
 */
class BooleanResultParser extends ContentParser {
  /**
   * Parses a stream containing a boolean result ("true" or "false") and
   * returns a Promise that resolves to the parsed boolean value.
   *
   * @param {NodeJS.ReadableStream} stream with the text "true" or "false"
   * @param {Object} [config] optional parser configuration (unused)
   * @return {Promise<boolean>} a promise that resolves to the parsed boolean
   */
  parse(stream) {
    return new Promise((resolve, reject) => {
      let data = '';

      stream.on('data', (chunk) => {
        data += chunk.toString();
      });

      stream.on('end', () => {
        const trimmed = data.trim();
        if (trimmed === 'true') {
          resolve(true);
        } else if (trimmed === 'false') {
          resolve(false);
        } else {
          reject(
            new Error(
              `Invalid value: expected "true" or "false", got "${trimmed}"`));
        }
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * @inheritDoc
   */
  getSupportedType() {
    return RDFMimeType.BOOLEAN_RESULT;
  }

  /**
   * @inheritDoc
   */
  isStreaming() {
    return false;
  }
}

module.exports = BooleanResultParser;
