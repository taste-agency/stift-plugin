---
name: stift
description: Use when the user mentions stift, comments or edits they made on their web app in the browser, or asks to undo or redo such a change ("undo the last change"), or to see what stift changed.
---

# stift

stift lets the user comment on their running web app (Vite or Next.js) in the browser. Each comment becomes a change made by this Claude Code session, one at a time, and stift commits it on the feature branch checked out (one commit per comment, only the session's hunks; the user's own uncommitted edits stay uncommitted). A comment on the base branch starts a feature branch first. Review on stift's bar pushes the branch and has the session open or update its pull request.

- `/stift:setup` adds the dev-only integration to the app, `/stift:start` listens for comments in this session, `/stift:stop` stops listening.
- While listening, stift wakes the session with each comment and its brief. Make the change yourself with the edit tools, then end the turn with the `▶` line it gives you as your only text (no "Done." or summary); the result shows in the browser, not in the terminal.
- To undo or redo: call `undo` or `redo` (the newest change only; again to go further). An unpushed commit is dropped, a pushed one reverted with a new commit. One that conflicts with later edits is refused and changes nothing; say which files conflict.
- Make a comment's change only with Write, Edit, MultiEdit or NotebookEdit, and don't commit: stift commits what those tools changed. Changes made through Bash aren't in the comment's commit.
- `git log` shows stift's commits (trailer `Stift-Comment`); `git log --grep Stift-Comment` lists them.
