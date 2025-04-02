const fs = require('fs');
const path = require('path');

// Regex to match namespace and module export structure.
// It captures the namespace and its associated `require` statements.
// The regex will match structures like:
//   http: {
//     ServerClient: require('./server/server-client'),
//     ServerClientConfig: require('./server/server-client-config'),
//     ...
//   }
//
// This regex consists of two capturing groups:
// 1. The first group matches the namespace name (e.g., `http`, `server`).
//    It allows alphanumeric characters and underscores.
// 2. The second group matches the contents of the namespace,
//    including all `require` statements. It captures all lines inside
//    the curly braces `{}` (including module names and their paths).
//
// Example matches:
// "http: {...}" will be captured as:
//   Group 1: "http"
//   Group 2: "ServerClient: require('./server/server-client'), ... "
//
const moduleRegex = /([a-zA-Z0-9_]+): \{([\s\S]+?)},/g;


// Regex to match individual module exports within the namespace.
// It captures the structure of each `require` statement in the form:
//   ServerClient: require(''./server/server-client'')
//
// This regex consists of two capturing groups:
// 1. The first group matches the export name
//    (e.g., `ServerClient`, `HttpClient`).
//    It allows alphanumeric characters and underscores.
// 2. The second group matches the path to the module within
//    the `require()` statement. It matches strings enclosed in either single or
//    double quotes (e.g., `./server/server-client`).
//
// Example matches:
// "ServerClient: require('./server/server-client')" will be captured as:
//   Group 1: "ServerClient"
//   Group 2: "./server/server-client"
//
const requireRegex = /([a-zA-Z0-9_]+): require\(['"](.+?)['"]\)/g;

/**
 * Processes the <code>content</code> to extract and generate
 * TypeScript namespace exports. This function loops through
 * the matched namespaces and their associated module exports.
 *
 * @param {string} content - The string content of the file to be processed.
 * @return {string} - The generated TypeScript namespace export content.
 *
 * Example:
 * Given the following content:
 * ```
 * server: {
 *    ServerClient: require('./server/server-client'),
 *    ServerClientConfig: require('./server/server-client-config'),
 * },
 * ```
 * The output will be:
 * ```
 * export namespace server {
 *   export { ServerClient } from "./server/server-client";
 *   export { ServerClientConfig } from "./server/server-client-config";
 * }
 * ```
 */
function processNamespaces(content) {
  let outputFileContent = '';

  for (const match of content.matchAll(moduleRegex)) {
    const namespace = match[1];
    const moduleContent = match[2];
    outputFileContent += `export namespace ${namespace} {\n`;
    outputFileContent += processExports(moduleContent);
    outputFileContent += '}\n\n';
  }

  return outputFileContent;
}

/**
 * Processes the <code>moduleContent</code> and generates
 * TypeScript export statements. This function loops through
 * the matched require statements inside a namespace.
 *
 * @param {string} moduleContent - The string content inside
 *                                 a namespace to extract exports from.
 * @return {string} - The generated TypeScript export statements.
 *
 * Example:
 * Given the following module content:
 * ```
 * ServerClient: require('./server/server-client'),
 * ServerClientConfig: require('./server/server-client-config'),
 * ```
 * The output will be:
 * ```
 * export { ServerClient } from "./server/server-client";
 * export { ServerClientConfig } from "./server/server-client-config";
 * ```
 */
function processExports(moduleContent) {
  let exportContent = '';

  for (const subMatch of moduleContent.matchAll(requireRegex)) {
    const exportName = subMatch[1];
    const filePath = subMatch[2];
    exportContent += `  export { ${exportName} } from "${filePath}";\n`;
  }
  return exportContent;
}


const filePath = path.join(__dirname, '../src/index.js');
const content = fs.readFileSync(filePath, 'utf8');
const outputFile = path.join(__dirname, '../lib/index.d.ts');

fs.writeFileSync(outputFile, processNamespaces(content), 'utf8');

