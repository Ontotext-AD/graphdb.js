const BaseRepositoryClient = require('../repository/base-repository-client');
const ConsoleLogger = require('../logging/console-logger');
const RDFMimeType = require('../http/rdf-mime-type');
const Namespace = require('../model/namespace');
const StringUtils = require('../util/string-utils');
const FileUtils = require('../util/file-utils');
const CommonUtils = require('../util/common-utils');
const TermConverter = require('../model/term-converter');
const RepositoryClientConfig =
  require('../repository/repository-client-config');
const TransactionalRepositoryClient =
  require('../transaction/transactional-repository-client');
const HttpRequestBuilder = require('../http/http-request-builder');
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
   * @param {RepositoryClientConfig} repositoryClientConfig
   */
  constructor(repositoryClientConfig) {
    super(repositoryClientConfig);
  }

  /**
   * @inheritDoc
   */
  getLogger() {
    return new ConsoleLogger({
      name: 'RDFRepositoryClient'
    });
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
    const requestBuilder = HttpRequestBuilder.httpGet('/size')
      .addParam('context', TermConverter.toNTripleValues(context));

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {context}),
        'Fetched size');
      return response.getData();
    });
  }

  /**
   * Retrieves all present namespaces as a collection of {@link Namespace}.
   *
   * @return {Promise<Namespace[]>} promise resolving to a collection of
   *                                {@link Namespace}
   */
  getNamespaces() {
    const requestBuilder = HttpRequestBuilder.httpGet(PATH_NAMESPACES)
      .addAcceptHeader(RDFMimeType.SPARQL_RESULTS_JSON);

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response), 'Fetched namespaces');
      return this.mapNamespaceResponse(response.getData());
    });
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
   * @throws {Error} if the prefix parameter is not supplied
   */
  getNamespace(prefix) {
    if (StringUtils.isBlank(prefix)) {
      throw new Error('Parameter prefix is required!');
    }

    const namespaceUrl = `${PATH_NAMESPACES}/${prefix}`;
    const requestBuilder = HttpRequestBuilder.httpGet(namespaceUrl);

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {prefix}),
        'Fetched namespace');
      return DataFactory.namedNode(response.getData());
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
   * @return {Promise<void>} promise that will be resolved if the create/update
   * request is successful
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

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {prefix, namespace}),
        'Saved namespace');
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
   * @return {Promise<void>} promise that will be resolved if the deletion is
   * successful
   * @throws {Error} if the prefix parameter is not provided
   */
  deleteNamespace(prefix) {
    if (StringUtils.isBlank(prefix)) {
      throw new Error('Parameter prefix is required!');
    }

    const requestBuilder = HttpRequestBuilder
      .httpDelete(`${PATH_NAMESPACES}/${prefix}`);

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {prefix}),
        'Deleted namespace');
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

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response),
        'Deleted all namespaces');
    });
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
    const requestBuilder = HttpRequestBuilder.httpGet(PATH_STATEMENTS)
      .setParams({
        subj: TermConverter.toNTripleValue(payload.getSubject()),
        pred: TermConverter.toNTripleValue(payload.getPredicate()),
        obj: TermConverter.toNTripleValue(payload.getObject()),
        context: TermConverter.toNTripleValues(payload.getContext()),
        infer: payload.getInference()
      })
      .addAcceptHeader(payload.getResponseType());

    const parser = this.getParser(payload.getResponseType());
    if (parser && parser.isStreaming()) {
      requestBuilder.setResponseType('stream');
    }

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {
        subject: payload.getSubject(),
        predicate: payload.getPredicate(),
        object: payload.getObject(),
        context: payload.getContext()
      }), 'Fetched data');
      return this.parse(response.getData(), payload.getResponseType());
    });
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
   * @throw {Error} if the payload is misconfigured
   */
  query(payload) {
    const requestBuilder = HttpRequestBuilder.httpPost('')
      .setData(payload.getParams())
      .setResponseType('stream')
      .addAcceptHeader(payload.getResponseType())
      .addContentTypeHeader(payload.getContentType());

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {
        query: payload.getQuery(),
        queryType: payload.getQueryType()
      }), 'Queried data');
      return this.parse(response.getData(), payload.getResponseType(), {
        queryType: payload.getQueryType()
      });
    });
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
   * @throw {Error} if the payload is misconfigured
   */
  update(payload) {
    const requestBuilder = HttpRequestBuilder.httpPost(PATH_STATEMENTS)
      .setData(payload.getParams())
      .addContentTypeHeader(payload.getContentType());

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response,
        {query: payload.getQuery()}), 'Performed update');
    });
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
   * @param {AddStatementPayload} payload holding request parameters
   * @return {Promise<void>} promise that will be resolved if the addition is
   * successful or rejected in case of failure
   * @throws {Error} if the payload is not provided or the payload has null
   * subject, predicate and/or object
   */
  add(payload) {
    if (!payload) {
      throw new Error('Cannot add statement without payload');
    }

    const subject = payload.getSubject();
    const predicate = payload.getPredicate();
    const object = payload.getObject();
    const context = payload.getContext();

    if (CommonUtils.hasNullArguments(subject, predicate, object)) {
      throw new Error('Cannot add statement with null ' +
        'subject, predicate or object');
    }

    let quads;
    if (payload.isLiteral()) {
      quads = TermConverter.getLiteralQuads(subject, predicate, object, context,
        payload.getDataType(), payload.getLanguage());
    } else {
      quads = TermConverter.getQuads(subject, predicate, object, context);
    }

    return this.addQuads(quads, payload.getContext(), payload.getBaseURI());
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
      context, baseURI, false)).then((response) => {
      this.logger.debug(this.getLogPayload(response, {quads, context, baseURI}),
        'Inserted statements');
    });
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
    return TermConverter.toString(quads)
      .then((data) => this.sendData(data, context, baseURI, true))
      .then((response) => {
        this.logger.debug(this.getLogPayload(response, {
          quads,
          context,
          baseURI
        }), 'Overwritten statements');
      });
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
   * @return {Promise<HttpResponse|Error>} promise resolving after the data has
   * been inserted successfully or an error if not
   * @throws {Error} if no data is provided for saving
   */
  sendData(data, context, baseURI, overwrite) {
    if (StringUtils.isBlank(data)) {
      throw new Error('Turtle/trig data is required when adding statements');
    }

    const requestBuilder = new HttpRequestBuilder()
      .setUrl(PATH_STATEMENTS)
      .setData(data)
      .addContentTypeHeader(RDFMimeType.TRIG)
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      });

    if (overwrite) {
      requestBuilder.setMethod('put');
    } else {
      requestBuilder.setMethod('post');
    }

    return this.execute(requestBuilder);
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
    const requestBuilder = HttpRequestBuilder.httpDelete(PATH_STATEMENTS)
      .setParams({
        subj: TermConverter.toNTripleValue(subject),
        pred: TermConverter.toNTripleValue(predicate),
        obj: TermConverter.toNTripleValue(object),
        context: TermConverter.toNTripleValues(contexts)
      });

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {
        subject,
        predicate,
        object,
        contexts
      }), 'Deleted statements');
    });
  }

  /**
   * Deletes all statements in the repository.
   *
   * @return {Promise<void>} promise that will be resolved if the deletion is
   *                   successful or rejected in case of failure
   */
  deleteAllStatements() {
    const requestBuilder = HttpRequestBuilder.httpDelete(PATH_STATEMENTS);
    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response),
        'Deleted all statements');
    });
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
   * @param {GetStatementsPayload} payload is an object holding request params
   *
   * @return {Promise<WritableStream>} the client can subscribe to the readable
   * stream events and consume the emitted strings depending on the provided
   * response type as soon as they are available.
   */
  download(payload) {
    const requestBuilder = HttpRequestBuilder.httpGet(PATH_STATEMENTS)
      .addAcceptHeader(payload.getResponseType())
      .setResponseType('stream')
      .setParams({
        subj: TermConverter.toNTripleValue(payload.getSubject()),
        pred: TermConverter.toNTripleValue(payload.getPredicate()),
        obj: TermConverter.toNTripleValue(payload.getObject()),
        context: TermConverter.toNTripleValues(payload.getContext()),
        infer: payload.getInference()
      });

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {
        subject: payload.getSubject(),
        predicate: payload.getPredicate(),
        object: payload.getObject(),
        context: payload.getContext()
      }), 'Downloaded data');
      return response.getData();
    });
  }

  /**
   * Executes a POST request against the <code>/statements</code> endpoint. The
   * statements which have to be added are provided through a readable stream.
   * This method is useful for library client who wants to upload a big data set
   * into the repository.
   *
   * @param {ReadableStream} readStream
   * @param {string} contentType is one of RDF mime type formats,
   *                application/x-rdftransaction' for a transaction document or
   *                application/x-www-form-urlencoded
   * @param {NamedNode|string} [context] optional context to restrict the
   * operation. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   *
   * @return {Promise<void>} a promise that will be resolved when the stream has
   * been successfully consumed by the server
   */
  upload(readStream, contentType, context, baseURI) {
    return this.uploadData(readStream, contentType, context, baseURI)
      .then((response) => {
        this.logger.debug(this.getLogPayload(response, {
          contentType,
          context,
          baseURI
        }), 'Uploaded data stream');
      });
  }

  /**
   * Executes a PUT request against the <code>/statements</code> endpoint. The
   * statements which have to be updated are provided through a readable stream.
   * This method is useful for overriding large set of statements that might be
   * provided as a readable stream e.g. reading from file.
   *
   * @param {ReadableStream} readStream
   * @param {string} contentType
   * @param {NamedNode|string} context restrict the operation. Will be encoded
   * as N-Triple if it is not already one
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   *
   * @return {Promise<void>} a promise that will be resolved when the stream has
   * been successfully consumed by the server
   */
  overwrite(readStream, contentType, context, baseURI) {
    return this.overwriteData(readStream, contentType, context, baseURI)
      .then((response) => {
        this.logger.debug(this.getLogPayload(response, {
          contentType,
          context,
          baseURI
        }), 'Overwritten data stream');
      });
  }

  /**
   * Uploads the file specified by the provided file path to the server.
   *
   * See {@link #upload}
   *
   * @param {string} filePath path to a file to be streamed to the server
   * @param {string} contentType MIME type of the file's content
   * @param {string|string[]} [context] restricts the operation to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   *
   * @return {Promise<void>} a promise that will be resolved when the file has
   * been successfully consumed by the server
   */
  addFile(filePath, contentType, context, baseURI) {
    return this.uploadData(FileUtils.getReadStream(filePath), contentType,
      context, baseURI).then((response) => {
      this.logger.debug(this.getLogPayload(response, {
        filePath,
        contentType,
        context,
        baseURI
      }), 'Uploaded file');
    });
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
   * @param {string} contentType MIME type of the file's content
   * @param {string} [context] restricts the operation to the given context.
   * Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   *
   * @return {Promise<void>} a promise that will be resolved when the file has
   * been successfully consumed by the server
   */
  putFile(filePath, contentType, context, baseURI) {
    return this.overwriteData(FileUtils.getReadStream(filePath), contentType,
      context, baseURI).then((response) => {
      this.logger.debug(this.getLogPayload(response, {
        filePath,
        contentType,
        context,
        baseURI
      }), 'Overwritten data from file');
    });
  }

  /**
   * Executes a POST request against the <code>/statements</code> endpoint. The
   * statements which have to be added are provided through a readable stream.
   * This method is useful for library client who wants to upload a big data set
   * into the repository.
   *
   * @private
   * @param {ReadableStream} readStream
   * @param {string} contentType is one of RDF mime type formats,
   *                application/x-rdftransaction' for a transaction document or
   *                application/x-www-form-urlencoded
   * @param {NamedNode|string} [context] optional context to restrict the
   * operation. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   * @return {Promise<HttpResponse|Error>} a promise that will be resolved when
   * the stream has been successfully consumed by the server
   */
  uploadData(readStream, contentType, context, baseURI) {
    const requestBuilder = HttpRequestBuilder.httpPost(PATH_STATEMENTS)
      .setData(readStream)
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      });

    return this.execute(requestBuilder);
  }

  /**
   * Executes a PUT request against the <code>/statements</code> endpoint. The
   * statements which have to be updated are provided through a readable stream.
   * This method is useful for overriding large set of statements that might be
   * provided as a readable stream e.g. reading from file.
   *
   * @param {ReadableStream} readStream
   * @param {string} contentType
   * @param {NamedNode|string} context restrict the operation. Will be encoded
   * as N-Triple if it is not already one
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   * @return {Promise<HttpResponse|Error>} a promise that will be resolved when
   * the stream has been successfully consumed by the server
   */
  overwriteData(readStream, contentType, context, baseURI) {
    const requestBuilder = HttpRequestBuilder.httpPut(PATH_STATEMENTS)
      .setData(readStream)
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      });

    return this.execute(requestBuilder);
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
    const requestBuilder = HttpRequestBuilder.httpPost('/transactions')
      .addParam('isolation-level', isolationLevel);

    return this.execute(requestBuilder).then((response) => {
      const locationUrl = response.getHeaders()['location'];
      if (StringUtils.isBlank(locationUrl)) {
        this.logger.error(this.getLogPayload(response, {isolationLevel}),
          'Cannot obtain transaction ID');
        return Promise.reject(new Error('Couldn\'t obtain transaction ID'));
      }

      const config = this.getTransactionalClientConfig(locationUrl);
      const transactionClient = new TransactionalRepositoryClient(config);

      this.logger.debug(this.getLogPayload(response, {isolationLevel}),
        'Started transaction');
      return transactionClient;
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
    return new RepositoryClientConfig()
      .setEndpoints([locationUrl])
      .setHeaders(config.getHeaders())
      .setDefaultRDFMimeType(config.getDefaultRDFMimeType())
      .setReadTimeout(config.getReadTimeout())
      .setWriteTimeout(config.getWriteTimeout());
  }
}

module.exports = RDFRepositoryClient;
