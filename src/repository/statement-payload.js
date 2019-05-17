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
   * @param {string} [subject]
   * @return {StatementPayload}
   */
  setSubject(subject) {
    this.payload.subject = subject;
    return this;
  }

  /**
   * @return {string} subject
   */
  getSubject() {
    return this.payload.subject;
  }

  /**
   * @param {string} [predicate]
   * @return {StatementPayload}
   */
  setPredicate(predicate) {
    this.payload.predicate = predicate;
    return this;
  }

  /**
   * @return {string} predicate
   */
  getPredicate() {
    return this.payload.predicate;
  }

  /**
   * @param {string} [object]
   * @return {StatementPayload}
   */
  setObject(object) {
    this.payload.object = object;
    return this;
  }

  /**
   * @return {string} object
   */
  getObject() {
    return this.payload.object;
  }

  /**
   * @param {(string|string[])} [context]
   * @return {StatementPayload}
   */
  setContext(context) {
    this.payload.context = context;
    return this;
  }

  /**
   * @return {string} context
   */
  getContext() {
    return this.payload.context;
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
