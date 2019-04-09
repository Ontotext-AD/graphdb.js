import axios from 'axios';

export const createInstance = () => axios.create({
  baseURL: 'http://ff-dev.ontotext.com/',
  timeout: 3000,
  headers: {
    'Accept': 'application/json',
  },
});

export default {
  createInstance,
};
