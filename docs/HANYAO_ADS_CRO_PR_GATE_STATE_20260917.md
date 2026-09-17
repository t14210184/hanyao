# PR gate state

STATE=READY_TO_OPEN_PR

Fresh branch head must be read from GitHub after this commit. The PR must target `main`, and all subsequent CI/Preview/merge decisions must bind to the PR's current head rather than any earlier recorded SHA.
