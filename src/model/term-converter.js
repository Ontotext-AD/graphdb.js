const N3 = require('n3');

/**
 * Utility class for converting strings to terms, terms to quads and
 * quads to string.
 *
 * @class
 * @author Mihail Radkov
 */
class TermConverter {
  /**
   * Serializes the provided collection of quads to Turtle format.
   *
   * @public
   * @param {Quad[]} quads the collection of quads to serialize to Turtle
   * @return {Promise<string>} a promise that will be resolved to Turtle text
   *          or rejected if the quads cannot be serialized
   */
  static toTurtle(quads) {
    const writer = TermConverter.getWriter();
    writer.addQuads(quads);
    return new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.trim());
        }
      });
    });
  }

  /**
   * Instantiates new N3 writer for quads.
   *
   * This writer is not reusable, after invoking <code>end()</code> it won't
   * allow further quads insertions.
   *
   * @private
   * @return {N3.Writer} new writer for quads
   */
  static getWriter() {
    return new N3.Writer();
  }
}

module.exports = TermConverter;
