const fs = require('fs');
const StringUtils = require('../util/string-utils');

/**
 * Utilities related to working with files and the file system.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class FileUtils {
  /**
   * Opens a readable stream from a file located at the provided file path.
   *
   * If the file path is blank or points to non existent file, the method will
   * result in an error.
   *
   * @param {string} filePath path to the file to be read
   * @return {ReadableStream} stream with the file data
   * @throws {Error} if the file path is not provided or no file exists for it
   */
  static getReadStream(filePath) {
    if (StringUtils.isBlank(filePath)) {
      throw new Error('File path is required');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist for path=' + filePath);
    }

    return fs.createReadStream(filePath);
  }
}

module.exports = FileUtils;
