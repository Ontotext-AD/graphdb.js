/**
 * Application settings help you to configure the default behavior
 * of the GraphDB Workbench.
 * Use with extreme caution, as the changes that are made to the
 * application settings may possibly change the behavior of the
 * GraphDB Workbench for the logged-in user or for all users
 * if logged in as admin.
 *
 *  @class
 *  @author Teodossi Dossev
 */
class AppSettings {
  /**
   * Constructor.
   * @param {Object} options Configuration options
   * @param {boolean} [options.DEFAULT_INFERENCE] This is the default value for
   * the Include inferred data in results option in the Workbench's SPARQL
   * editor. It is taken each time a new tab is created. Default: true
   * @param {boolean} [options.DEFAULT_SAMEAS] This is the default value for
   * the Expand results over owl:SameAs option in the Workbench's
   * SPARQL editor. It is taken each time a new tab is created. Default: true
   * @param {boolean} [options.IGNORE_SHARED_QUERIES] Whether to ignore
   * shared between users queries. Default: false
   * @param {boolean} [options.EXECUTE_COUNT] For each query without limit
   * sent through the SPARQL editor, an additional query is sent
   * to determine the total number of results. Default: true
   * @param {boolean} [options.DEFAULT_VIS_GRAPH_SCHEMA] Default graph schema
   * for visualization. Default: true
   */
  constructor({
    DEFAULT_INFERENCE = true,
    DEFAULT_SAMEAS = true,
    IGNORE_SHARED_QUERIES = false,
    EXECUTE_COUNT = true,
    DEFAULT_VIS_GRAPH_SCHEMA = true
  } = {}) {
    this.DEFAULT_INFERENCE = DEFAULT_INFERENCE;
    this.DEFAULT_SAMEAS = DEFAULT_SAMEAS;
    this.IGNORE_SHARED_QUERIES = IGNORE_SHARED_QUERIES;
    this.EXECUTE_COUNT = EXECUTE_COUNT;
    this.DEFAULT_VIS_GRAPH_SCHEMA = DEFAULT_VIS_GRAPH_SCHEMA;
  }

  /**
   * DefaultInference setter.
   * @param {boolean} defaultInference <code>true</code> if is enabled and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setDefaultInference(defaultInference) {
    this.DEFAULT_INFERENCE = defaultInference;
    return this;
  }

  /**
   * DefaultSameAs setter.
   * @param {boolean} defaultSameAs <code>true</code> if is enabled and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setDefaultSameAs(defaultSameAs) {
    this.DEFAULT_SAMEAS = defaultSameAs;
    return this;
  }

  /**
   * Ignores queries, shared between users.
   * @param {boolean} ignoreSharedQueries <code>true</code> if ignored and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setIgnoreSharedQueries(ignoreSharedQueries) {
    this.IGNORE_SHARED_QUERIES = ignoreSharedQueries;
    return this;
  }

  /**
   * Count all SPARQL results setter.
   * @param {boolean} executeCount <code>true</code> if is enabled and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setExecuteCount(executeCount) {
    this.EXECUTE_COUNT = executeCount;
    return this;
  }

  /**
   * Default vis graph schema setter.
   * @param {boolean} defaultVisGraphSchema The default graph schema
   * for visualization
   * @return {AppSettings}
   */
  setDefaultVisGraphSchema(defaultVisGraphSchema) {
    this.DEFAULT_VIS_GRAPH_SCHEMA = defaultVisGraphSchema;
    return this;
  }

  /**
   * AppSettings to json getter
   * @return {Object} Application settings as key value pairs object
   */
  toJson() {
    return {
      DEFAULT_INFERENCE: this.DEFAULT_INFERENCE,
      DEFAULT_SAMEAS: this.DEFAULT_SAMEAS,
      IGNORE_SHARED_QUERIES: this.IGNORE_SHARED_QUERIES,
      EXECUTE_COUNT: this.EXECUTE_COUNT,
      DEFAULT_VIS_GRAPH_SCHEMA: this.DEFAULT_VIS_GRAPH_SCHEMA
    };
  }
}

module.exports = AppSettings;
