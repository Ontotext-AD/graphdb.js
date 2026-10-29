# Testing conventions

> Test the **public behaviour** of a unit, through the API a library user calls, and mock at the **HTTP boundary**.

The repo has two suites:

| Suite | Where | Runs against | Command |
|---|---|---|---|
| Unit and component (Jest) | `test/`, mirrors `src/` | mocked `HttpClient` | `npm run test` |
| Acceptance (Jest) | `test-e2e/` | a real GraphDB | `npm run e2e:test:docker`, see [test-e2e/README.md](../test-e2e/README.md) |

## Contents

- [The core rule](#the-core-rule): test through the user's seam, mock at `HttpClient`, don't multiply specs.
- [What is "public" here](#what-is-public-here): what to test directly and what is covered indirectly.
- [Mechanics](#mechanics): imports, the `HttpClient` stub, running one spec.
- [Why](#why): the reasoning behind testing through the public surface.

## The core rule

**Test the behaviour a library user depends on, through the class the user calls.**

A user builds a config (`RepositoryClientConfig`, `ServerClientConfig`), creates a client (`RDFRepositoryClient`,
`GraphDBServerClient`) and calls its methods. That surface is what a test drives. The services, payload builders and
parsers behind it are implementation and are covered indirectly.

- **Mock at the lowest level.** Mock `http/http-client` and let the real client, service and parser run. Assert the
  request the client sends (URL, method, headers, body) and the value it returns. Mocking a service one layer down
  skips the contract the test should prove.
- **Don't multiply specs.** One spec through the client replaces a cluster of per-class specs that re-assert the same
  behaviour from lower down.
- **A bug fix has a test that fails without the fix.** Check it by running the spec against the unfixed code.

## What is "public" here

| Unit | Test directly | Covered indirectly |
|---|---|---|
| Clients (`src/repository`, `src/server`, `src/transaction`) | the methods a user calls, the requests they send, the parsed results | services in `src/service`, `HttpRequestBuilder` |
| Configs (`*-client-config.js`) | getters, defaults, the fluent API | — |
| Parsers (`src/parser`) | `parse` with real RDF and SPARQL results | — |
| Utilities (`src/util`) | the return value, with plain inputs | — |
| Payloads and models (`src/query`, `src/model`) | their behaviour through the client that sends them | — |

A private method you feel you must reach directly is a sign that it, or the class around it, is badly factored. Make
it a utility with its own reason to exist, or test it through the public method that calls it.

## Mechanics

- Import modules by their path under `src/`, without `../`: `require('repository/repository-client-config')`
  (`jest.config.js` adds `src` to `moduleDirectories`).
- Mock HTTP with `jest.mock('http/http-client')` and the stub in `test/http/http-client.stub.js`:
  `HttpClient.mockImplementation(() => httpClientStub())`. Resolve `request` with the response the test needs.
- Build test data with the real classes (`new RepositoryClientConfig(...)`, `new GetQueryPayload()`), not plain
  objects. Keep fixture files under `test/<area>/data`.
- Logging is silent in tests (`test/setup.js` sets `LOG_LEVEL=fatal`); set `LOG_LEVEL` to see it.
- Run one spec: `npx jest test/repository/rdf-repository-client.spec.js`; one test: add `-t "<name>"`.
- Test names say the behaviour: `should prepend the server base URL to relative endpoints`.

## Why

Tests through the public surface assert behaviour users depend on, so they stay green through refactors that move
logic between a client, its service and its helpers. A gap in them points at a missing capability rather than a
missing line.
