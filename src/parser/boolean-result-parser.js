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
   * Parses a boolean result and returns a Promise that resolves to
   * a boolean value.
   *
   * @param {NodeJS.ReadableStream|string|Buffer} input -
   * Either a readable stream containing text "true" or "false", or a
   * string/Buffer with that content
   * @return {Promise<boolean>} a promise that resolves to the parsed boolean
   */
  parse(input) {
    if (typeof input === 'string' || Buffer.isBuffer(input)) {
      return this.parseString(input);
    } else if (input && typeof input.on === 'function') {
      return this.parseStream(input);
    } else {
      return Promise.reject(
        new Error(`Invalid input type for BooleanResultParser: expected string, Buffer, or stream, got ${typeof input}`));
    }
  }

  /**
   * Parses a string or buffer containing a boolean result.
   *
   * @private
   * @param {string|Buffer} data
   * @return {Promise<boolean>}
   */
  parseString(data) {
    return new Promise((resolve, reject) => {
      try {
        const text = Buffer.isBuffer(data) ? data.toString() : data;
        const trimmed = text.toLowerCase().trim();
        if (trimmed === 'true') {
          resolve(true);
        } else if (trimmed === 'false') {
          resolve(false);
        } else {
          reject(
            new Error(`Invalid value: expected "true" or "false", got "${text}"`));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Parses a stream containing a boolean result.
   *
   * @private
   * @param {NodeJS.ReadableStream} stream
   * @return {Promise<boolean>}
   */
  parseStream(stream) {
    return new Promise((resolve, reject) => {
      let data = '';

      stream.on('data', (chunk) => {
        data += chunk.toString();
      });

      stream.on('end', () => {
        this.parseString(data).then(resolve, reject);
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
