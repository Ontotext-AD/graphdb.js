const ConsoleLogger = require('../logging/console-logger');

/**
 * Base service class containing common and utility logic for
 * extending services.
 *
 * @class
 * @abstract
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class Service {
  /**
   * Instantiates the service with the provided HTTP request executor function.
   *
   * @param {Function} httpRequestExecutor used to execute HTTP requests
   */
  constructor(httpRequestExecutor) {
    this.httpRequestExecutor = httpRequestExecutor;
    this.initLogger();
  }

  /**
   * Instantiates the service's logger.
   *
   * @private
   */
  initLogger() {
    this.logger = new ConsoleLogger({
      name: this.getServiceName()
    });
  }

  /**
   * Returns the service's name.

   * @abstract
   *
   * @return {string} the name
   */
  getServiceName() {
    throw new Error('Must be overridden!');
  }
}

module.exports = Service;
