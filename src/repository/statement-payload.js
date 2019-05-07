/**
 * Abstract class for constructing a statement payload consisted of:
 * <ul>
 *  <li>subject</li>
 *  <li>predicate</li>
 *  <li>object</li>
 *  <li>context or contexts</li>
 * </ul>
 *
 * @class
 * @abstract
 */
class StatementPayload {
  /**
   * Instantiates new statement payload.
   */
  constructor() {
    this.payload = {};
  }

  /**
   * @param {(string|Term)} [subject]
   * @return {StatementPayload}
   */
  setSubject(subject) {
    this.payload.subject = subject;
    return this;
  }

  /**
   * @param {(string|Term)} [predicate]
   * @return {StatementPayload}
   */
  setPredicate(predicate) {
    this.payload.predicate = predicate;
    return this;
  }

  /**
   * @param {(string|Term)} [object]
   * @return {StatementPayload}
   */
  setObject(object) {
    this.payload.object = object;
    return this;
  }

  /**
   * @param {(NamedNode[]|string[])} [context]
   * @return {StatementPayload}
   */
  setContext(context) {
    this.payload.context = context;
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

module.exports = StatementPayload;
