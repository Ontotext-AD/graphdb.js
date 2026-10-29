# AGENTS.md

`graphdb.js` is the JavaScript client library for the GraphDB and RDF4J REST APIs. It is written in CommonJS with
JSDoc types, from which the published TypeScript declarations are generated.

## Essentials

- **Package manager:** npm.
- **Node:** `>=18` (source of truth: `engines` in `package.json`); CI runs on Node.js 22.
- **Published output:** `lib/` (built and git-ignored). `docs/` is the generated API docs site; never edit it by hand.
- **Branches:** every change goes through a pull request to `master`; never commit to `master`.

## Commands

| Task | Command |
|---|---|
| Install | `npm install` |
| Build (`lib/`, docs, types) | `npm run build` |
| Lint | `npm run lint` (tests: `npm run lint:test`) |
| Type check | `npx tsc --noEmit -p .` |
| Unit tests | `npm run test`; one spec: `npx jest <path>` |
| Acceptance tests (Docker + GraphDB) | `npm run e2e:test:docker`, see [test-e2e/README.md](test-e2e/README.md) |

## Source map

| Folder | Holds |
|---|---|
| `src/repository`, `src/server`, `src/transaction` | the clients a user creates and their configs |
| `src/service` | services the clients delegate to, one per REST resource |
| `src/http` | `HttpClient` (wraps axios), request builder, MIME types |
| `src/parser` | RDF and SPARQL result parsers |
| `src/query`, `src/model`, `src/response` | payloads, models and response wrappers |
| `src/auth`, `src/security` | authentication and authorities |
| `src/index.js` | the package entry point, grouped by namespace |

Some changes have a twin outside the file you're editing. Make both or say why not:

- A new public class is exported from `src/index.js` in its namespace; `scripts/generate-types.js` reads that file to
  build the type declarations.
- A change to public behaviour updates the README examples and gets a `CHANGELOG.md` entry under `## Unreleased`.
- A change to requests sent to GraphDB may need a test in `test-e2e/`.

## Conventions & guides (`conventions/`)

- **[Conventions & workflow](conventions/README.md)**: house rules, verification order, definition of done. **Start here.**
- **[JSDoc](conventions/jsdoc.md)**: doc-comment form, tags, types and length.
- **[Testing](conventions/testing.md)**: public surface, mocking `HttpClient`, running one spec.
- **[Naming](conventions/naming.md)**: files, classes, constants, accessors, renaming end to end.
- **[Pull requests](conventions/pull-requests.md)**: branch, title, description sections, checklist.

## Testing

Test the behaviour a library user depends on, through the class the user calls (a client or a config), and mock at
the HTTP boundary with `jest.mock('http/http-client')`. Do not write a separate spec for every service, payload
builder or private method; they are covered through the client. Pure utilities and parsers are tested directly.
A bug fix has a test that fails without the fix. Full guide: [conventions/testing.md](conventions/testing.md).
