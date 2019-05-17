const BaseRepositoryClient = require('../repository/base-repository-client');
const RDFMimeType = require('../http/rdf-mime-type');
const Namespace = require('../model/namespace');
const StringUtils = require('../util/string-utils');
const FileUtils = require('../util/file-utils');
const TermConverter = require('../model/term-converter');
const RepositoryClientConfig =
  require('../repository/repository-client-config');
const TransactionalRepositoryClient =
  require('../transaction/transactional-repository-client');
const HttpRequestConfigBuilder = require('../http/http-request-config-builder');
const DataFactory = require('n3').DataFactory;
const NamedNode = DataFactory.internal.NamedNode;

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
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
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
   * size calculation. Will be encoded as N-Triple if it is not already one
   * @return {Promise<number>} a promise resolving to the total number of
   *                           statements in the repository
   */
  getSize(context) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        context: TermConverter.toNTripleValues(context)
      })
      .get();

    return this.execute((http) => http.get('/size', requestConfig));
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
      .then((data) => this.mapNamespaceResponse(data));
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
      .then((data) => DataFactory.namedNode(data));
  }

  /**
   * Creates or updates the namespace for the given prefix.
   *
   * If the provided prefix or namespace parameter is not a string or
   * {@link NamedNode} then the method will throw an error.
   *
   * @param {string} prefix prefix of the namespace to be created/updated
   * @param {string|NamedNode} namespace the namespace to be created/updated
   * @return {Promise<void>} promise that will be resolved if the create/update
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
   * @return {Promise<void>} promise that will be resolved if the deletion is
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
   * @return {Promise<void>} promise that will be resolved after
   * successful deletion
   */
  deleteNamespaces() {
    return this.execute((http) => http.deleteResource(PATH_NAMESPACES));
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * Provided values will be automatically converted to N-Triples if they are
   * not already encoded as such.
   *
   * @param {GetStatementsPayload} payload is an object holding the request
   * parameters.
   * @return {Promise<string|Quad>} resolves with plain string or Quad according
   *      to provided response type.
   */
  get(payload) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        subj: TermConverter.toNTripleValue(payload.getSubject()),
        pred: TermConverter.toNTripleValue(payload.getPredicate()),
        obj: TermConverter.toNTripleValue(payload.getObject()),
        context: TermConverter.toNTripleValues(payload.getContext()),
        infer: payload.getInference()
      })
      .addAcceptHeader(payload.getResponseType())
      .get();

    return this.execute((http) => http.get(PATH_STATEMENTS, requestConfig))
      .then((data) => this.parse(data, payload.getResponseType()));
  }

  /**
   * Executes request to query a repository.
   *
   * Only POST request with a valid QueryPayload is supported.
   *
   * @param {GetQueryPayload} payload is an object holding request parameters
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
      requestConfig));
  }

  /**
   * Executes a request with a sparql query against <code>/statements</code>
   * endpoint to update repository data.
   *
   * If <code>contentType</code> is set to
   * <code>application/x-www-form-urlencoded</code> then query and request
   * parameters from the payload are encoded as query string and sent as request
   * body.
   *
   * If <code>contentType</code> is set to
   * <code>application/sparql-update</code> then the query is sent unencoded as
   * request body.
   *
   * @param {UpdateQueryPayload} payload
   * @return {Promise<void>} promise that will be resolved if the update is
   * successful or rejected in case of failure
   */
  update(payload) {
    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(payload.getContentType())
      .get();

    return this.execute((http) => http.post(PATH_STATEMENTS,
      payload.getParams(), requestConfig));
  }

  /**
   * Saves the provided statement payload in the repository.
   *
   * The payload will be converted to a quad or a collection of quads in case
   * there are multiple contexts.
   *
   * After the conversion, the produced quad(s) will be serialized to Turtle or
   * Trig format and send to the repository as payload.
   *
   * See {@link #addQuads()}.
   *
   * @param {Object} payload params holding request parameters as returned
   *                 by {@link AddStatementPayload#get()}
   * @return {Promise<void>} promise that will be resolved if the addition is
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

    // No context because it's in the payload and it is for single triple.
    return this.addQuads(quads, undefined, payload.baseURI);
  }

  /**
   * Serializes the provided quads to Turtle format and sends them to the
   * repository as payload.
   *
   * If any of the quads have a graph, then the text will be serialized to the
   * Trig format which is an extended version of Turtle supporting contexts.
   *
   * @param {Quad[]} quads collection of quads to be sent as Turtle/Trig text
   * @param {string|string[]} [context] restricts the insertion to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @return {Promise<void>} promise that will be resolved if the addition is
   * successful or rejected in case of failure
   */
  addQuads(quads, context, baseURI) {
    return TermConverter.toString(quads).then((data) => this.sendData(data,
      context, baseURI, false));
  }

  /**
   * Overwrites the repository's data by serializing the provided quads to
   * Turtle format and sending them to the repository as payload.
   *
   * If any of the quads have a graph, then the text will be serialized to the
   * Trig format which is an extended version of Turtle supporting contexts.
   *
   * The overwrite will be restricted if the context parameter is specified.
   *
   * @param {Quad[]} quads collection of quads to be sent as Turtle/Trig text
   * @param {string|string[]} [context] restricts the insertion to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @return {Promise<void>} promise that will be resolved if the overwrite is
   * successful or rejected in case of failure
   */
  putQuads(quads, context, baseURI) {
    return TermConverter.toString(quads).then((data) => this.sendData(data,
      context, baseURI, true));
  }

  /**
   * Inserts the statements in the provided Turtle or Trig formatted data.
   *
   * @private
   * @param {string} data payload data in Turtle or Trig format
   * @param {string|string[]} [context] restricts the insertion to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @param {boolean} overwrite defines if the data should overwrite the repo
   * data or not
   * @return {Promise<void>} promise resolving after the data has been inserted
   * successfully
   */
  sendData(data, context, baseURI, overwrite) {
    if (StringUtils.isBlank(data)) {
      throw new Error('Turtle/trig data is required when adding statements');
    }

    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(RDFMimeType.TRIG)
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      })
      .get();

    if (overwrite) {
      return this.execute((http) => http.put(PATH_STATEMENTS, data,
        requestConfig));
    }

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
   * Provided values will be automatically converted to N-Triples if they are
   * not already encoded as such.
   *
   * @param {String} [subject] resource subject
   * @param {String} [predicate] resource predicate
   * @param {String} [object] resource object
   * @param {String[]|String} [contexts] resource or resources context
   * @return {Promise<void>} promise that will be resolved if the deletion is
   *                         successful or rejected in case of failure
   */
  deleteStatements(subject, predicate, object, contexts) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        subj: TermConverter.toNTripleValue(subject),
        pred: TermConverter.toNTripleValue(predicate),
        obj: TermConverter.toNTripleValue(object),
        context: TermConverter.toNTripleValues(contexts)
      })
      .get();

    return this.execute((http) => http.deleteResource(PATH_STATEMENTS,
      requestConfig));
  }

  /**
   * Deletes all statements in the repository.
   *
   * @return {Promise<void>} promise that will be resolved if the deletion is
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
   * Provided request params will be automatically converted to N-Triples if
   * they are not already encoded as such.
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
        subj: TermConverter.toNTripleValue(params.subject),
        pred: TermConverter.toNTripleValue(params.predicate),
        obj: TermConverter.toNTripleValue(params.object),
        context: TermConverter.toNTripleValues(params.context),
        infer: params.inference
      })
      .get();

    return this.execute((http) => http.get('/statements', requestConfig));
  }

  /**
   * Executes a POST request against the <code>/statements</code> endpoint. The
   * statements which have to be added are provided through a readable stream.
   * This method is useful for library client who wants to upload a big data set
   * into the repository.
   *
   * @param {ReadableStream} readStream
   * @param {NamedNode|string} [context] optional context to restrict the
   * operation. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   * @param {string} contentType is one of RDF mime type formats,
   *                application/x-rdftransaction' for a transaction document or
   *                application/x-www-form-urlencoded
   * @return {Promise<void>} a promise that will be resolved when the stream has
   * been successfully consumed by the server
   */
  upload(readStream, context, baseURI, contentType) {
    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      })
      .get();

    return this.execute((http) => http.post(PATH_STATEMENTS, readStream,
      requestConfig));
  }

  /**
   * Executes a PUT request against the <code>/statements</code> endpoint. The
   * statements which have to be updated are provided through a readable stream.
   * This method is useful for overriding large set of statements that might be
   * provided as a readable stream e.g. reading from file.
   *
   * @param {ReadableStream} readStream
   * @param {NamedNode|string} context restrict the operation. Will be encoded
   * as N-Triple if it is not already one
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   * @param {string} contentType
   * @return {Promise<void>} a promise that will be resolved when the stream has
   * been successfully consumed by the server
   */
  overwrite(readStream, context, baseURI, contentType) {
    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      })
      .get();

    return this.execute((http) => http.put(PATH_STATEMENTS, readStream,
      requestConfig));
  }

  /**
   * Uploads the file specified by the provided file path to the server.
   *
   * See {@link #upload}
   *
   * @param {string} filePath path to a file to be streamed to the server
   * @param {string|string[]} [context] restricts the operation to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @param {string} contentType MIME type of the file's content
   * @return {Promise<void>} a promise that will be resolved when the file has
   * been successfully consumed by the server
   */
  addFile(filePath, context, baseURI, contentType) {
    return this.upload(FileUtils.getReadStream(filePath), context, baseURI,
      contentType);
  }

  /**
   * Uploads the file specified by the provided file path to the server
   * overwriting any data in the server's repository.
   *
   * The overwrite will be restricted if the context parameter is specified.
   *
   * See {@link #overwrite}
   *
   * @param {string} filePath path to a file to be streamed to the server
   * @param {string} [context] restricts the operation to the given context.
   * Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @param {string} contentType MIME type of the file's content
   * @return {Promise<void>} a promise that will be resolved when the file has
   * been successfully consumed by the server
   */
  putFile(filePath, context, baseURI, contentType) {
    return this.overwrite(FileUtils.getReadStream(filePath), context, baseURI,
      contentType);
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
    const responseMapper = (response) => response;
    return this.execute((http) => http.post('/transactions', {
      params: {
        'isolation-level': isolationLevel
      }
    }), responseMapper).then((response) => {
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
