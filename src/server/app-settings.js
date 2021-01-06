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
export class AppSettings {
  /**
   * Constructor.
   * @param {boolean} defaultInference This is the default value for
   * the Include inferred data in results option in the Workbench's SPARQL
   * editor. It is taken each time a new tab is created.
   * @param {boolean} defaultSameas This is the default value for
   * the Expand results over owl:SameAs option in the Workbench's
   * SPARQL editor. It is taken each time a new tab is created.
   * @param {boolean} ignoreSharedQueries Whether to ignore
   * shared between users queries.
   * @param {boolean} executeCount For each query without limit
   * sent through the SPARQL editor, an additional query is sent
   * to determine the total number of results.
   */
  constructor(defaultInference, defaultSameas,
      ignoreSharedQueries, executeCount) {
    this.defaultInference = defaultInference;
    this.defaultSameas = defaultSameas;
    this.ignoreSharedQueries = ignoreSharedQueries;
    this.executeCount = executeCount;
  }

  /**
   * DefaultInference setter.
   * @param {boolean} defaultInference <code>true</code> if is enabled and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setDefaultInference(defaultInference) {
    this.defaultInference = defaultInference;
    return this;
  }

  /**
   * DefaultSameas setter.
   * @param {boolean} defaultSameas <code>true</code> if is enabled and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setDefaultSameas(defaultSameas) {
    this.defaultSameas = defaultSameas;
    return this;
  }

  /**
   * Ignores queries, shared between users.
   * @param {boolean} ignoreSharedQueries <code>true</code> if ignored and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setIgnoreSharedQueries(ignoreSharedQueries) {
    this.ignoreSharedQueries = ignoreSharedQueries;
    return this;
  }

  /**
   * Count all SPARQL results setter.
   * @param {boolean} executeCount <code>true</code> if is enabled and
   * <code>false</code> otherwise.
   * @return {AppSettings}
   */
  setExecuteCount(executeCount) {
    this.executeCount = executeCount;
    return this;
  }

  /**
   * @override
   * @return {Object} Application settings as key value pairs object
   */
  toString() {
    return {
      DEFAULT_INFERENCE: this.defaultInference,
      DEFAULT_SAMEAS: this.defaultSameas,
      IGNORE_SHARED_QUERIES: this.ignoreSharedQueries,
      EXECUTE_COUNT: this.executeCount
    };
  }
}

module.exports = AppSettings;
