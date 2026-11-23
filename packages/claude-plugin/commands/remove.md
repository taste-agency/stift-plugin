---
description: Remove stift from this project (stop listening, undo the config edit, delete .stift/ and stift's local settings and state)
argument-hint: "[app directory]"
allowed-tools: Bash(node:*), Bash(git status:*), Bash(git diff:*)
---

Remove stift from this project: undo what `/stift:setup` and `/stift:start` added, and nothing else. Don't ask the user anything, and don't commit, switch branches, delete branches or touch any other file yourself.

1. From the project root, run (add `--dir <app>` when the user named an app directory: $ARGUMENTS):

   ```sh
   node "${CLAUDE_PLUGIN_ROOT}/dist/stift.mjs" remove
   ```

   It stops listening in this repository (in any session), takes stift out of the Vite or Next.js config, deletes the `.stift/` adapter folder, takes its lines out of `.git/info/exclude` and its entries out of `.claude/settings.local.json` (the user's own entries stay), and deletes `.git/stift/`. Running it again is harmless.

   - Exit 0: everything stift added is gone.
   - Exit 2: each `LEFT` line is something it didn't remove because that wasn't safe (for example a config edited by hand around stift's wrapper, or an integration the team committed). Don't make those edits yourself; pass them on to the user as it says.

2. Show the user `git status --short`, and tell them in a few lines what was removed and, for every `LEFT` line, exactly what to remove by hand. Say that their commits, branches (the feature branches stift made too), pull requests and their own edits stay as they were, and that a running dev server reloads its config by itself.

3. End with: the stift plugin itself stays installed in Claude Code (it works in other projects, and `/stift:setup` adds stift here again). To uninstall it: `claude plugin uninstall stift@stift`. If this session runs stift-local (`claude --plugin-dir …`), nothing is installed for it: they just run `claude` instead.
