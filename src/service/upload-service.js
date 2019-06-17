const Service = require('./service');
const HttpRequestBuilder = require('../http/http-request-builder');
const ServiceRequest = require('./service-request');
const PATH_STATEMENTS = require('./service-paths').PATH_STATEMENTS;

const TermConverter = require('../model/term-converter');
const LoggingUtils = require('../logging/logging-utils');
const FileUtils = require('../util/file-utils');

/**
 * Service for uploading data streams.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class UploadService extends Service {
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
   * @return {ServiceRequest} a service request that will be resolved when the
   * stream has been successfully consumed by the server
   */
  upload(readStream, contentType, context, baseURI) {
    const requestBuilder = this.getUploadRequest(readStream, contentType,
      context, baseURI);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          contentType,
          context,
          baseURI
        }), 'Uploaded data stream');
      });
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
   * @return {ServiceRequest} a service request that will be resolved when the
   * stream has been successfully consumed by the server
   */
  overwrite(readStream, contentType, context, baseURI) {
    const requestBuilder = this.getOverwriteRequest(readStream, contentType,
      context, baseURI);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          contentType,
          context,
          baseURI
        }), 'Overwritten data stream');
      });
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
   * @return {ServiceRequest} a service request that will be resolved when the
   * file has been successfully consumed by the server
   */
  addFile(filePath, contentType, context, baseURI) {
    const fileStream = FileUtils.getReadStream(filePath);
    const requestBuilder = this.getUploadRequest(fileStream, contentType,
      context, baseURI);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          filePath,
          contentType,
          context,
          baseURI
        }), 'Uploaded file');
      });
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
   * @return {ServiceRequest} a service request that will be resolved when the
   * file has been successfully consumed by the server
   */
  putFile(filePath, contentType, context, baseURI) {
    const fileStream = FileUtils.getReadStream(filePath);
    const requestBuilder = this.getOverwriteRequest(fileStream, contentType,
      context, baseURI);

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response, {
          filePath,
          contentType,
          context,
          baseURI
        }), 'Overwritten data from file');
      });
    });
  }

  /**
   * Executes a POST request against the <code>/statements</code> endpoint. The
   * statements which have to be added are provided through a readable stream.
   * This method is useful for library client who wants to upload a big data set
   * into the repository.
   *
   * @private
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
   * @return {Promise<HttpResponse|Error>} a promise that will be resolved when
   * the stream has been successfully consumed by the server
   */
  getUploadRequest(readStream, contentType, context, baseURI) {
    return HttpRequestBuilder.httpPost(PATH_STATEMENTS)
      .setData(readStream)
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      });
  }

  /**
   * Executes a PUT request against the <code>/statements</code> endpoint. The
   * statements which have to be updated are provided through a readable stream.
   * This method is useful for overriding large set of statements that might be
   * provided as a readable stream e.g. reading from file.
   *
   * @private
   *
   * @param {ReadableStream} readStream
   * @param {string} contentType
   * @param {NamedNode|string} context restrict the operation. Will be encoded
   * as N-Triple if it is not already one
   * @param {string} [baseURI] optional uri against which any relative URIs
   * found in the data would be resolved.
   *
   * @return {Promise<HttpResponse|Error>} a promise that will be resolved when
   * the stream has been successfully consumed by the server
   */
  getOverwriteRequest(readStream, contentType, context, baseURI) {
    return HttpRequestBuilder.httpPut(PATH_STATEMENTS)
      .setData(readStream)
      .addContentTypeHeader(contentType)
      .setResponseType('stream')
      .setParams({
        baseURI,
        context: TermConverter.toNTripleValues(context)
      });
  }

  /**
   * @inheritDoc
   */
  getServiceName() {
    return 'UploadService';
  }
}


module.exports = UploadService;
