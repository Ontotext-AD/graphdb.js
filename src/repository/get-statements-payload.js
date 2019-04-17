const RDFContentType = require('http/rdf-content-type');

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
 */
class GetStatementsPayload {
  /**
   * Constructs this payload class populating some reasonable defaults.
   */
  constructor() {
    this.payload = {
      responseType: RDFContentType.RDF_JSON
    };
  }

  /**
   * @param {(string|Term)} [subject]
   * @return {GetStatementsPayload}
   */
  setSubject(subject) {
    this.payload.subject = subject;
    return this;
  }

  /**
   * @param {(string|Term)} [predicate]
   * @return {GetStatementsPayload}
   */
  setPredicate(predicate) {
    this.payload.predicate = predicate;
    return this;
  }

  /**
   * @param {(string|Term)} [object]
   * @return {GetStatementsPayload}
   */
  setObject(object) {
    this.payload.object = object;
    return this;
  }

  /**
   * @param {(NamedNode[]|string[])} [context]
   * @return {GetStatementsPayload}
   */
  setContext(context) {
    this.payload.context = context;
    return this;
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
   * Sets responseType parameter.
   * @param {RDFContentType} [responseType]
   * @return {GetStatementsPayload}
   */
  setResponseType(responseType) {
    this.payload.responseType = responseType;
    return this;
  }

  /**
   * Get the payload object.
   * @return {Object}
   */
  get() {
    return this.payload;
  }
}

module.exports = GetStatementsPayload;
