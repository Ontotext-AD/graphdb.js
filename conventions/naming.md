# Naming conventions

Names are read far more often than they are written. A reviewer should understand a symbol from its name alone.

- Files are kebab-case and named after the class they export: `repository-client-config.js` exports
  `RepositoryClientConfig`. Specs are `<file>.spec.js` in the matching folder under `test/`.
- Classes are PascalCase, methods and variables camelCase, module-level constants UPPER_SNAKE_CASE
  (`RETRIABLE_STATUSES`, `ABSOLUTE_URL_PATTERN`). A constant that holds a regex says so: `…_PATTERN`.
- Name a method after what it does: `resolveEndpoint` resolves one, `setEndpoints` sets them. Accessors use
  `get…`/`set…`, booleans `is…`/`has…`/`should…` (`shouldAuthenticate`).
- Config setters return `this` for chaining, as the existing ones do.
- No abbreviations a newcomer can't expand. Spell it out: `repositoryClientConfig`, not `rcc`.
- No sequence names (`config2`, `test16`). Name the case: `transactionalConfig`.
- A specific thing gets a specific name: a service that only handles namespaces is `NamespaceService`. Don't add
  suffixes the siblings don't have.
- Renaming a feature renames everything: files, classes, exports in `src/index.js`, specs, README examples and the
  CHANGELOG entry.
