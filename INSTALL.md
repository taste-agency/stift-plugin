# Set up stift in this project

You are a coding agent in the person's project. stift lets them comment on their running web app in the browser; each comment becomes a change made by a Claude Code session and a commit on the branch they have checked out, and any of them can be undone. Set it up in this conversation, then tell them how to start. Don't ask questions you can answer yourself, never stop to ask for a restart or reload, and don't commit anything.

stift is an alpha, free to use by invitation. It sends usage data to the stift team, and with the person's yes also their comments and Claude's work on them: https://getstift.vercel.app/telemetry.md says what and how to turn it off.

`STIFT` below means the folder Claude Code keeps the stift marketplace in once step 1 has run: `~/.claude/plugins/marketplaces/stift` (use its absolute path).

## 0. Check the prerequisites

Check these first, and if one is missing, say which in one line, how to get it, and stop:

- **Node.js 22 or later:** `node --version`.
- **Git:** `git --version`, and the project is a Git repository (`git rev-parse --show-toplevel`).
- **Claude Code:** `claude --version` (in the Claude Code desktop app, `claude` may not be on PATH: use `"$CLAUDE_CODE_EXECPATH"` in its place, here and below).
- **A React app on Vite or Next.js:** a `vite.config.*` or `next.config.*` with `react` in its `package.json`, at the root or in a subfolder. stift supports nothing else for now.

## 1. Install or update the plugin

Claude Code doesn't update plugins from third-party marketplaces by itself, so do it here every time. See where `stift` comes from with `claude plugin marketplace list`, and which version is installed with `claude plugin list --json` (the `version` of `stift@stift`):

- **From `taste-agency/stift-plugin`:** update it, even when you already have the stift tools (`mcp__plugin_stift_bridge__start_listening`):

  ```sh
  claude plugin marketplace update stift
  claude plugin update stift@stift
  ```

  Compare the version before and after. If it changed, this conversation still runs the old version: treat `/stift:setup` and `/stift:start` as not available in this conversation, and use the command-line steps in steps 2 and 4, which run the updated files under `STIFT`.
- **From anywhere else** (another GitHub repository such as `taste-agency/stift`, or a local directory): replace it with `claude plugin uninstall stift@stift` and `claude plugin marketplace remove stift`, then install it as below.
- **Not there:** install it from its public GitHub marketplace:

  ```sh
  claude plugin marketplace add taste-agency/stift-plugin
  claude plugin install stift@stift
  ```

Check with `claude plugin list` that `stift@stift` shows as enabled. Then ask the person this one question, with "Yes" as the first, preselected option: "Turn on auto-update for stift? Claude Code would fetch new stift versions by itself in the background; they load in your next session." Options: "Yes, turn it on" and "No". Record the answer with `node STIFT/packages/claude-plugin/dist/stift.mjs auto-update yes` (or `no`): it sets `autoUpdate` on `extraKnownMarketplaces.stift` in the Claude Code user settings, changing nothing else. Ask it only when that command without `yes` or `no` says `unset`: `on` or `off` is an earlier answer, and `disabled` means Claude Code's environment turns plugin auto-update off (`DISABLE_AUTOUPDATER`, `DISABLE_UPDATES` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`), so the answer would change nothing.

If installing or updating fails or keeps hitting permission or sandbox errors, say in one line what failed and carry on with step 2 if `STIFT` exists: setup works without the plugin, and the person can install it later.

## 2. Add the integration and check it

If `/stift:setup` is available in this conversation, follow it. A plugin installed or updated in step 1 loads only in the next conversation or after `/reload-plugins`, so otherwise do the same from the command line:

