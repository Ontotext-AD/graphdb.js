const StatementPayload = require('../repository/statement-payload');
const RDFMimeType = require('../http/rdf-mime-type');

/**
 * Payload object holding all request parameters applicable for the statements
 * endpoint.
 * <code>new GetStatementsPayload().setSubject('<http://ns>')
 *  .setInference(true).get()</code> returns a constructed payload <code>
 * { subject: '<http://ns>', inference: true }</code>
 *
 * By default <code>responseType</code> is set to
 * <code>application/rdf+json</code>.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class GetStatementsPayload extends StatementPayload {
  /**
   * Constructs this payload class populating some reasonable defaults.
   */
  constructor() {
    super();
    this.setResponseType(RDFMimeType.RDF_JSON);
  }

  /**
   * @param {boolean} [inference] defines if inferred statements should be
   *      included in the result of GET requests.
   * @return {GetStatementsPayload}
   */
  setInference(inference) {
    this.payload.inference = inference;
    return this;
  }

  /**
   * @return {boolean} inference
   */
  getInference() {
    return this.payload.inference;
  }

  /**
   * Sets responseType parameter.
   * @param {RDFMimeType} [responseType]
   * @return {GetStatementsPayload}
   */
  setResponseType(responseType) {
    this.payload.responseType = responseType;
    return this;
  }

  /**
   * @return {string} responseType
   */
  getResponseType() {
    return this.payload.responseType;
  }
}

module.exports = GetStatementsPayload;
