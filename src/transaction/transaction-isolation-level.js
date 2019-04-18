/**
 * Supported transaction levels.
 * @readonly
 * @enum {string}
 */
export const TransactionIsolationLevel = {
  NONE: 'NONE',
  READ_UNCOMMITTED: 'READ_UNCOMMITTED',
  READ_COMMITTED: 'READ_COMMITTED',
  SNAPSHOT_READ: 'SNAPSHOT_READ',
  SNAPSHOT: 'SNAPSHOT',
  SERIALIZABLE: 'SERIALIZABLE'
};