1. From the project root, run `node STIFT/packages/claude-plugin/dist/stift.mjs setup` (add `--dir <app>` in a monorepo when it asks). It detects Vite or Next.js, copies a dev-only adapter into `<app>/.stift/` (moving an older `<app>/stift/` there), wraps the Vite or Next.js config, and allows the stift tools in `.claude/settings.local.json`.
   - Exit 0: done. Exit 2: make the `TODO` edits it prints yourself, keeping them dev only.
   - Exit 1 with "No Vite or Next.js app found": tell the person stift supports React apps on Vite or Next.js for now, and stop.
   - When it printed a `Telemetry:` line (not "Telemetry is off."), ask the person this one question, with "Yes" as the first, preselected option: "Help improve stift by sharing what you ask for? stift would send your comment text, Claude's summaries and its tool calls, which can include code from this repository, to the stift team, who may use it to improve and train models. Usage and structure are sent either way. Details: https://getstift.vercel.app/telemetry.md" Options: "Yes, share it" and "No". Record the answer with `node STIFT/packages/claude-plugin/dist/stift.mjs telemetry --content yes` (or `no`).
2. Find the dev server for the app: one already running (`lsof -nP -iTCP -sTCP:LISTEN`; Next.js usually listens on 3000, Vite on 5173), which picks up the config change by itself. If none runs, start the project's dev script (`pnpm dev`, `npm run dev`, …) in the background and read its URL from the output.
3. Run `node STIFT/packages/claude-plugin/dist/stift.mjs check --url <dev server URL>` and fix what fails; each failure says what to do. The first page load can be slow; run it again once if it times out. A line saying no Claude Code session runs yet is expected here: the overlay appears once a session with the plugin is open in this project. Lines starting with `!` are about dev source maps: don't change the config for them on your own. Tell the user what stift loses without them (as the line says), show the exact dev-only change it prints, and make it only if they agree. Setup is complete either way.

## 3. Tell the person

In a few lines, with the app's URL:

- Open the app in the browser. stift's bar sits at the bottom of the page. Press **E** (or **C**, or the pencil on the bar) for Edit mode, click any element, and write what should change. Double-click text to change it in place. **V** goes back to View mode, where the page works as usual.
- This conversation now listens for their changes (step 4). Every change needs a listening Claude Code session: if they close it, they run `/stift:start` in a new conversation in this project. Changes they make while no session listens are collected (the bar says "Not connected"); when a session connects again, stift asks them whether to apply them.
- The bar's change count opens the list of changes; click one to jump to it.
- Each comment becomes a commit on the branch they have checked out; stift never switches branches by itself, and the bar shows the branch and how far it is from its remote. Cmd+Z on the page or "undo the last change" in the session undoes the newest. Their own uncommitted edits stay uncommitted. **Publish** pushes the branch (never forced); its dropdown's **Pull request** moves the commits to a new branch, pushes it, and the session opens the pull request.
- What changed in the project (`git status --short`): the `.stift/` folder and the config line are dev only; production builds don't include them. The integration stays local to their machine: `.stift/` is excluded in `.git/info/exclude`, the config edit stays an uncommitted change that rides along across branch switches, and stift never puts either into a comment commit, a push or a pull request.
- To take stift out of the project again, they run `/stift:remove`: it undoes the config edit and removes `.stift/` and stift's local settings and state, and leaves their commits, branches and edits.

## 4. Start listening

Finish by listening for changes in this same conversation, so the person can start editing right away. Listening arms and ends the turn; stift then wakes the conversation with each change.

- If `/stift:start` is available here, follow it now (`/stift:stop` stops it).
- Otherwise, because the plugin was installed or updated in step 1 and loads only in the next conversation, start it from the command line: from the project root, run `node STIFT/packages/claude-plugin/dist/stift.mjs start` with your Bash tool (in the foreground; it takes a few seconds) and follow what it prints. It runs stift's bridge and hooks for this conversation without the plugin loaded, until Claude Code exits, and says how to call stift's tools here.
- Only if that fails, say in one line what failed, and as the last line of your message that they run `/reload-plugins` and then `/stift:start` (or `/stift:start` in a new conversation in this project).
