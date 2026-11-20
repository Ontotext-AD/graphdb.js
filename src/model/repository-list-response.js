/**
 * Response model for repository list endpoint.
 * Contains the repository descriptors of all locations, flattened into
 * one array.
 *
 * @class
 */
class RepositoryListResponse {
  /**
   * @param {Object<string, Object[]>} repositoriesByLocation Repository
   * descriptors grouped by location
   */
  constructor(repositoriesByLocation = {}) {
    this.repositories = Object.values(repositoriesByLocation).flat();
  }

  /**
   * Get the repositories
   * @return {Object[]} array of repository descriptors
   */
  getRepositories() {
    return this.repositories;
  }

  /**
   * Get repository IDs
   * @return {string[]} array of repository IDs
   */
  getRepositoryIds() {
    return this.repositories.map((repo) => repo.id);
  }
}

module.exports = RepositoryListResponse;
