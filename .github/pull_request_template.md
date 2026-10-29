<!--
PR title: GDB-XXXXX: Short description (matches the branch name)
Guide: conventions/pull-requests.md
HTML comments are not rendered; you can leave them in.
-->

[GDB-XXXXX](https://graphwise.atlassian.net/browse/GDB-XXXXX)

## Why

<!-- One or two sentences: the problem this PR solves and what changes for the library user once it ships. -->


## Special things to note

<!--
1-3 bullets a reviewer must not miss: surprising decisions, deliberate omissions,
compatibility concerns, what was NOT verified. Write "None." if there are none.
Ask yourself: does it change the public API or behaviour (a breaking change once released)?
What can break outside this change (callers, generated types, README examples, acceptance tests)?
-->
- None.

## Change outline

<!--
Only when the change is complex: a new or changed contract, a responsibility that moves,
or a changed flow through several units. Otherwise write "Not needed.".
Show the picture the diff does not: a table, a call tree, a Mermaid sequence diagram, or pseudocode.
-->
Not needed.

## Testing

<!--
Name the tests that cover the change. A test that failed before and passes now is the
strongest evidence. Say whether the acceptance suite ran and against which GraphDB version.
-->


## Checklist

- [ ] Branch name follows `GDB-XXXXX-short-description`
- [ ] Target branch is correct
- [ ] Commit messages follow `GDB-XXXXX: Description`
- [ ] Commits are squashed
- [ ] PR title follows `GDB-XXXXX: Description`
- [ ] PR description is complete (Why, Special things to note, Change outline, Testing)
- [ ] Tests added or updated
- [ ] JSDoc, README and CHANGELOG updated
