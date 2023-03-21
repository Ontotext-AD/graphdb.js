const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const Config = require('config.js');
const {RDFMimeType} = require('graphdb').http;

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
  data.append('config', fs.createReadStream(path));

  return axios({
    method: 'post',
    url: `${Config.serverAddress}/rest/repositories?local=true`,
    data: data,
    timeout: 5000,
    headers: data.getHeaders()
  });
}

function createRepositories(repositoryNames) {
  const requests = repositoryNames.map((repoName) => createRepo(repoName));
  return Promise.all(requests).catch((e) => {
    throw new Error(e);
  });
}

function deleteRepo(name) {
  return axios({
    method: 'delete',
    url: `${Config.serverAddress}/rest/repositories/${name}`
  }).catch((e) => {
    throw new Error(e);
  });
}

function deleteRepoSecurely(name) {
  return toggleSecurity(false).then(() => {
    return axios({
      method: 'delete',
      url: `${Config.serverAddress}/rest/repositories/${name}`
    });
  }).catch((e) => {
    throw new Error(e);
  });
}

function toggleSecurity(enable) {
  return axios({
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
      'Accept': '*/*',
      'Authorization': 'Basic YWRtaW46cm9vdA=='
    },
    url: `${Config.serverAddress}/rest/security?useSecurity=${enable}`,
    data: `${enable}`,
    timeout: 5000
  });
}

function importData(rdfClient) {
  return createRepo(Config.testRepoPath).then((res) => {
    const wineRdf = path.resolve(__dirname, './data/wine.rdf');
    return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
  }).catch((e) => {
    throw new Error(e);
  });
}

function importDataSecurely(rdfSecuredClient) {
  return createRepo(Config.testRepoPath)
    .then(() => {
      return toggleSecurity(true);
    }).then(() => {
    const wineRdf = path.resolve(__dirname, './data/wine.rdf');
    return rdfSecuredClient
      .addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
  }).catch((e) => {
    throw new Error(e);
  });
}

module.exports = {
  loadFile,
  readStream,
  getReadStream,
  createRepo,
  createRepositories,
  deleteRepo,
  deleteRepoSecurely,
  toggleSecurity,
  importData,
  importDataSecurely
};
