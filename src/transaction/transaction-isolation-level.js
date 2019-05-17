/**
 * Supported transaction levels.
 *
 * @readonly
 * @enum {string}
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
const TransactionIsolationLevel = {
  NONE: 'NONE',
  READ_UNCOMMITTED: 'READ_UNCOMMITTED',
  READ_COMMITTED: 'READ_COMMITTED',
  SNAPSHOT_READ: 'SNAPSHOT_READ',
  SNAPSHOT: 'SNAPSHOT',
  SERIALIZABLE: 'SERIALIZABLE'
};

module.exports = TransactionIsolationLevel;
