# What stift sends

stift is an alpha. To learn how it's used and to make it better, it sends data to the stift team. It sends only from your machine's Node side (the plugin's bridge, CLI and hooks), never from your web page.

## What

- **Usage:** installs, setup results (framework and version, package manager), session and comment counts, and errors with home folder paths removed. With each of them: your operating system, Node, Claude Code and stift versions, and how you sign in to Claude: your subscription's plan (such as Pro, Max or Team), an API key, Bedrock, Vertex or Foundry. Never the key, token, account or organization name.
- **Structure:** the HTML tags and React components a comment points at, file types and paths within the repository, how much changed, whether a change was kept or undone, and the names, duration and success of the tools Claude Code used.
- **Content** (only if you said yes in setup): the text of each comment, Claude Code's final summary, and the inputs and results of the tools Claude Code used for it. **These can include snippets of your source code.**
- **Identity:** your git name and email, and an ID hashed from the email, so events can be connected to a person and a stift session.

Before sending, stift removes text that looks like secrets or credentials, email addresses and URLs from content, and shortens long text. Don't put secrets into comments anyway.

## What for

To run, understand and improve stift, **including training and evaluating AI models**. Only the stift team can see it; we don't sell it or publish anything that identifies you, your company or your code.

## Where

PostHog, on its EU cloud (Frankfurt).

## Turning it off

- Answer **No** when setup asks whether to share content: then only usage and structure are sent. Change it later with `node <stift plugin>/dist/stift.mjs telemetry --content no`.
- Set `DO_NOT_TRACK=1` or `STIFT_TELEMETRY=0` in your environment to send nothing at all.

## Questions or deletion

Email hello@tasteand.agency to ask what we hold about you or to have it deleted.
