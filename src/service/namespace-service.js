const Service = require('./service');
const HttpRequestBuilder = require('../http/http-request-builder');
const ServiceRequest = require('./service-request');
const PATH_NAMESPACES = require('./service-paths').PATH_NAMESPACES;

const RDFMimeType = require('../http/rdf-mime-type');
const Namespace = require('../model/namespace');

const LoggingUtils = require('../logging/logging-utils');
const StringUtils = require('../util/string-utils');

const DataFactory = require('service/data-factory');
const NamedNode = DataFactory.internal.NamedNode;

/**
 * Service for namespace management.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class NamespaceService extends Service {
  /**
   * Retrieves all present namespaces as a collection of {@link Namespace}.
   *
   * @return {ServiceRequest} a service request resolving to a collection of
   * {@link Namespace}
   */
  getNamespaces() {
    const requestBuilder = HttpRequestBuilder.httpGet(PATH_NAMESPACES)
      .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response),
          'Fetched namespaces');
        return this.mapNamespaceResponse(response.getData());
      });
    });
  }

  /**
   * Maps the response data from the namespaces request into {@link Namespace}.
   *
   * @private
   *
   * @param {object} responseData the data to map
   *
   * @return {Namespace[]} the mapped namespaces
   */
  mapNamespaceResponse(responseData) {
    return responseData.results.bindings.map((binding) => {
      const prefix = binding.prefix.value;
      const namespace = DataFactory.namedNode(binding.namespace.value);
      return new Namespace(prefix, namespace);
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
   *
   * @return {ServiceRequest} service request resolving to {@link NamedNode}
   *
   * @throws {Error} if the prefix parameter is not supplied
   */
  getNamespace(prefix) {
    if (StringUtils.isBlank(prefix)) {
      throw new Error('Parameter prefix is required!');
    }

    const namespaceUrl = `${PATH_NAMESPACES}/${prefix}`;
    const requestBuilder = HttpRequestBuilder.httpGet(namespaceUrl);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {prefix}),
          'Fetched namespace');

        return DataFactory.namedNode(response.getData());
      });
    });
  }

  /**
   * Creates or updates the namespace for the given prefix.
   *
   * If the provided prefix or namespace parameter is not a string or
   * {@link NamedNode} then the method will throw an error.
   *
   * @param {string} prefix prefix of the namespace to be created/updated
   * @param {string|NamedNode} namespace the namespace to be created/updated
   *
   * @return {ServiceRequest} service request that will be resolved if the
   * create/update request is successful
   *
   * @throws {Error} if the prefix or namespace parameter are not provided
   */
  saveNamespace(prefix, namespace) {
    if (StringUtils.isBlank(prefix)) {
      throw new Error('Parameter prefix is required!');
    }

    let payload = namespace;
    if (namespace instanceof NamedNode) {
      payload = namespace.value;
    } else if (StringUtils.isBlank(namespace)) {
      throw new Error('Parameter namespace is required!');
    }

    const requestBuilder = HttpRequestBuilder
      .httpPut(`${PATH_NAMESPACES}/${prefix}`)
      .setData(payload);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response,
          {prefix, namespace}), 'Saved namespace');
      });
    });
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
   *
   * @return {Promise<void>} promise that will be resolved if the deletion is
   * successful
   *
   * @throws {Error} if the prefix parameter is not provided
   */
  deleteNamespace(prefix) {
    if (StringUtils.isBlank(prefix)) {
      throw new Error('Parameter prefix is required!');
    }

    const requestBuilder = HttpRequestBuilder
      .httpDelete(`${PATH_NAMESPACES}/${prefix}`);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {prefix}),
          'Deleted namespace');
      });
    });
  }

  /**
   * Deletes all namespace declarations in the repository.
   *
   * @return {Promise<void>} promise that will be resolved after
   * successful deletion
   */
  deleteNamespaces() {
    const requestBuilder = HttpRequestBuilder.httpDelete(PATH_NAMESPACES);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response),
          'Deleted all namespaces');
      });
    });
  }

  /**
   * @inheritDoc
   */
  getServiceName() {
    return 'NamespaceService';
  }
}

module.exports = NamespaceService;
