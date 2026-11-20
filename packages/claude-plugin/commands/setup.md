---
description: Add stift to this project's web app (Vite or Next.js, dev only) and check that the comment overlay loads
argument-hint: "[app directory]"
allowed-tools: Bash(node:*), Bash(git diff:*), Bash(git status:*), Bash(curl:*), Bash(lsof:*), Read, Edit
---

Set up stift in this project: the user will comment on their running web app in the browser, and each comment becomes a change made by this Claude Code session. Work through these steps without asking the user anything unless a step says so. Don't commit anything.

1. Add the integration. Run this from the project root (add `--dir <app>` when the user named an app directory: $ARGUMENTS):

   ```sh
   node "${CLAUDE_PLUGIN_ROOT}/dist/stift.mjs" setup
   ```

   - Exit 0: done. Exit 2: make the `TODO` edits it prints yourself, keeping the integration dev only.
   - A `DEV` line means stift doesn't know yet how this repository runs locally. Read the files it names, once (the README's run or dev section, the scripts the package scripts call, compose files, Procfile), and record it with the `stift dev` command it prints: the command a developer runs for the full app (for example `npm run local`, not `vite` alone when the README starts a backend too), what it needs first, the services it starts with their ports, and `--page-url` only when the page is opened through another server than the dev server. Don't read further than that, and don't start anything yet.
   - The `Feature workflow` line says how features are named. When it found no convention ("the default") and the repository's AGENTS.md, CLAUDE.md or CONTRIBUTING names one for branches, set it: `node "${CLAUDE_PLUGIN_ROOT}/dist/stift.mjs" workflow --branch-prefix <prefix>` (such as `feature/`). Don't search further.
   - Leave formatting to setup: it writes the lines in the file's own quotes and semicolons and runs the repository's formatter (prettier, biome or dprint) when one is installed. Don't restyle or reformat what it wrote, and don't comment on code style.
   - Exit 1 because no Vite or Next.js app was found: tell the user stift supports React apps on Vite or Next.js (Turbopack) for now, and stop.
   - It adds a `.stift/` folder next to the app's config (one dependency-free adapter file and its types) and wraps the Vite or Next.js config; an earlier `stift/` folder from an older setup is moved there. The adapter does nothing in production builds: Next.js gets the config back unchanged outside `next dev`, and the Vite plugin has `apply: 'serve'`. It also allows this plugin's tools in `.claude/settings.local.json`, so listening for comments doesn't stop at a permission prompt.
   - When setup printed a `Telemetry:` line (not "Telemetry is off."), ask the user this one question, with "Yes" as the first, preselected option: "Help improve stift by sharing what you ask for? stift would send your comment text, Claude's summaries and its tool calls, which can include code from this repository, to the stift team, who may use it to improve and train models. Usage and structure are sent either way. Details: https://getstift.vercel.app/telemetry.md" Options: "Yes, share it" and "No". Record the answer with `node "${CLAUDE_PLUGIN_ROOT}/dist/stift.mjs" telemetry --content yes` (or `no`). Ask nothing else about it.

2. Find the dev server. Look for one already serving this app (`lsof -nP -iTCP -sTCP:LISTEN` and the ports in the dev script; a Next.js app usually runs on 3000, Vite on 5173). A running Next.js or Vite server restarts by itself after a config change. If none runs, start the recorded dev command (`node "${CLAUDE_PLUGIN_ROOT}/dist/stift.mjs" dev` shows it; else the project's dev script by lockfile) with the Bash tool's `run_in_background`, and read its output for the URL. If it needs something that isn't there (such as Docker not running), tell the user what to start instead of working around it.

3. Check it, and fix what fails (each failure says what to do):

   ```sh
   node "${CLAUDE_PLUGIN_ROOT}/dist/stift.mjs" check --url <dev server URL>
   ```

   The first page load after a restart can take a while; run the check again once if it times out. A service that doesn't answer means the backend isn't running: start the recorded dev command rather than the plain dev script.

   Lines starting with `!` are about dev source maps: don't change the config for them on your own. Tell the user what stift loses without them (as the line says), show the exact dev-only change it prints, and make it only if they agree. Setup is complete either way.

4. Show the user `git status --short` and the config diff, and tell them in a few lines:
   - Open the app in the browser (give the URL). Press **E** (or **C**, or the pencil on stift's bar at the bottom) for Edit mode and click any element to say what should change; double-click text to change it in place. **V** goes back to View mode.
   - This conversation listens for their changes from now on (step 5). Every change needs a listening session; if they close this one, they run `/stift:start` in a new conversation in this project.
   - Each comment becomes a commit on their feature branch (a comment on the base branch starts one, named after it); Cmd+Z on the page or "undo the last change" here undoes the newest. Their own uncommitted edits stay uncommitted. The shelf on stift's bar lists their features; Review pushes the branch and opens or updates its pull request.
   - The integration is local to their machine: `.stift/` is excluded in `.git/info/exclude`, the config edit stays an uncommitted change that rides along across branch switches, and stift never puts either into a comment commit, a Review push or a pull request.
   - Offer, in one sentence and without waiting for an answer, to put the integration into the repository for the whole team as its own small pull request. Only if the user says yes later: from the base branch, create `chore/stift-dev-integration` with `git switch -c` (the config edit comes along), `git add -f` the `.stift/` folder and add the config file, commit "Add stift dev integration", push, open the PR with their PR skill or `gh`, then switch back to where they were. Never add it to a feature branch.

5. Start listening in this conversation: follow `/stift:start` now, so the user's changes are picked up right away. Skip this only when a check above failed and the overlay doesn't load.
