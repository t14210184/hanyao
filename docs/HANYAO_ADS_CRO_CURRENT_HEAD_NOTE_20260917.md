# Current-head note

The mutable branch head must never be copied into a long-lived checklist and treated as merge authority.

Immediately before merge, the controller must:

1. fetch the PR metadata from GitHub;
2. obtain the current PR head SHA;
3. re-check CI / required checks for that exact SHA;
4. re-check `main` prestate;
5. call merge with `expected_head_sha=<fresh PR head SHA>`;
6. read back `main` and Production Pages.

This note is evidence of the exact-head policy; it does not itself define the current head.
