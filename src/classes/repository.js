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
   * @return {Promise}
   */
  getRepositorySize(repositoryID = 'DBP-Orgs') {
    return new Promise((resolve, reject) => {
      const pathname = `repositories/${repositoryID}/size`;
      const request = this.axios.get(pathname);
      request.then((response) => {
        resolve(response.data);
        // return response.data;
      }, (err) => {
        reject(err);
        // throw err;
      });
    });
  }
}

export default Repository;
