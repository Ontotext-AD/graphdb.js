const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const Config = require('config');

function loadFile(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'UTF-8');
}

function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('error', reject);

    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8').trim());
    });
  });
}

function isBlank(string) {
  return !string || !string.trim().length;
}

function getReadStream(filePath) {
  if (isBlank(filePath)) {
    throw new Error('File path is required');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist for path=' + filePath);
  }

  return fs.createReadStream(filePath);
}

function createRepo(path) {
  const data = new FormData();
  data.append("config", fs.createReadStream(path));

  return axios({
    method: 'post',
    url: `${Config.serverAddress}/rest/repositories?local=true`,
    data: data,
    timeout: 5000,
    headers: data.getHeaders()
  });
}


function createSecuredRepo(path) {
  const data = new FormData();
  data.append('config', fs.createReadStream(path));

  const headers = data.getHeaders();
  headers['Authorization'] = 'Basic YWRtaW46cm9vdA==';
  return axios({
    method: 'post',
    url: `${Config.serverAddress}/rest/repositories?local=true`,
    data: data,
    timeout: 5000,
    headers
  });
}

function deleteRepo(name) {
  return axios({
    method: 'delete',
    url: `${Config.serverAddress}/rest/repositories/${name}`
  });
}

function toggleSecurity(enable) {
    return axios({
      method: 'post',
      headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive', 'Accept': '*/*'},
      url: `${Config.serverAddress}/rest/security?useSecurity=${enable}`,
      data: `${enable}`,
      timeout: 5000,
      auth: {
        username: 'admin',
        password: 'root'
      }
    });
}

module.exports = {loadFile, readStream, getReadStream, createRepo, deleteRepo, toggleSecurity, createSecuredRepo};
