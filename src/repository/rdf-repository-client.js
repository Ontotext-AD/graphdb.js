const BaseRepositoryClient = require('../repository/base-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const DataFactory = require('n3').DataFactory;
const NamedNode = DataFactory.internal.NamedNode;
const Namespace = require('model/namespace');
const StringUtils = require('util/string-utils');
const TermConverter = require('model/term-converter');
const RepositoryClientConfig = require('repository/repository-client-config');
const TransactionalRepositoryClient =
  require('transaction/transactional-repository-client');
const HttpRequestConfigBuilder = require('http/http-request-config-builder');

/**
 * Defines the path segment for namespaces rest endpoint
 *
 * @type {string}
 */
const PATH_NAMESPACES = '/namespaces';

/**
 * Defines a path segment for statements rest endpoint
 *
 * @type {string}
 */
const PATH_STATEMENTS = '/statements';

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
   * Retrieves the size of the repository.
   *
   * Effectively returns how much statements are in the repository.
   *
   * If one or multiple context are provided, the operation will be restricted
   * upon each of them.
   *
   * @param {string|string[]} [context] context or contexts to restrict the
   *                            size calculation
   * @return {Promise<number>} a promise resolving to the total number of
   *                           statements in the repository
   */
  getSize(context) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({context})
      .get();

    return this.execute((http) => http.get('/size', requestConfig))
      .then((response) => response.data);
  }

  /**
   * Retrieves all present namespaces as a collection of {@link Namespace}.
   *
   * @return {Promise<Namespace[]>} promise resolving to a collection of
   *                                {@link Namespace}
   */
  getNamespaces() {
    const requestConfig = new HttpRequestConfigBuilder()
      .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON)
      .get();

    return this.execute((http) => http.get(PATH_NAMESPACES, requestConfig))
      .then((response) => this.mapNamespaceResponse(response.data));
  }

  /**
   * Maps the response data from the namespaces request into {@link Namespace}.
   *
   * @private
   * @param {object} responseData the data to map
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
   * @return {Promise<NamedNode>} promise resolving to {@link NamedNode}
   */
  getNamespace(prefix) {
    if (StringUtils.isBlank(prefix)) {
      throw new Error('Parameter prefix is required!');
    }

    return this.execute((http) => http.get(`${PATH_NAMESPACES}/${prefix}`))
      .then((response) => DataFactory.namedNode(response.data));
  }

  /**
   * Creates or updates the namespace for the given prefix.
   *
   * If the provided prefix or namespace parameter is not a string or
   * {@link NamedNode} then the method will throw an error.
   *
   * @param {string} prefix prefix of the namespace to be created/updated
   * @param {string|NamedNode} namespace the namespace to be created/updated
   * @return {Promise} promise that will be resolved if the create/update
   *                   request is successful
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

    return this.execute((http) => http.put(`${PATH_NAMESPACES}/${prefix}`,
      payload));
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
      throw new Error('Parameter prefix is required!');
    }

    return this.execute((http) =>
      http.deleteResource(`${PATH_NAMESPACES}/${prefix}`));
  }

  /**
   * Deletes all namespace declarations in the repository.
   *
   * @return {Promise} promise that will be resolved after successful deletion
   */
  deleteNamespaces() {
    return this.execute((http) => http.deleteResource(PATH_NAMESPACES));
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * @param {Object} params is an object holding request parameters as returned
   *                 by {@link GetStatementsPayload#get()}
   * @return {Promise<string|Quad>} resolves with plain string or Quad according
   *      to provided response type.
   */
  get(params) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        subj: params.subject,
        pred: params.predicate,
        obj: params.object,
        context: params.context,
        infer: params.inference
      })
      .addAcceptHeader(params.responseType)
      .get();

    return this.execute((http) => http.get(PATH_STATEMENTS, requestConfig))
      .then((response) => this.parse(response.data, params.responseType));
  }

  /**
   * Executes request to query a repository.
   *
   * Only POST request with a valid QueryPayload is supported.
   *
   * @param {QueryPayload} payload is an object holding request parameters
   * required by the query POST endpoint.
   * @return {Promise} the client can subscribe to the stream events and consume
   * the emitted strings or Quads depending on the provided response type as
   * soon as they are available.
   */
  query(payload) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setResponseType('stream')
      .addAcceptHeader(payload.getResponseType())
      .addContentTypeHeader(payload.getContentType())
      .get();

    return this.execute((http) => http.post('', payload.getParams(),
      requestConfig)).then((response) => response.data);
  }

  /**
   * Saves the provided statement payload in the repository.
   *
   * The payload will be converted to a quad or a collection of quads in case
   * there are multiple contexts.
   *
   * After the conversion, the produced quad(s) will be serialized to Turtle
   * format and send to the repository as payload.
   *
   * See {@link #addQuads()}.
   *
   * @param {Object} payload params holding request parameters as returned
   *                 by {@link AddStatementPayload#get()}
   * @return {Promise} promise that will be resolved if the addition is
   *                    successful or rejected in case of failure
   */
  add(payload) {
    if (!payload) {
      throw new Error('Cannot add statement without payload');
    }

    const subject = payload.subject;
    const predicate = payload.predicate;
    const object = payload.object;
    const context = payload.context;

    if (RDFRepositoryClient.hasNullArguments(subject, predicate, object)) {
      throw new Error('Cannot add statement with null ' +
        'subject, predicate or object');
    }

    let quads;
    if (payload.language) {
      quads = TermConverter.getQuadsWithLanguage(subject, predicate, object,
        payload.language, context);
    } else if (payload.dataType) {
      quads = TermConverter.getQuadsWithDataType(subject, predicate, object,
        payload.dataType, context);
    } else {
      quads = TermConverter.getQuads(subject, predicate, object, context);
    }

    return this.addQuads(quads);
  }

  /**
   * Serializes the provided quads to Turtle format and sends them to the
   * repository as payload.
   *
   * @param {Quad[]} quads collection of quads to be sent as Turtle text
   * @return {Promise} promise that will be resolved if the addition is
   *                    successful or rejected in case of failure
   */
  addQuads(quads) {
    return TermConverter.toTurtle(quads).then((data) => this.addTurtle(data));
  }

  /**
   * Inserts the statements in the provided Turtle formatted data.
   *
   * @private
   * @param {string} data payload data in Turtle format
   * @return {Promise} promise resolving after the data has been inserted
   * successfully
   */
  addTurtle(data) {
    if (StringUtils.isBlank(data)) {
      throw new Error('Turtle data is required when adding statements');
    }

    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(RDFMimeType.TURTLE)
      .get();

    return this.execute((http) => http.post(PATH_STATEMENTS, data,
      requestConfig));
  }

  /**
   * Deletes statements in the repository based on the provided subject,
   * predicate, object and or contexts. Each of them is optional and acts as
   * statements filter which effectively narrows the scope of the deletion.
   *
   * Providing context or contexts will restricts the operation to one or more
   * specific contexts in the repository.
   *
   * @param {String} [subject] N-Triples encoded resource subject
   * @param {String} [predicate] N-Triples encoded resource predicate
   * @param {String} [object] N-Triples encoded resource object
   * @param {String[]|String} [contexts] N-Triples encoded resource or resources
   * @return {Promise} promise that will be resolved if the deletion is
   *                         successful or rejected in case of failure
   */
  deleteStatements(subject, predicate, object, contexts) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        subj: subject,
        pred: predicate,
        obj: object,
        context: contexts
      })
      .get();

    return this.execute((http) => http.deleteResource(PATH_STATEMENTS,
      requestConfig));
  }

  /**
   * Deletes all statements in the repository.
   *
   * @return {Promise} promise that will be resolved if the deletion is
   *                   successful or rejected in case of failure
   */
  deleteAllStatements() {
    return this.execute((http) => http.deleteResource(PATH_STATEMENTS));
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * The request is configured so that expected response should be a readable
   * stream.
   *
   * @param {Object} params is an object holding request parameters as returned
   *                 by {@link GetStatementsPayload#get()}
   * @return {Promise<WritableStream>} the client can subscribe to the readable
   * stream events and consume the emitted strings depending on the provided
   * response type as soon as they are available.
   */
  download(params) {
    const requestConfig = new HttpRequestConfigBuilder()
      .addAcceptHeader(params.responseType)
      .setResponseType('stream')
      .setParams({
        subj: params.subject,
        pred: params.predicate,
        obj: params.object,
        context: params.context,
        infer: params.inference
      })
      .get();

    return this.execute((http) => {
      return http.get('/statements', requestConfig);
    }).then((response) => {
      return response.data;
    });
  }

  /**
   * Executes a POST request against the <code>/statements</code> endpoint. The
   * statements which have to be added are provided through a readable stream.
   * This method is useful for library client who wants to upload a big data set
   * into the repository.
   *
   * @param {ReadableStream} readStream
   * @param {NamedNode|string} [context] optional context to restrict the
   * operation.
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   * @param {string} contentType is one of RDF mime type formats,
   *                application/x-rdftransaction' for a transaction document or
   *                application/x-www-form-urlencoded
   * @return {Promise<void>}
   */
  upload(readStream, context, baseURI, contentType) {
    const url = this.resolveUrl(context, baseURI);
    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .get();

    return this.execute((http) => http.post(url, readStream, requestConfig));
  }

  /**
   * Executes a PUT request against the <code>/statements</code> endpoint. The
   * statements which have to be updated are provided through a readable stream.
   * This method is useful for overriding large set of statements that might be
   * provided as a readable stream e.g. reading from file.
   *
   * @param {ReadableStream} readStream
   * @param {NamedNode|string} context
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   * @param {string} contentType
   * @return {Promise<void>}
   */
  overwrite(readStream, context, baseURI, contentType) {
    const url = this.resolveUrl(context, baseURI);
    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .get();

    return this.execute((http) => http.put(url, readStream, requestConfig));
  }

  /**
   * Build an url for update operation encoding the context and baseURI if
   * provided.
   *
   * @private
   * @param {NamedNode|string} [context]
   * @param {string} [baseURI]
   * @return {string}
   */
  resolveUrl(context, baseURI) {
    let url = '/statements';
    const hasParams = context || baseURI;
    if (hasParams) {
      url += '?';
    }
    const params = [
      context ? `context=${encodeURIComponent(context)}` : undefined,
      baseURI ? `baseURI=${encodeURIComponent(baseURI)}` : undefined
    ].filter((v) => v);
    return url + params.join('&');
  }

  /**
   * Starts a transaction and produces a {@link TransactionalRepositoryClient}.
   *
   * The transactions ID is extracted from the <code>location</code> header and
   * is used as  endpoint for the produced TransactionalRepositoryClient.
   *
   * If no transaction isolation level is provided, the server will use its
   * default isolation level.
   *
   * @param {string} [isolationLevel] an optional parameter to specify the
   * transaction's level of isolation; for possible values  see
   * {@link TransactionIsolationLevel}
   * @return {Promise<TransactionalRepositoryClient>} transactional client
   */
  beginTransaction(isolationLevel) {
    return this.execute((http) => http.post('/transactions', {
      params: {
        'isolation-level': isolationLevel
      }
    })).then((response) => {
      const locationUrl = response.headers['location'];
      if (StringUtils.isBlank(locationUrl)) {
        return Promise.reject(new Error('Couldn\'t obtain transaction ID'));
      }
      const config = this.getTransactionalClientConfig(locationUrl);
      return new TransactionalRepositoryClient(config);
    });
  }

  /**
   * Builds client configuration for transactional repository out of this
   * client's own config and the supplied location URL.
   *
   * @param {string} locationUrl the url for the transactional repo endpoint
   * @return {RepositoryClientConfig} the built client config
   */
  getTransactionalClientConfig(locationUrl) {
    const config = this.repositoryClientConfig;
    return new RepositoryClientConfig([locationUrl], config.headers,
      config.defaultRDFMimeType, config.readTimeout, config.writeTimeout);
  }

  /**
   * Checks if at least one of the supplied arguments is undefined or null.
   *
   * @private
   * @return {boolean} <code>true</code> if there is null argument or
   *         <code>false</code> otherwise
   */
  static hasNullArguments(...args) {
    return [...args].some((arg) => !arg);
  }
}

module.exports = RDFRepositoryClient;
