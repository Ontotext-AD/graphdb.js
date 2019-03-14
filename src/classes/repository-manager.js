const axios = require('../constants/configurations/axios');

/**
 * A class for repository management.
 */
class RepositoryManager {
  /**
   * Constructor for Repository Manager class
   */
  constructor() {
    this.axios = axios;
  }

  /**
   * Get an list of available repositories.
   * @throws Error
   */
  getRepositories() {
    const request = this.axios.get('repositories');
    request.then( (response) => {
      console.log(response.data);
      // return response.data;
    }, (err) => {
      console.error(err);
      // throw err;
    });
  }
}

module.exports = RepositoryManager;
