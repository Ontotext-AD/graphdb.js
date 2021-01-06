/**
 * Helper class to use when new repository is programmatically created.
 *
 *  @class
 *  @author Teodossi Dossev
 */
export class RepositoryConfig {
  /**
   * @param {string} [id] Repository ID
   * @param {string} [location] Repository location
   * @param {Object} [params] Map of repository configuration parameters.
   * See {@link https://graphdb.ontotext.com/documentation/standard/configuring-a-repository.html#configuring-a-repository-configuration-parameters
   * GraphDB Documentation}
   * @param {string} [sesameType] Repository type as sesame rdf type.
   * May be one of the following:
   * <code>owlim:ReplicationCluster</code> for master repository
   * <code>owlim:ReplicationClusterWorker</code> for worker repository
   * <code>owlim:MonitorRepository</code> for se repository
   * <code>openrdf:SailRepository</code> for se repository
   * <code>graphdb:FreeSailRepository</code> for free repository
   * <code>openrdf:SystemRepository</code> for openrdf-system repository
   * <code>graphdb:OntopRepository</code> for ontop repository
   * @param {string} [title] Repository title
   * @param {string} [type] Repository type as {@link RepositoryType}
    */
  constructor(id, location, params, sesameType, title, type) {
    this.id = id;
    this.location = location;
    this.params = params;
    this.sesameType = sesameType;
    this.title = title;
    this.type = type;
  }

  /**
   * @override
   * @return {Object} Repository configuration as key value pairs object
   */
  toString() {
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
