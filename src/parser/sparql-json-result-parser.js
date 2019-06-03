const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const QueryType = require('../query/query-type');
const DataFactory = require('n3').DataFactory;
import {SparqlJsonParser} from 'sparqljson-parse';

/**
 * Parse a sparql tuple query json result and convert it RDFJS-based
 * data structure.
 *
 * A custom parser library is used for the parsing. Also the N3 DataFactory is
 * used for building the data objects instead of the native RDFJS datafactory as
 * there are some minor discrepancies in between them and we already stuck to N3
 * as a default implementation.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class SparqlJsonResultParser extends ContentParser {
  /**
   * @inheritDoc
   */
  constructor(config) {
    super(config);

    this.parser = new SparqlJsonParser({
      dataFactory: DataFactory
    });
  }

  /**
   * This method should be invoked with a text stream and will return also a
   * stream converted to RDFJS objects.
   *
   * Client of the method can subscribe to following events in order to consume
   * the stream:
   * <code>
   * stream.on('variables', (variables) => console.log(variables));
   * stream.on('data', (bindings) => console.log(bindings));
   * stream.on('error', (error) => console.log(error));
   * </code>
   *
   * @param {NodeJS.ReadableStream} stream with the text which has to be parsed
   * to given format.
   * @param {Object} [config] optional parser configuration.
   * @return {NodeJS.ReadableStream|Promise<boolean>} a stream with the
   * converted content for SELECT queries and a Promise which resolves to
   * boolean value for ASK queries.
   */
  parse(stream, config) {
    if (config.queryType === QueryType.ASK) {
      return this.parser.parseJsonBooleanStream(stream);
    }
    return this.parser.parseJsonResultsStream(stream);
  }

  /**
   * @inheritDoc
   */
  getSupportedType() {
    return RDFMimeType.SPARQL_RESULTS_JSON;
  }
}

module.exports = SparqlJsonResultParser;
