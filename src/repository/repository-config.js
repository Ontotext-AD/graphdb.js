/**
 * Helper class to use when new repository is programmatically created.
 *
 *  @class
 *  @author Teodossi Dossev
 */
class RepositoryConfig {
  /**
   * @param {Object} options Configuration options
   * @param {string} [options.id] Repository ID
   * @param {string} [options.location] Repository location
   * @param {Object} [options.params]
   * Map of repository configuration parameters.
   * See {@link https://graphdb.ontotext.com/documentation/standard/configuring-a-repository.html#configuring-a-repository-configuration-parameters
   * GraphDB Documentation}.
   * Since GraphDB 11.4, <code>storageEncryption</code> set to
   * <code>"true"</code> encrypts the repository at rest. It needs a master key
   * configured on the GraphDB instance and cannot be changed after creation,
   * see {@link https://graphdb.ontotext.com/documentation/11.5/encryption.html#encryption-at-rest
   * Encryption at rest}.
   * @param {string} [options.sesameType] Repository type as sesame rdf type.
   * Supported values (GraphDB 12.0):
   * <code>graphdb:SailRepository</code> for standard repository
   * <code>graphdb:OntopRepository</code> for ontop repository
   * <code>graphdb:FedXRepository</code> for FedX repository
   * @param {string} [options.title] Repository title
   * @param {string} [options.type] Repository type as {@link RepositoryType}
    */
  constructor(options = {}) {
    this.id = options.id;
    this.location = options.location;
    this.params = options.params || {};
    this.sesameType = options.sesameType;
    this.title = options.title;
    this.type = options.type;
  }

  /**
   * Repository configuration to json getter
   * @return {Object} Repository configuration as key value pairs object
   */
  toJson() {
    return {
      id: this.id,
      location: this.location,
      params: this.params,
      sesameType: this.sesameType,
      title: this.title,
      type: this.type
    };
  }
}

module.exports = RepositoryConfig;
