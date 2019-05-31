const BaseRepositoryClient = require('../repository/base-repository-client');
const ConsoleLogger = require('../logging/console-logger');
const RDFMimeType = require('../http/rdf-mime-type');
const TermConverter = require('../model/term-converter');
const StringUtils = require('../util/string-utils');
const FileUtils = require('../util/file-utils');
const CommonUtils = require('../util/common-utils');
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
   */
  getLogger() {
    return new ConsoleLogger({
      name: 'TransactionalRepositoryClient'
    });
  }

  /**
   * @inheritDoc
   * @override
   * @throws {Error} if the transaction has been committed or rollbacked
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

    return this.execute((http) => http.put('', null, requestConfig))
      .then((response) => {
        this.logger.debug(this.getLogPayload(response, {context}),
          'Fetched size');
        return response.getData();
      });
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
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'GET',
        subj: TermConverter.toNTripleValue(payload.getSubject()),
        pred: TermConverter.toNTripleValue(payload.getPredicate()),
        obj: TermConverter.toNTripleValue(payload.getObject()),
        context: TermConverter.toNTripleValues(payload.getContext()),
        infer: payload.getInference()
      })
      .addAcceptHeader(payload.getResponseType())
      .get();

    return this.execute((http) => http.put('', null, requestConfig))
      .then((response) => {
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
   * @param {GetQueryPayload} payload is an object holding request parameters
   *
   * @return {Promise} the client can subscribe to the stream events and consume
   * the emitted strings or Quads depending on the provided response type as
   * soon as they are available.
   */
  query(payload) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setResponseType('stream')
      .addAcceptHeader(payload.getResponseType())
      .addContentTypeHeader(payload.getContentType())
      .setParams({
        action: 'QUERY'
      })
      .get();

    return this.execute((http) => http.put('', payload.getParams(),
      requestConfig)).then((response) => {
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
   * Executes a request with a SPARQL query to update repository data.
   *
   * @param {UpdateQueryPayload} payload request object containing the query
   * @return {Promise<void>} promise that will be resolved if the update is
   * successful or rejected in case of failure
   */
  update(payload) {
    const requestConfig = new HttpRequestConfigBuilder()
      .addContentTypeHeader(payload.getContentType())
      .setParams({
        action: 'UPDATE'
      })
      .get();

    return this.execute((http) => http.put('', payload.getParams(),
      requestConfig)).then((response) => {
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
   *
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
   * @private
   * @param {string} data payload data in Turtle or Trig format
   * @param {string|string[]} [context] restricts the insertion to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @return {Promise<void>} promise resolving after the data has been inserted
   * successfully
   * @throws {Error} if no data is provided for saving
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
      .addContentTypeHeader(RDFMimeType.TRIG)
      .get();

    return this.execute((http) => http.put('', data, requestConfig))
      .then((response) => {
        this.logger.debug(this.getLogPayload(response, {
          data,
          context,
          baseURI
        }), 'Inserted statements');
      });
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

    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'DELETE'
      })
      .addContentTypeHeader(RDFMimeType.TRIG)
      .get();

    return this.execute((http) => http.put('', data, requestConfig))
      .then((response) => {
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
    const requestConfig = new HttpRequestConfigBuilder()
      .addAcceptHeader(payload.getResponseType())
      .setResponseType('stream')
      .setParams({
        action: 'GET',
        subj: TermConverter.toNTripleValue(payload.getSubject()),
        pred: TermConverter.toNTripleValue(payload.getPredicate()),
        obj: TermConverter.toNTripleValue(payload.getObject()),
        context: TermConverter.toNTripleValues(payload.getContext()),
        infer: payload.getInference()
      })
      .get();

    return this.execute((http) => http.put('', null, requestConfig))
      .then((response) => {
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
   * Streams data to the repository from the provided readable stream.
   *
   * This method is useful for library client who wants to upload a big data set
   * into the repository during a transaction
   *
   * @private
   * @param {ReadableStream} readStream stream with the data to be uploaded
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
      .then((response) => {
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
    return this.execute((http) => http.deleteResource('')).then((response) => {
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
