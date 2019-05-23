const StatementPayload = require('../repository/statement-payload');
const XSD = require('../model/types').XSD;

/**
 * Object builder used for constructing a statement addition payload.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
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
   * Returns the statement object's language.
   *
   * Having a language means it is a literal.
   *
   * @return {string} the language
   */
  getLanguage() {
    return this.payload.language;
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

  /**
   * Returns the statement object's data type.
   *
   * Having a data type means it is a literal.
   *
   * @return {string} the data type
   */
  getDataType() {
    return this.payload.dataType;
  }

  /**
   * Sets the statement's object value making it a literal.
   *
   * If the data type is not provided, it will try to autodetect it:
   * <ul>
   *   <li>integer -> xsd:integer</li>
   *   <li>float -> xsd:decimal</li>
   *   <li>boolean -> xsd:boolean</li>
   * </ul>
   * Everything else will be considered as xsd:string.
   *
   * To set a language the data type must be xsd:string.
   *
   * @param {*} value the statements object value
   * @param {string} [type] the statements object data type
   * @param {string} [language] the statements object language
   * @return {AddStatementPayload} the payload for method chaining
   */
  setObjectLiteral(value, type, language) {
    if (type) {
      if (type === XSD.STRING && language) {
        this.setLanguage(language);
      }
      this.setDataType(type);
    } else {
      this.setDataType(this.detectLiteralType(value));
    }
    this.setObject(value);
    return this;
  }

  /**
   * Autodetect the provided value's data type.
   *
   * @private
   * @param {*} value the value which type will be autodetected
   * @return {string} the detected data type
   */
  detectLiteralType(value) {
    const valueType = typeof value;
    if (valueType === 'number') {
      if (value % 1 === 0) {
        return XSD.INTEGER;
      } else {
        return XSD.DECIMAL;
      }
    } else if (valueType === 'boolean') {
      return XSD.BOOLEAN;
    }
    // Default
    return XSD.STRING;
  }

  /**
   * Returns if this statement payload is for a literal. A literal have
   * data type and/or language.
   *
   * @return {boolean} <code>true</code> if it is a literal payload or
   * <code>false</code> otherwise
   */
  isLiteral() {
    return !!(this.payload.language || this.payload.dataType);
  }

  /**
   * Sets the base URI that is used for resolving any relative URIs in the
   * current payload.
   *
   * @param {string} baseURI the base URI
   * @return {AddStatementPayload} the payload for method chaining
   */
  setBaseURI(baseURI) {
    this.payload.baseURI = baseURI;
    return this;
  }

  /**
   * Returns the base URI that is used for resolving any relative URIs.
   *
   * @return {string} the base URI
   */
  getBaseURI() {
    return this.payload.baseURI;
  }
}

module.exports = AddStatementPayload;
