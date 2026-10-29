# JSDoc conventions

JSDoc is reference text, not prose. A reader skims the first line and stops.

In this repo JSDoc does three jobs: it generates the [API docs](https://ontotext-ad.github.io/graphdb.js/), its types
become the published `.d.ts` files (`npm run tsd`), and it gives IDEs type checking. A wrong type is a bug.

## Contents

- [Form](#form): multiline comments, tags, types.
- [Length](#length): one opening sentence and the line budgets.
- [Content](#content): document the contract and the why, not the how; say each thing once.
- [Tone](#tone): the literary habits to avoid.
- [Example](#example): a class, a constant, and methods documented by these rules.

## Form

- Use the multiline form for classes, functions and methods: `/**`, the content, and `*/` each on their own line.
  "Multiline" is about formatting only, not licence to write more.
- Every exported class and every public method gets a doc comment (`require-jsdoc` and `valid-jsdoc` are on for `src/`).
- Document every parameter with `@param {type} name description`, the return value with `@return {type} description`,
  and every thrown error with `@throws`. Use `@return`, not `@returns`, as the rest of the code does.
- Mark internal methods `@private` and abstract classes `@abstract`; the docs site hides private members.
- Write optional parameters as `[name]` and give the type precisely (`string[]`, `Object<string, string>`,
  `Promise<RDFRepositoryClient>`). Never leave a type out: `tsc` turns it into `any`.
- Link to other API members with `{@link Class#method}` or `[text]{@link Class#method}`.
- Single-line `/** ... */` is fine for constants.

## Length

- Open with one sentence, on one line where possible, saying what the thing is or does. Everything after it is optional
  and must earn its place.
- Budgets, excluding tags: **8 lines** for a class, **5 lines** for a method, function or constant. Longer usage
  explanations belong in `README.md`, with an example.
- A one-line delegating method with a self-describing name gets a one-line description plus its tags, and nothing else.

## Content

- Document the contract: what it requires, what it returns, what it throws, and the empty, `null` or default case.
- Document the reasoning behind the design and the trade-offs made, so the reader understands the "why" without
  reading the code.
- Avoid implementation details: the doc comment says what it does, the code shows how.
- Say each thing once, where it is most specific. A rule stated on one method is linked from the others with
  `{@link}`, not restated.
- Explain non-obvious code at the code: ordering hazards, guards and workarounds belong in a one-line `//` comment on
  the line they protect.
- No structure inside a doc comment: no headings, no multi-paragraph argument. `<p>` and lists are allowed only where
  the generated page needs them.
- No reference to Jira tickets or other external artifacts unless the reader is expected to follow them.

## Tone

State facts plainly. These read as literary and cost the reader time:

- Rhetorical negation: "not a form of its own".
- Aphorisms and flourishes: "which is the point".
- More than one em-dash aside per paragraph.

## Example

```js
/** Matches URLs that start with a scheme or are protocol-relative. */
const ABSOLUTE_URL_PATTERN = /^([a-z][a-z\d+\-.]*:)?\/\//i;

/**
 * Configuration wrapper used for initialization of {@link BaseRepositoryClient}
 * implementations.
 *
 * @class
 * @extends ClientConfig
 */
class RepositoryClientConfig extends ClientConfig {
  /**
   * Gets the repository endpoint URLs. Relative endpoints are prefixed with
   * the server base [endpoint]{@link ClientConfig#getEndpoint}, while
   * absolute ones are returned unchanged.
   *
   * @return {string[]} the resolved endpoint URLs
   */
  getEndpoints() {
    // ...
  }

  /**
   * Inserts a repository endpoint URL to the rest of the endpoints. It may be
   * relative to the server base URL
   * (see {@link RepositoryClientConfig#getEndpoints}).
   *
   * @param {string} endpoint repository endpoint URL
   *
   * @return {this} current config for method chaining
   */
  addEndpoint(endpoint) {
    // ...
  }
}
```
