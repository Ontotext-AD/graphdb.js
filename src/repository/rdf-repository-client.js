const BaseRepositoryClient = require('../repository/base-repository-client');
const ConsoleLogger = require('../logging/console-logger');

const RepositoryService = require('../service/repository-service');
const NamespaceService = require('../service/namespace-service');
const StatementsService = require('../service/statements-service');
const QueryService = require('../service/query-service');
const UploadService = require('../service/upload-service');
const DownloadService = require('../service/download-service');
const TransactionService = require('../service/transaction-service');

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
    this.initServices();
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
   * Instantiates dependent services.
   */
  initServices() {
    const httpRequestExecutor = this.execute.bind(this);
    const parseExecutor = this.parse.bind(this);

    this.repositoryService = new RepositoryService(httpRequestExecutor);
    this.namespaceService = new NamespaceService(httpRequestExecutor);
    this.statementsService = new StatementsService(httpRequestExecutor,
      this.parserRegistry, parseExecutor);
    this.queryService = new QueryService(httpRequestExecutor, parseExecutor);
    this.uploadService = new UploadService(httpRequestExecutor);
    this.downloadService = new DownloadService(httpRequestExecutor);
    this.transactionService = new TransactionService(httpRequestExecutor,
      this.repositoryClientConfig);
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
    return this.repositoryService.getSize(context).execute();
  }

  /**
   * Retrieves all present namespaces as a collection of {@link Namespace}.
   *
   * @return {Promise<Namespace[]>} promise resolving to a collection of
   *                                {@link Namespace}
   */
  getNamespaces() {
    return this.namespaceService.getNamespaces().execute();
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
    return this.namespaceService.getNamespace(prefix).execute();
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
    return this.namespaceService.saveNamespace(prefix, namespace).execute();
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
    return this.namespaceService.deleteNamespace(prefix).execute();
  }

  /**
   * Deletes all namespace declarations in the repository.
   *
   * @return {Promise<void>} promise that will be resolved after
   * successful deletion
   */
  deleteNamespaces() {
    return this.namespaceService.deleteNamespaces().execute();
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
    return this.statementsService.get(payload).execute();
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
   * @throws {Error} if the payload is misconfigured
   */
  query(payload) {
    return this.queryService.query(payload).execute();
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
   * @throws {Error} if the payload is misconfigured
   */
  update(payload) {
    return this.queryService.update(payload).execute();
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
    return this.statementsService.add(payload).execute();
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
    return this.statementsService.addQuads(quads, context, baseURI).execute();
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
    return this.statementsService.putQuads(quads, context, baseURI).execute();
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
    return this.statementsService.deleteStatements(subject, predicate, object,
      contexts).execute();
  }

  /**
   * Deletes all statements in the repository.
   *
   * @return {Promise<void>} promise that will be resolved if the deletion is
   *                   successful or rejected in case of failure
   */
  deleteAllStatements() {
    return this.statementsService.deleteAllStatements().execute();
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
    return this.downloadService.download(payload).execute();
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
    return this.uploadService.upload(readStream, contentType, context, baseURI)
      .execute();
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
    return this.uploadService.overwrite(readStream, contentType, context,
      baseURI).execute();
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
    return this.uploadService.addFile(filePath, contentType, context, baseURI)
      .execute();
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
    return this.uploadService.putFile(filePath, contentType, context, baseURI)
      .execute();
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
    return this.transactionService.beginTransaction(isolationLevel);
  }
}

module.exports = RDFRepositoryClient;
