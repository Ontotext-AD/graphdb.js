const Logger = require('./logger');

const level = process.env.LOG_LEVEL || 'info';

const pino = require('pino')({
  level,
  base: null,
  useLevelLabels: true
});

/**
 * Base implementation of logger writing in console.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ConsoleLogger extends Logger {
  /**
   * Initializes a console logger.
   *
   * Allows to create a child logger by providing the <code>config</code> param.
   * Anything in this configuration will be appended for each log.
   *
   * @param {object} [config] optional child logger configuration
   */
  constructor(config) {
    super();
    if (config) {
      this.logger = pino.child(config);
    } else {
      this.logger = pino;
    }
  }

  /**
   * Logs an info message.
   *
   * @param {...object} args arguments to be relayed for logging
   */
  info(...args) {
    this.logger.info(...args);
  }

  /**
   * Logs a warn message.
   *
   * @param {...object} args arguments to be relayed for logging
   */
  warn(...args) {
    this.logger.warn(...args);
  }

  /**
   * Logs an error message.
   *
   * @param {...object} args arguments to be relayed for logging
   */
  error(...args) {
    this.logger.error(...args);
  }

  /**
   * Logs a debug message.
   *
   * @param {...object} args arguments to be relayed for logging
   */
  debug(...args) {
    this.logger.debug(...args);
  }

  /**
   * Logs a trace message.
   *
   * @param {...object} args arguments to be relayed for logging
   */
  trace(...args) {
    this.logger.trace(...args);
  }

  /**
   * Creates an object from the provided HTTP response that is suitable for
   * structured logging.
   *
   * Any additional key-value entries from <code>params</code> will be assigned
   * in the created payload object.
   *
   * @static
   * @param {HttpResponse} response the HTTP response.
   * Used to get the execution time and the base URL
   * @param {object} [params] additional parameters to be appended
   * @return {object} the constructed payload object for logging
   */
  static getLogPayload(response, params = {}) {
    const payload = {
      elapsedTime: response.getElapsedTime(),
      repositoryUrl: response.getBaseURL()
    };
    Object.assign(payload, params);
    return payload;
  }
}

module.exports = ConsoleLogger;
