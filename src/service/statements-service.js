const Service = require('./service');
const HttpRequestBuilder = require('../http/http-request-builder');
const ServiceRequest = require('./service-request');
const PATH_STATEMENTS = require('./service-paths').PATH_STATEMENTS;

const RDFMimeType = require('../http/rdf-mime-type');
const StringUtils = require('../util/string-utils');
const TermConverter = require('../model/term-converter');
const LoggingUtils = require('../logging/logging-utils');
const CommonUtils = require('../util/common-utils');

/**
 * Service for reading, inserting or deleting repository statements.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class StatementsService extends Service {
  /**
   * Instantiates the service with the supplied executor and parser utils.
   *
   * @param {Function} httpRequestExecutor executor for HTTP requests
   * @param {ParserRegistry} parserRegistry registry of available parsers
   * @param {Function} parseExecutor function that will parse provided data
   */
  constructor(httpRequestExecutor, parserRegistry, parseExecutor) {
    super(httpRequestExecutor);
    this.parserRegistry = parserRegistry;
    this.parseExecutor = parseExecutor;
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * Provided values will be automatically converted to N-Triples if they are
   * not already encoded as such.
   *
   * @param {GetStatementsPayload} payload is an object holding the request
   * parameters.
   *
   * @return {ServiceRequest} service request that resolves to plain string or
   * Quad according to provided response type.
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

    const parser = this.parserRegistry.get(payload.getResponseType());
    if (parser && parser.isStreaming()) {
      requestBuilder.setResponseType('stream');
    }

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          subject: payload.getSubject(),
          predicate: payload.getPredicate(),
          object: payload.getObject(),
          context: payload.getContext()
        }), 'Fetched data');
        return this.parseExecutor(response.getData(),
          payload.getResponseType());
      });
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
   * @return {ServiceRequest} service request that will resolve if the addition
   * is successful or reject in case of failure
   *
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
   *
   * @return {ServiceRequest} service request that will be resolved if the
   * addition is successful or rejected in case of failure
   *
   * @throws {Error} if no quads are provided or if they cannot be converted
   */
  addQuads(quads, context, baseURI) {
    const requestBuilder = this.getInsertRequest(quads, context, baseURI,
      false);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          quads,
          context,
          baseURI
        }), 'Inserted statements');
      });
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
   *
   * @return {ServiceRequest} service request that will be resolved if the
   * overwrite is successful or rejected in case of failure
   *
   * @throws {Error} if no quads are provided or if they cannot be converted
   */
  putQuads(quads, context, baseURI) {
    const requestBuilder = this.getInsertRequest(quads, context, baseURI, true);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          quads,
          context,
          baseURI
        }), 'Overwritten statements');
      });
    });
  }

  /**
   * Constructs HttpRequestBuilder from the provided parameters for saving or
   * overwriting statements.
   *
   * @private
   *
   * @param {Quad[]} quads collection of quads to be sent as Turtle/Trig text
   * @param {string|string[]} [context] restricts the insertion to the given
   * context. Will be encoded as N-Triple if it is not already one
   * @param {string} [baseURI] used to resolve relative URIs in the data
   * @param {boolean} overwrite defines if the data should overwrite the repo
   * data or not
   *
   * @return {HttpRequestBuilder} promise resolving after the data has
   * been inserted successfully or an error if not
   *
   * @throws {Error} if no quads are provided or if they cannot be converted
   */
  getInsertRequest(quads, context, baseURI, overwrite) {
    const converted = TermConverter.toString(quads);
    if (StringUtils.isBlank(converted)) {
      throw new Error('Turtle/trig data is required when adding statements');
    }

    const requestBuilder = new HttpRequestBuilder()
      .setUrl(PATH_STATEMENTS)
      .setData(converted)
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

    return requestBuilder;
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
   *
   * @return {ServiceRequest} service request that will be resolved if the
   * deletion is successful or rejected in case of failure
   */
  deleteStatements(subject, predicate, object, contexts) {
    const requestBuilder = HttpRequestBuilder.httpDelete(PATH_STATEMENTS)
      .setParams({
        subj: TermConverter.toNTripleValue(subject),
        pred: TermConverter.toNTripleValue(predicate),
        obj: TermConverter.toNTripleValue(object),
        context: TermConverter.toNTripleValues(contexts)
      });

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          subject,
          predicate,
          object,
          contexts
        }), 'Deleted statements');
      });
    });
  }

  /**
   * Deletes all statements in the repository.
   *
   * @return {ServiceRequest} service request that will be resolved if the
   * deletion is successful or rejected in case of failure
   */
  deleteAllStatements() {
    const requestBuilder = HttpRequestBuilder.httpDelete(PATH_STATEMENTS);
    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response),
          'Deleted all statements');
      });
    });
  }

  /**
   * @inheritDoc
   */
  getServiceName() {
    return 'StatementsService';
  }
}

module.exports = StatementsService;
