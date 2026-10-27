/**
 * User roles and additional permissions a user can be granted.
 *
 * Each user has one user role. Additional permissions apply only to
 * <code>ROLE_USER</code>, because the other roles already cover repository
 * access. Append the repository ID to a permission prefix, e.g.
 * <code>WRITE_REPO_myrepo</code>, or <code>*</code> for all repositories.
 *
 * @readonly
 * @enum {string}
 * @author Teodossi Dossev
 */
const Authority = {
  /** Can perform all operations. Includes REPO_MANAGER and CLUSTER. */
  ADMIN: 'ROLE_ADMIN',
  /** Can create, edit and delete repositories. Includes MONITORING. */
  REPO_MANAGER: 'ROLE_REPO_MANAGER',
  /** Can monitor and abort queries and updates. Includes USER. */
  MONITORING: 'ROLE_MONITORING',
  /** Can save queries, graph visualizations and user settings. */
  USER: 'ROLE_USER',
  /** Can perform internal cluster operations. */
  CLUSTER: 'ROLE_CLUSTER',
  /** Prefix of a custom role, used in fine-grained access control rules. */
  CUSTOM_ROLE_PREFIX: 'CUSTOM_',
  /** Read access to a repository. */
  READ_REPO_PREFIX: 'READ_REPO_',
  /** Write access to a repository. Requires read access to it. */
  WRITE_REPO_PREFIX: 'WRITE_REPO_',
  /**
   * Can restart a repository and edit its permissions, but not delete it.
   * Requires read and write access to it and cannot use <code>*</code>.
   */
  MAINTAIN_REPO_PREFIX: 'MAINTAIN_REPO_',
  /**
   * Limits a read or write permission to GraphQL, without access to the RDF
   * layer, e.g. <code>READ_REPO_myrepo:GRAPHQL</code>. Not valid for maintain.
   */
  GRAPHQL_ONLY_SUFFIX: ':GRAPHQL'
};

module.exports = Authority;
