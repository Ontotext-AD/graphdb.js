const BaseRepositoryClient = require('../repository/base-repository-client');
const HttpRequestBuilder = require('../http/http-request-builder');

const RepositoryService = require('../service/repository-service');
const StatementsService = require('../service/statements-service');
const QueryService = require('../service/query-service');
const UploadService = require('../service/upload-service');
const DownloadService = require('../service/download-service');

const ConsoleLogger = require('../logging/console-logger');
const RDFMimeType = require('../http/rdf-mime-type');
const StringUtils = require('../util/string-utils');

/**
 * Transactional RDF repository client implementation realizing transaction
 * specific operations.
 *
 * This client won't perform retries to multiple server endpoints due to when a
 * transaction is started all operations must be performed to the server where
 * it was started.
 *
 * The transaction is active until {@link #commit} or {@link #rollback} is
 * invoked. After that each sequential request will result in an error.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class TransactionalRepositoryClient extends BaseRepositoryClient {
  /**
   * @param {RepositoryClientConfig} repositoryClientConfig
   */
  constructor(repositoryClientConfig) {
    super(repositoryClientConfig);
    this.initServices();
    this.active = true;
  }

  /**
   * @inheritDoc
   */
  getLogger() {
    return new ConsoleLogger({
      name: 'TransactionalRepositoryClient'
    });
  }

  /**
   * Instantiates dependent services.
   */
  initServices() {
    const httpRequestExecutor = this.execute.bind(this);
    const parseExecutor = this.parse.bind(this);

    this.repositoryService = new RepositoryService(httpRequestExecutor);
    this.statementsService = new StatementsService(httpRequestExecutor,
      this.parserRegistry, parseExecutor);
    this.queryService = new QueryService(httpRequestExecutor, parseExecutor);
    this.uploadService = new UploadService(httpRequestExecutor);
    this.downloadService = new DownloadService(httpRequestExecutor);
  }

  /**
   * @inheritDoc
   * @override
   * @throws {Error} if the transaction has been committed or rollbacked
   */
  execute(requestBuilder) {
    if (!this.active) {
      throw new Error('Transaction is inactive');
    }
    return super.execute(requestBuilder);
  }

  /**
   * Updates the http request builder in the provided service request for
   * executing requests in a transaction.
   *
   * @param {ServiceRequest} serviceRequest the request to mutate
   * @param {string} action the transaction action
   */
  decorateServiceRequest(serviceRequest, action) {
    const requestBuilder = serviceRequest.getHttpRequestBuilder();
    requestBuilder.setMethod('put').setUrl('').addParam('action', action);
  }

  /**
   * Retrieves the size of the repository during the transaction and its
   * isolation level.
   *
   * Repository size is the amount of statements present.
   *
   * @param {string|string[]} [context] if provided, the size calculation will
   * be restricted. Will be encoded as N-Triple if it is not already one
   * @return {Promise<number>} a promise resolving to the size of the repo
   */
  getSize(context) {
    const serviceRequest = this.repositoryService.getSize(context);
    this.decorateServiceRequest(serviceRequest, 'SIZE');
    return serviceRequest.execute();
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * The fetched data depends on the transaction isolation level.
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
    const serviceRequest = this.statementsService.get(payload);
    this.decorateServiceRequest(serviceRequest, 'GET');
    return serviceRequest.execute();
  }

  /**
   * Executes request to query a repository.
   *
   * @param {GetQueryPayload} payload is an object holding request parameters
   *
   * @return {Promise} the client can subscribe to the stream events and consume
   * the emitted strings or Quads depending on the provided response type as
   * soon as they are available.
   * @throws {Error} if the payload is misconfigured
   */
  query(payload) {
    const serviceRequest = this.queryService.query(payload);
    this.decorateServiceRequest(serviceRequest, 'QUERY');
    return serviceRequest.execute();
  }

  /**
   * Executes a request with a SPARQL query to update repository data.
   *
   * @param {UpdateQueryPayload} payload request object containing the query
   * @return {Promise<void>} promise that will be resolved if the update is
   * successful or rejected in case of failure
   * @throws {Error} if the payload is misconfigured
   */
  update(payload) {
    const serviceRequest = this.queryService.update(payload);
    this.decorateServiceRequest(serviceRequest, 'UPDATE');
    return serviceRequest.execute();
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
   *
   * @return {Promise<void>} promise that will be resolved if the addition is
   * successful or rejected in case of failure
   * @throws {Error} if the payload is not provided or the payload has null
   * subject, predicate and/or object
   */
  add(payload) {
    const serviceRequest = this.statementsService.add(payload);
    this.decorateServiceRequest(serviceRequest, 'ADD');
    return serviceRequest.execute();
  }

  /**
   * Serializes the provided quads to Turtle format and sends them to the
   * repository as payload.
   *
   * If any of the quads have a graph, then the text will be serialized to the
   * Trig format which is an extended version of Turtle supporting contexts.
   *
   * @param {Quad[]} quads collection of quads to be sent as Turtle text
   * @param {string|string[]} [context] restricts the insertion to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @return {Promise<void>} promise that will be resolved if the addition
   * is successful or rejected in case of failure
   */
  addQuads(quads, context, baseURI) {
    const serviceRequest = this.statementsService.addQuads(quads, context,
      baseURI);
    this.decorateServiceRequest(serviceRequest, 'ADD');
    return serviceRequest.execute();
  }

  /**
   * Deletes the statements in the provided Turtle or Trig formatted data.
   *
   * @param {string} data payload data in Turtle or Trig format
   * @return {Promise<void>} promise resolving after the data has been deleted
   * successfully
   * @throws {Error} if no data is provided for deleting
   */
  deleteData(data) {
    if (StringUtils.isBlank(data)) {
      throw new Error('Turtle data is required when deleting statements');
    }

    const requestBuilder = HttpRequestBuilder.httpPut('')
      .setData(data)
      .setParams({
        action: 'DELETE'
      })
      .addContentTypeHeader(RDFMimeType.TRIG);

    return this.execute(requestBuilder).then((response) => {
      this.logger.debug(this.getLogPayload(response, {data}), 'Deleted data');
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
    const serviceRequest = this.downloadService.download(payload);
    this.decorateServiceRequest(serviceRequest, 'GET');
    return serviceRequest.execute();
  }

  /**
   * Streams data to the repository from the provided readable stream.
   *
   * This method is useful for library client who wants to upload a big data set
   * into the repository during a transaction
   *
   * @param {ReadableStream} readStream stream with the data to be uploaded
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
    const serviceRequest = this.uploadService.upload(readStream, contentType,
      context, baseURI);
    this.decorateServiceRequest(serviceRequest, 'ADD');
    return serviceRequest.execute();
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
    const serviceRequest = this.uploadService.addFile(filePath, contentType,
      context, baseURI);
    this.decorateServiceRequest(serviceRequest, 'ADD');
    return serviceRequest.execute();
  }

  /**
   * Commits the current transaction by applying any changes that have been
   * sent to the server.
   *
   * This effectively makes the transaction inactive.
   *
   * @return {Promise<void>} that will be resolved after successful commit
   */
  commit() {
    const requestBuilder = HttpRequestBuilder.httpPut('')
      .setParams({
        action: 'COMMIT'
      });

    return this.execute(requestBuilder).then((response) => {
      this.active = false;
      this.logger.debug(this.getLogPayload(response), 'Transaction commit');
    }).catch((err) => {
      this.active = false;
      return Promise.reject(err);
    });
  }

  /**
   * Rollbacks the current transaction reverting any changes in the server.
   *
   * This effectively makes the transaction inactive.
   *
   * @return {Promise<void>} that will be resolved after successful rollback
   */
  rollback() {
    const requestBuilder = HttpRequestBuilder.httpDelete('');
    return this.execute(requestBuilder).then((response) => {
      this.active = false;
      this.logger.debug(this.getLogPayload(response), 'Transaction rollback');
    }).catch((err) => {
      this.active = false;
      return Promise.reject(err);
    });
  }

  /**
   * @return {boolean} <code>true</code> if the transaction is active or
   * <code>false</code> otherwise
   */
  isActive() {
    return this.active;
  }
}

module.exports = TransactionalRepositoryClient;
