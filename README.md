# Zenlytic Community Skills

A community-maintained library of example skills for **Zoë**, Zenlytic's AI analyst.
It exists to share practical examples, spark ideas, and show what can be built with skills
in Zenlytic.

> **Community project — use at your own risk.** The skills in this repository are
> contributed by the community. They are not an official Zenlytic product, are not
> individually supported or guaranteed by Zenlytic, and may not be suitable for every
> workspace or data model. Review and test a skill in a non-production setting before
> relying on it for important work.

This repository is a shared source-of-truth catalog. A workspace administrator can ask
Zenlytic to add a read-only connection to it; people in that workspace can then use Zoë
to explore the library and pull a selected skill into their instance.

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
   request the repo connection from Zenlytic  ──────────────► │  Zenlytic workspace    │
                                                              │  connection enabled;    │
                                                              │  Zoë explores and pulls │
                                                              │  selected skills in chat│
                                                              └────────────────────────┘
```

1. A workspace administrator asks their Zenlytic contact or support team to add a read-only
   connection to this repository.
2. Once the connection is available, people in that workspace ask Zoë to explore the
   library and pull a selected skill into the workspace's own `skills/` directory.
3. The workspace administrator pulls and tests skills in a non-production branch or
   non-production workspace before relying on them.

Nothing in a workspace ever pushes back to this repo — publishing new skills is done by
maintainers via pull request (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Request the Community Skills connection

Ask your Zenlytic contact or support team to add the read-only Community Skills connection
to your workspace. Include the name of the workspace in your request.

Once it is connected, browse the [catalog](CATALOG.md) or ask Zoë to explore the available
skills. For example: *"Show me the community skills for ARR analysis, then pull the
`arr-calculation` skill into this workspace."*

The pulled skill remains separate from this public library, so it can be tested and adapted
to the workspace's data model without changing the community source.

## Test safely before production

Do not pull or test a community skill directly on your production `main` branch. Before
asking Zoë to pull a skill, switch to a non-production branch or use a non-production
workspace. Test the skill there with representative data, review any changes it makes, and
use your normal pull-request and deployment process to promote it to production.

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
