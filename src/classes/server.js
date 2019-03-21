import {Axios} from '../helpers';

/**
 * Class for Server.
 * @class Server
 */
class Server {
  /**
   * Constructor for Server class.
   * @param { Object } config for the server configuration.
   */
  constructor(config) {
    this.axios = Axios.createInstance();
    this.config = config;
  }

  /**
   * Create repository.
   * @param { String } id
   * @param { Object } config for the overridable repository configuration.
   */
  createRepository(id, config) {
    /* return new Promise((id, config) => {
      new Repository(id, config);
    });*/
  }

  /**
   * Delete repository
   * @param { String } id
   * @return { Promise } promise with axios delete result.
   */
  deleteRepository(id) {
    return new Promise((id) => {
      this.axios.delete(`repositories/${id}`);
    });
  }

  /**
   * Get repository
   * @param { String } id
   * @param { Object } config for the overridable repository configuration.
   * @return { Promise } promise with axios get result.
   */
  getRepository(id, config) {
    return new Promise((id, config) => {
      const request = this.axios.get(`repositories/${id}`);
      request.then((response) => {
        console.log(response);
      });
    });
  }

  /**
   * Get an array of repository ids.
   * @throws Error
   */
  getRepositoryIDs() {
    const request = this.axios.get('repositories');
    request.then((response) => {
      console.log(response.data);
      // return response.data;
    }, (err) => {
      console.error(err);
      // throw err;
    });
  }
}

export default Server;
