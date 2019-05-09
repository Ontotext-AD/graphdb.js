const BaseRepositoryClient = require('../repository/base-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const DataFactory = require('n3').DataFactory;
const NamedNode = DataFactory.internal.NamedNode;
const Namespace = require('model/namespace');
const StringUtils = require('util/string-utils');

/**
 * RDF repository client implementation realizing specific operations.
 * @class
 */
class RDFRepositoryClient extends BaseRepositoryClient {
  /**
   * @inheritdoc
   */
  constructor(repositoryClientConfig) {
    super(repositoryClientConfig);
  }

  /**
   * Retrieves all present namespaces as a collection of {@link NamedNode}.
   *
   * @return {Promise<NamedNode[]>} promise resolving to a collection of
   *                                {@link NamedNode} representing namespaces
   */
  getNamespaces() {
    return this.execute((http) => http.get('/namespaces',
        http.getConfigBuilder()
            .setTimeout(this.repositoryClientConfig.readTimeout)
            .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON)
            .get()
    )).then((response) => {
      return response.data.results.bindings.map((binding) => {
        const prefix = binding.prefix.value;
        const namespace = DataFactory.namedNode(binding.namespace.value);
        return new Namespace(prefix, namespace);
      });
    });
  }

  /**
   * Retrieves the namespace for the given prefix as {@link NamedNode}.
   *
   * For example if <code>rdfs</code> is provided as prefix that would result in
   * a {@link NamedNode} corresponding to following namespace:
   * <code>http://www.w3.org/2000/01/rdf-schema#</code>
   *
   * Note: This method should be invoked only with prefixes. Anything else would
   * result in an error from the server.
   *
   * @param {string} prefix prefix of the namespace to be retrieved
   * @return {Promise<NamedNode>} promise resolving to {@link NamedNode}
   */
  getNamespace(prefix) {
    if (StringUtils.isBlank(prefix)) {
      return Promise.reject(new Error('Parameter prefix is required!'));
    }

    return this.execute((http) => http.get(`/namespaces/${prefix}`,
        http.getConfigBuilder()
            .setTimeout(this.repositoryClientConfig.readTimeout)
            .get()
    )).then((response) => {
      return DataFactory.namedNode(response.data);
    });
  }

  /**
   * Creates or updates the namespace for the given prefix.
   *
   * If the provided prefix or namespace parameter is not a string or
   * {@link NamedNode} then the method will reject with an error.
   *
   * @param {string} prefix prefix of the namespace to be created/updated
   * @param {string|NamedNode} namespace the namespace to be created/updated
   * @return {Promise} promise that will be resolved if the create/update
   *                   request is successful
   */
  saveNamespace(prefix, namespace) {
    if (StringUtils.isBlank(prefix)) {
      return Promise.reject(new Error('Parameter prefix is required!'));
    }

    let payload = namespace;
    if (namespace instanceof NamedNode) {
      payload = namespace.value;
    } else if (StringUtils.isBlank(namespace)) {
      return Promise.reject(new Error('Parameter namespace is required!'));
    }

    return this.execute((http) => http.put(`/namespaces/${prefix}`, payload,
        http.getConfigBuilder()
            .setTimeout(this.repositoryClientConfig.writeTimeout)
            .get()
    ));
  }

  /**
   * Deletes a namespace that corresponds to the given prefix.
   *
   * For example if <code>rdfs</code> is provided as prefix that would delete
   * the following namespace: <code>http://www.w3.org/2000/01/rdf-schema#</code>
   *
   * Note: This method should be invoked only with prefixes. Anything else would
   * result in an error from the server.
   *
   * @param {string} prefix prefix of the namespace to be deleted
   * @return {Promise} promise that will be resolved if the deletion is
   *                   successful
   */
  deleteNamespace(prefix) {
    if (StringUtils.isBlank(prefix)) {
      return Promise.reject(new Error('Parameter prefix is required!'));
    }

    return this.execute((http) => http.deleteResource(`/namespaces/${prefix}`,
        http.getConfigBuilder()
            .setTimeout(this.repositoryClientConfig.writeTimeout)
            .get()
    ));
  }

  /**
   * Deletes all namespace declarations in the repository.
   *
   * @return {Promise} promise that will be resolved after successful deletion
   */
  deleteNamespaces() {
    return this.execute((http) => http.deleteResource('/namespaces',
        http.getConfigBuilder()
            .setTimeout(this.repositoryClientConfig.writeTimeout)
            .get()
    ));
  }
}

module.exports = RDFRepositoryClient;
