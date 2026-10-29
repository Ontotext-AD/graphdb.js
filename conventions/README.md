# Conventions & workflow

The house rules for changing graphdb.js and how to verify a change. [CONTRIBUTING.md](../CONTRIBUTING.md) covers
the contribution flow for external contributors; these docs add the details.

## Contents

- [Golden rules](#golden-rules): the rules every change follows.
- [Workflow](#workflow): what to check before editing and the verification order after.
- [Definition of done](#definition-of-done): when a change counts as complete.
- Topic docs: [JSDoc](jsdoc.md), [testing](testing.md), [naming](naming.md), [pull requests](pull-requests.md).

## Golden rules

1. Match the style already used in the surrounding code (Google style guide, enforced by `npm run lint`).
2. Keep the public API stable. A change to an exported class, method, or its documented behaviour is listed in
   `CHANGELOG.md`; a breaking one goes under **Breaking changes**.
3. Extend the existing clients, services and configs (`RDFRepositoryClient`, `GraphDBServerClient`,
   `RepositoryClientConfig`, `src/service/*`) instead of adding parallel ones.
4. Export new public classes from `src/index.js`, in their namespace, so they reach the package entry point and the
   generated types.
5. Send HTTP requests through `HttpClient`, never through `axios` directly.
6. Log through the client's logger (`ConsoleLogger`), never `console.*` (`no-console` is an error).
7. Avoid broad refactors unless the task requires them.
8. Every change goes through a pull request; never commit to `master`.

## Workflow

**Before editing:**

- Read the code around the change and the tests for it under `test/` (the folder mirrors `src/`).
- Search for the symbol or feature before introducing a new abstraction.

**After editing**, run the targeted checks first, then broaden:

```bash
npx jest test/repository/repository-client-config.spec.js   # the spec you touched
npm run lint
npx tsc --noEmit -p .        # JSDoc types still compile to .d.ts
npm run test                 # the whole unit suite, once at the end
```

Run the acceptance suite (`npm run e2e:test:docker`, see [test-e2e/README.md](../test-e2e/README.md)) when the change
affects requests to a real GraphDB.

## Definition of done

A change is complete when:

- Code follows these conventions.
- Lint, `tsc` and the unit tests pass.
- Tests cover the change; a bug fix has a test that fails without it.
- JSDoc and `README.md` describe the new behaviour.
- `CHANGELOG.md` has an entry under `## Unreleased`, in the form ``Fixed `X` …`` or ``Added `X` …``.
- The PR description follows [pull requests](pull-requests.md).
