import axios from 'axios';

export const createInstance = (options) => axios.create({
  baseURL: 'http://ff-dev.ontotext.com/',
  timeout: 3000,
  headers: {
    'Accept': 'application/json',
  },
  ...options,
});

export default {
  createInstance,
};
