/**
 * Authority roles.
 *
 * @readonly
 * @enum {string}
 * @author Teodossi Dossev
 */
const Authority = {
  ADMIN: 'Admin',
  REPO_MANAGER: 'RepoManager',
  USER: 'User',
  READ_REPO_PREFIX: 'Read_REPO_',
  WRITE_REPO_PREFIX: 'Write_REPO_'
};

module.exports = Authority;
