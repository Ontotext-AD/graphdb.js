import {axiosInstance} from '../constants/configurations/axios';

/**
 * A class for repository management.
 */
class RepositoryManager {
  /**
   * Constructor for Repository Manager class
   */
  constructor() {
    this.axios = axiosInstance;
  }

  /**
   * Get an list of available repositories.
   * @throws Error
   */
  getRepositories() {
    this.axios.get('repositories').then((response) => {
      return JSON.stringify(response);
    }).catch((err) => {
      throw new Error(err);
    });
  }
}

export default RepositoryManager;
