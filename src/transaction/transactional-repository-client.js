const BaseRepositoryClient = require('../repository/base-repository-client');
const RDFMimeType = require('../http/rdf-mime-type');
const TermConverter = require('../model/term-converter');
const StringUtils = require('../util/string-utils');
const FileUtils = require('../util/file-utils');
const HttpRequestConfigBuilder = require('../http/http-request-config-builder');

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
    this.active = true;
  }

  /**
   * @inheritDoc
   * @override
   */
  execute(httpClientConsumer) {
    if (!this.active) {
      throw new Error('Transaction is inactive');
    }
    return super.execute(httpClientConsumer);
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
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'SIZE',
        context: TermConverter.toNTripleValues(context)
      })
      .get();

    return this.execute((http) => http.put('', null, requestConfig));
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * The fetched data depends on the transaction isolation level.
   *
   * Provided values will be automatically converted to N-Triples if they are
   * not already encoded as such.
   *
   * @param {Object} params is an object holding request parameters as returned
   *                 by {@link GetStatementsPayload#get()}
   * @return {Promise<string|Quad>} resolves with plain string or Quad according
   *      to provided response type.
   */
  get(params) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'GET',
        subj: TermConverter.toNTripleValue(params.subject),
        pred: TermConverter.toNTripleValue(params.predicate),
        obj: TermConverter.toNTripleValue(params.object),
        context: TermConverter.toNTripleValues(params.context),
        infer: params.inference
      })
      .addAcceptHeader(params.responseType)
      .get();

    return this.execute((http) => http.put('', null, requestConfig))
      .then((data) => this.parse(data, params.responseType));
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
    return TermConverter.toString(quads)
      .then((payload) => this.sendData(payload, context, baseURI));
  }

  /**
   * Inserts the statements in the provided Turtle or Trig formatted data.
   *
   * @param {string} data payload data in Turtle or Trig format
   * @param {string|string[]} [context] restricts the insertion to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @return {Promise<void>} promise resolving after the data has been inserted
   * successfully
   */
  sendData(data, context, baseURI) {
    if (StringUtils.isBlank(data)) {
      throw new Error('Turtle data is required when adding statements');
    }

    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'ADD',
        context: TermConverter.toNTripleValues(context),
        baseURI
      })
      .addContentTypeHeader(RDFMimeType.TURTLE)
      .get();

    return this.execute((http) => http.put('', data, requestConfig));
  }

  /**
   * Deletes the statements in the provided Turtle formatted data.
   *
   * @param {string} data payload data in Turtle format
   * @return {Promise<void>} promise resolving after the data has been deleted
   * successfully
   */
  deleteData(data) {
    if (StringUtils.isBlank(data)) {
      throw new Error('Turtle data is required when deleting statements');
    }

    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'DELETE'
      })
      .addContentTypeHeader(RDFMimeType.TURTLE)
      .get();

    return this.execute((http) => http.put('', data, requestConfig));
  }

  /**
   * Streams data to the repository from the provided readable stream.
   *
   * This method is useful for library client who wants to upload a big data set
   * into the repository during a transaction
   *
   * @param {ReadableStream} readStream stream with the data to be uploaded
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
        action: 'ADD',
        context: TermConverter.toNTripleValues(context),
        baseURI
      })
      .get();

    return this.execute((http) => http.put('', readStream, requestConfig));
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
   * Commits the current transaction by applying any changes that have been
   * sent to the server.
   *
   * This effectively makes the transaction inactive.
   *
   * @return {Promise<void>} that will be resolved after successful commit
   */
  commit() {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'COMMIT'
      })
      .get();

    return this.execute((http) => http.put('', null, requestConfig))
      .finally(() => {
        this.active = false;
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
    return this.execute((http) => http.deleteResource('', null)).finally(() => {
      this.active = false;
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
