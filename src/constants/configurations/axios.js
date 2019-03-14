const axios = require('axios');

const axiosInstance = axios.create({
  baseURL: 'http://ff-dev.ontotext.com/',
  timeout: 3000,
  headers: {'Accept': 'application/sparql-results+xml'},
});

module.exports = axiosInstance;
