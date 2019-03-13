import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: '/',
  timeout: 3000,
  headers: {'Accept': 'application/sparql-results+json'},
  responseType: 'application/json',
});
