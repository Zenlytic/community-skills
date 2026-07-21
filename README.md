# Community Skills

A curated **library of skills for Zoë** (Zenlytic's AI analyst). This repository is a
shared source-of-truth catalog: individual skills are authored and reviewed here, and then
**pulled into a specific workspace on request**.

> **This repo is not a workspace data-model repo.** Zoë loads skills from *each workspace's
> own connected repository* under `skills/`. This library is a separate, read-only source
> that Zoë reads over the GitHub MCP connector and copies into a workspace when asked.

## How it works

```
                 ┌──────────────────────────┐
   maintainers   │   Zenlytic/community-     │   read-only via GitHub MCP
   push skills → │   skills  (this repo)     │ ────────────────────────────┐
                 │   skills/<name>/SKILL.md  │                             │
                 └──────────────────────────┘                             ▼
                                                              ┌────────────────────────┐
   "pull the ARR skill into my workspace"  ───────────────►  │          Zoë           │
                                                              │  reads SKILL.md, writes │
                                                              │  it into the workspace  │
                                                              │  skills/ dir, tests it  │
                                                              └────────────────────────┘
```

1. A user asks Zoë to pull a specific skill (or set of skills) from this library.
2. Zoë reads the skill file(s) here through the **GitHub MCP connector** (read-only).
3. Zoë adds the skill to the requesting **workspace's** own skills and tests it in chat.

Nothing in a workspace ever pushes back to this repo — publishing new skills is done by
maintainers via pull request (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Connecting Zoë to this library (GitHub MCP connector)

This library is exposed to Zoë as a **read-only GitHub MCP connection**. Header
authentication (a GitHub Personal Access Token) is the supported method.

1. Mint a **fine-grained PAT** scoped to **`Zenlytic/community-skills` only**, with
   **`Contents: Read-only`** and **`Metadata: Read-only`**.
2. In Zenlytic: **Workspace Settings → Extensions → MCP → Add Connection**.
   - **Name:** `Community Skills`
   - **URL:** `https://api.githubcopilot.com/mcp/x/repos/readonly`
   - **Header:** `Authorization: Bearer <PAT>`
   - (Read-only is enforced by both the `/readonly` URL path and, optionally, an
     `X-MCP-Readonly: true` header.)
3. **Test Connection**, then save.

Verify the token before saving:

```bash
curl -X POST \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  https://api.githubcopilot.com/mcp/
```

See the Zenlytic docs: [GitHub (MCP)](https://docs.zenlytic.com/mcp/github) and
[Skills](https://docs.zenlytic.com/using-zenlytic/skills).

## Repository layout

```
community-skills/
├── README.md            ← you are here
├── CATALOG.md           ← index of every available skill (keep in sync)
├── CONTRIBUTING.md      ← how to author & submit a skill
└── skills/
    ├── _template/
    │   └── SKILL.md      ← copy this to start a new skill
    └── <skill-name>/
        ├── SKILL.md      ← the skill (YAML front matter + instructions)
        └── ...           ← optional supporting files (up to 5)
```

Each skill lives in its own directory. The skill itself is a single `SKILL.md` with YAML
front matter (`name`, `description`, optional `enabled`) followed by markdown instructions —
the exact format Zoë expects in a workspace `skills/` directory, so files copy across
unchanged.

## Available skills

See **[CATALOG.md](CATALOG.md)** for the current list. Ask Zoë for a skill by name, e.g.
*"pull the `arr-calculation` skill from the community library into this workspace."*
