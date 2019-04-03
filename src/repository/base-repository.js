import {Axios} from '../http';

/**
 * Class for BaseRepository.
 * @class BaseRepository
 */
class BaseRepository {
  /**
   * Constructs BaseRepository.
   * @param {RepositoryConfig} repositoryConfig Default config for the server
   */
  constructor(repositoryConfig) {
    this.axios = Axios.createInstance();
    this.config = repositoryConfig;
  }

  /**
   * Get the size of the repository.
   * @param {string} repositoryID - The ID of the repository.
   * @throws Error
   * @return {Promise}
   */
  getSize(repositoryID = 'DBP-Orgs') {
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

export default BaseRepository;
