const StatementPayload = require('repository/statement-payload');

/**
 * Object builder used for constructing a statement addition payload.
 *
 * @class
 * @author Mihail Radkov
 */
class AddStatementPayload extends StatementPayload {
  /**
   * Sets the language this statement's object.
   *
   * This makes the statement a literal.
   *
   * @param {string} [language] the object's language
   * @return {AddStatementPayload} the payload for method chaining
   */
  setLanguage(language) {
    this.payload.language = language;
    return this;
  }

  /**
   * Sets the data type this statement's object.
   *
   * This makes the statement a literal.
   *
   * @param {string} [dataType] the object's data type
   * @return {AddStatementPayload} the payload for method chaining
   */
  setDataType(dataType) {
    this.payload.dataType = dataType;
    return this;
  }
}

module.exports = AddStatementPayload;
