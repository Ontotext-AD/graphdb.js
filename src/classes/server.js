import {Axios} from '../helpers';
import convert from 'xml-js';

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
    /* return new Promise((resolve, reject) => {
      new BaseRepository(id, config);
    });*/
  }

  /**
   * Delete repository
   * @param { String } id
   * @return { Promise } promise with axios delete result.
   */
  deleteRepository(id) {
    return new Promise((resolve, reject) => {
      this.axios.delete(`repositories/${id}`).then(() => {
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
   * @return { Promise } promise with axios get result.
   */
  getRepository(id, config) {
    return new Promise((resolve, reject) => {
      this.axios.get(`repositories/${id}`).then((response) => {
        resolve(response.data);
      }, (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get an array of repository ids.
   * @return { Promise } promise with get repository result.
   */
  getRepositoryIDs() {
    return new Promise((resolve, reject) => {
      this.axios.get('repositories').then((response) => {
        resolve(convert.xml2json(response.data, {compact: true, space: 4}));
      }, (err) => {
        reject(err);
      });
    });
  }
}

export default Server;
