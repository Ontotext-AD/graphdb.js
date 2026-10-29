# Pull requests

How to write a pull request description. The skeleton lives in
[`.github/pull_request_template.md`](../.github/pull_request_template.md) and GitHub pre-fills it.

The goal: a reviewer understands **why** the change exists and **the shape of the implementation** before opening the
diff.

## Title and branch

| Item | Format | Example |
|---|---|---|
| Branch | `GDB-XXXXX-short-description` | `GDB-12034-prepend-base-url-to-relative-endpoints` |
| PR title | `GDB-XXXXX: Short description` | `GDB-12034: Prepend the server base URL to relative repository endpoints` |
| Commit subject | same as the PR title | |

Target `master`. Squash the commits before review.

## Sections

| Section | Rule |
|---|---|
| Header | Link to the Jira ticket. Add related tickets or PRs when relevant. |
| **Why** | One or two sentences. The problem, not the solution. |
| **Special things to note** | 1-3 bullets a reviewer must not miss: surprising decisions, deliberate omissions, compatibility concerns, what was not verified. Write `None.` when there are none. |
| **Change outline** | A visual summary, only when the change is complex (see below). Otherwise `Not needed.` |
| **Testing** | The tests that cover the change, by name; a test that failed before and passes now is the strongest evidence. Say whether the acceptance suite ran and against which GraphDB version. |
| **Checklist** | Tick every item before requesting review. |

### Special things to note: two questions

- **Can it be rolled back?** graphdb.js is a published library. Once a version is released, users depend on its
  public API and behaviour, so a change to them does not roll back with a revert. Say so, and list it under
  **Breaking changes** in `CHANGELOG.md`.
- **What can break outside this change?** Callers of a changed method, the generated types, the README examples, the
  acceptance tests.

## Change outline

Give the reviewer the picture that is hard to put together from the diff: who calls whom, who owns what, and what the
contract between the parts looks like. Do not repeat what the changed lines say.

Write it when at least one of these applies:

- A **contract** is new or changed: a public method's signature or result, a request to GraphDB, a payload.
- A new class or service, or a **responsibility moves** between files.
- The **data or control flow** through more than one unit changes (config → client → service → `HttpClient`).

Otherwise write `Not needed.`. A local bug fix, a rename or a dependency bump usually does not need one.

Pick the smallest view that explains the change: a before/after **table**, a **call tree**, a **Mermaid sequence
diagram**, or **pseudocode**. Put one short sentence before each. Show code only when the shape itself is the point,
for example a new public method other code will call.

## Style

- Write in English, as one person explaining the change to another. Short sentences, no jargon.
- Leave out what the diff already says clearly. Keep what it does not: intent, trade-offs, gaps.
- Keep the template headings so PRs read the same way.
