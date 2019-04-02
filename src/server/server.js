import {Axios} from '../http';

export const SERVICE_URL = 'repositories';

/**
 * Class for Server.
 * @class Server
 */
class Server {
  /**
   * Constructor for Server class.
   * @param { Object } config for the server configuration.
   * @param { object } options for the axios configuration.
   **/
  constructor(config, options) {
    this.axios = Axios.createInstance(options);
    this.config = config;
  }

  /**
   * Create repository.
   * @param { String } id
   * @param { Object } config for the overridable repository configuration.
   * @return { Promise } promise with new Repository instance.
   */
  createRepository(id, config) {
    return new Promise((resolve, reject) => {
      this.isRepositoryExist(id).then((result) => {
        result ?
          resolve(/* new Repository(config) */) :
          this.axios.post(SERVICE_URL, {}).then((response) => {
            resolve(/* new Repository(config) */);
          }, (err) => {
            reject(err);
          });
      });
    });
  }

  /**
   * Check if repository exists.
   * @param { String } id
   * @return { Promise } promise with boolean value.
   */
  isRepositoryExist(id) {
    return new Promise((resolve, reject) => {
      this.getRepositoryIDs().then((result) => {
        resolve(result.includes(id));
      }, (err) => {
        reject(err);
      });
    });
  }

  /**
   * Delete repository
   * @param { String } id
   * @return { Promise } promise with axios delete result.
   */
  deleteRepository(id) {
    return new Promise((resolve, reject) => {
      this.axios.delete(`${SERVICE_URL}/${id}`).then(() => {
        resolve('Repository successfully deleted.');
      }, (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get repository
   * @param { String } id
   * @param { Object } config for the overridable repository configuration.
   * @return { Promise } promise with new Repository instance.
   */
  getRepository(id, config) {
    return new Promise((resolve, reject) => {
      this.isRepositoryExist(id).then((result) => {
        result ?
          resolve(/* new Repository(config)*/) :
          reject(new Error('There is no such repository.'));
      });
    });
  }

  /**
   * Get an array of repository ids.
   * @return { Promise } promise with get repository result.
   */
  getRepositoryIDs() {
    return new Promise((resolve, reject) => {
      this.axios.get(SERVICE_URL).then((response) => {
        resolve(response.data.results.bindings.map(({id}) => id.value));
      }, (err) => {
        reject(err);
      });
    });
  }
}

export default Server;
