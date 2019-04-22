/**
 * Class for containing a namespace and it's associated prefix.
 *
 * @author Mihail Radkov
 */
class Namespace {
  /**
   * Instantiates a namespace with its prefix.
   *
   * @param {string} prefix the namespace prefix
   * @param {NamedNode} namespace the namespace as named node
   */
  constructor(prefix, namespace) {
    this.prefix = prefix;
    this.namespace = namespace;
  }

  /**
   * Returns the namespace prefix.
   *
   * @return {string} the namespace prefix
   */
  getPrefix() {
    return this.prefix;
  }

  /**
   * Returns the namespace.
   *
   * @return {NamedNode} the namespace as named node
   */
  getNamespace() {
    return this.namespace;
  }
}

module.exports = Namespace;
