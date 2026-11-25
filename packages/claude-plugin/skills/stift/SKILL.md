---
name: stift
description: Use when the user mentions stift, comments or edits they made on their web app in the browser, or asks to undo or redo such a change ("undo the last change"), or to see what stift changed.
---

# stift

stift lets the user comment on their running web app (Vite or Next.js) in the browser. Each comment becomes a change made by this Claude Code session, one at a time, and stift commits it on the branch checked out, whichever it is (one commit per comment, only the session's hunks; the user's own uncommitted edits stay uncommitted). stift never switches branches by itself. Publish on stift's bar pushes the branch (never forced); Pull request moves its unpushed commits onto a new branch the session names, pushes it, and has the session open the pull request.

- `/stift:setup` adds the dev-only integration to the app, `/stift:start` listens for comments in this session, `/stift:stop` stops listening.
- While listening, stift wakes the session with each comment and its brief. Make the change yourself with the edit tools, then end the turn with the `▶` line it gives you as your only text (no "Done." or summary); the result shows in the browser, not in the terminal.
- To undo or redo: call `undo` or `redo` without a `sha` to step back or forward through the user's most recent actions, like Cmd+Z / Cmd+Shift+Z. For a particular change ("undo the button change", "bring back the header change"), find its commit with `git log` and call `undo` or `redo` with its `sha`. Each adds a commit that reverts the change or applies it again. One that conflicts with later edits is refused and changes nothing; say which files conflict.
- Make a comment's change only with Write, Edit, MultiEdit or NotebookEdit, and don't commit: stift commits what those tools changed. Changes made through Bash aren't in the comment's commit.
- `git log` shows stift's commits (trailer `Stift-Comment`); `git log --grep Stift-Comment` lists them.
