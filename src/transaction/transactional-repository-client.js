const BaseRepositoryClient = require('repository/base-repository-client');
const RDFMimeType = require('http/rdf-mime-type');
const TermConverter = require('model/term-converter');
const StringUtils = require('util/string-utils');
const HttpRequestConfigBuilder = require('http/http-request-config-builder');

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
   * be restricted to this or these NTriple encoded resources
   * @return {Promise<number>} a promise resolving to the size of the repo
   */
  getSize(context) {
    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'SIZE',
        context
      })
      .get();

    return this.execute((http) => http.put('', null, requestConfig))
      .then((response) => response.data);
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * The fetched data depends on the transaction isolation level.
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
        subj: params.subject,
        pred: params.predicate,
        obj: params.object,
        context: params.context,
        infer: params.inference
      })
      .addAcceptHeader(params.responseType)
      .get();

    return this.execute((http) => http.put('', null, requestConfig))
      .then((response) => this.parse(response.data, params.responseType));
  }

  /**
   * Serializes the provided quads to Turtle format and sends them to the
   * repository as payload.
   *
   * @param {Quad[]} quads collection of quads to be sent as Turtle text
   * @return {Promise} promise that will be resolved if the addition
   * is successful or rejected in case of failure
   */
  addQuads(quads) {
    return TermConverter.toTurtle(quads)
      .then((payload) => this.addTurtle(payload));
  }

  /**
   * Inserts the statements in the provided Turtle formatted data.
   *
   * @param {string} data payload data in Turtle format
   * @return {Promise} promise resolving after the data has been inserted
   * successfully
   */
  addTurtle(data) {
    if (StringUtils.isBlank(data)) {
      throw new Error('Turtle data is required when adding statements');
    }

    const requestConfig = new HttpRequestConfigBuilder()
      .setParams({
        action: 'ADD'
      })
      .addContentTypeHeader(RDFMimeType.TURTLE)
      .get();

    return this.execute((http) => http.put('', data, requestConfig));
  }

  /**
   * Deletes the statements in the provided Turtle formatted data.
   *
   * @param {string} data payload data in Turtle format
   * @return {Promise} promise resolving after the data has been deleted
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
   * Commits the current transaction by applying any changes that have been
   * sent to the server.
   *
   * This effectively makes the transaction inactive.
   *
   * @return {Promise} that will be resolved after successful rollback
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
   * @return {Promise} that will be resolved after successful rollback
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
