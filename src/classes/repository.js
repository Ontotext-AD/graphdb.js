import {Axios} from '../helpers';

/**
 * Repository class.
 */
class Repository {
  /**
   * Constructor for Repository  class
   * @param { object } options for the repository manager
   */
  constructor(options) {
    this.axios = Axios.createInstance(options);
  }

  /**
   * Get the size of the repository.
   * @param {string} repositoryID - The ID of the repository.
   * @throws Error
   */
  getRepositorySize(repositoryID='DBP-Orgs') {
    const pathname = `repositories/${repositoryID}/size`;
    const request = this.axios.get(pathname);
    request.then( (response) => {
      console.log(response.data);
      // return response.data;
    }, (err) => {
      console.error(err);
      // throw err;
    });
  }
}

export default Repository;
