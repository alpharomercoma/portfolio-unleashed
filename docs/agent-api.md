# Agent API

AI agents manage the site's content (talks, the seven homepage and gallery sections,
and the About page) through a bearer-token HTTP API at `/api/agent/v1`, or the
`pnpm agent` CLI that wraps it. Nothing reaches Redis except through the same
validated, revisioned writer the admin dashboard uses, so every change is
checked, attributed, kept in history, and revertable.

## Setup

1. Mint one token per agent (offline; nothing is sent anywhere):

   ```bash
   pnpm agent token mint --name codex --scopes read,write
   pnpm agent token mint --name release-bot --scopes publish --resources talks --expires 2027-01-01T00:00:00Z
   ```

   It prints the token (give it to the agent; it is never stored) and an entry
   for `AGENT_TOKENS`.

2. Put the entries in one JSON array in the `AGENT_TOKENS` env var (Vercel →
   Settings → Environment Variables) and redeploy:

   ```json
   [{ "name": "codex", "hash": "sha256:…", "scopes": ["read", "write"] }]
   ```

   Only the SHA-256 of each token is configured. If the array is malformed, the
   API refuses every request (503) rather than guessing. Without `AGENT_TOKENS`
   the API is off (501).

3. Give the agent `PORTFOLIO_AGENT_TOKEN=pfa_…` and, for anything other than
   production, `PORTFOLIO_AGENT_URL`. The CLI also reads these two keys (and
   nothing else) from `.env.local`.

### Claude Code

Claude Code edits content through the project skill
`.claude/skills/site-content`, which drives `pnpm agent`. Give it a
`claude` token with every scope, saved as `PORTFOLIO_AGENT_TOKEN` in
`.env.local`:

```bash
pnpm agent token mint --name claude --scopes read,write,publish,delete
```

To revoke a token, remove its entry and redeploy. To stop all agent writes
immediately, use **Freeze all agent writes** on `/admin/agents` (or set
`AGENT_API_READ_ONLY=1`).

## Scopes and guardrails

| Scope     | Allows                                                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read`    | Every GET. Implied by all other scopes.                                                                                                                    |
| `write`   | Create and edit records that are **not live** before and after the change: draft talks, hidden items. New records are drafts/hidden by default.            |
| `publish` | Any change that touches the live site: publishing or unpublishing, hiding or unhiding, editing anything live, the About page, reordering. Implies `write`. |
| `delete`  | Deleting. Deleting a live record also needs `publish`.                                                                                                     |

Optional per token: `resources` (e.g. `["talks","about"]`; default all) and
`expiresAt`.

Other guardrails:

- **Revisions.** Every record has a revision (`rev`, also the `ETag`). Changes
  to existing records need `If-Match: "<rev>"` from your last read; a stale
  revision gets `412`, a missing one `428`. The check and the write are one
  atomic Redis script, so two agents (or an agent and the owner) can't
  overwrite each other.
- **History.** The last 25 versions of every record are kept.
  `GET …/history` lists them; `POST …/revert {"rev": n}` restores one. Agents
  can only restore versions that pass today's input rules.
- **Strict input.** Unknown fields, and fields the server manages (`createdAt`,
  `updatedAt`, `order`), are rejected (`422` with per-field `issues`). Text may
  not contain control or bidirectional-override characters. Links must be
  `https://…`/`http://…` or a site path like `/speaking`. Images must be a
  `/public` path or an `https` URL on an image host the site can render
  (Vercel Blob, Sanity CDN). The About markdown may not contain raw HTML,
  unsafe links, or deeply nested quotes/lists.
- **Limits.** 256 KiB per request, 60 writes and 300 reads per minute per
  token, 500 records per section. The last record of a section can't be
  deleted: an empty section makes the site fall back to the committed seed.
- **Dry runs.** Add `?dryRun=1` to any write. You get full validation,
  permission checks, and the would-be result, and nothing is saved.
- **Oversight.** `/admin/agents` lists every change (who, what, which fields,
  from where) with one-click revert. Changes to live content email the owner.

## Endpoints

All paths are under `/api/agent/v1`. Resources: `talks`, `about`, `research`,
`selected-work`, `projects`, `recommendations`, `gallery`, `awards`,
`certifications`. Awards and selected work stay editable, but no public page shows them.

A `talks` record is one deck, and `/speaking` lists one entry per record. `events`
says where that deck was given, usually once. A record whose events point at
different decks is refused: give the other deck its own talk.

| Method & path                  | Does                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| `GET /`                        | Your token's scopes, the rules, and a JSON Schema per resource |
| `GET /_audit?limit=50`         | Recent changes to resources you can access                     |
| `GET /{resource}`              | Every record with `rev`, `live`, `updatedBy`                   |
| `POST /{resource}`             | Create (id/slug derived from the title unless given)           |
| `GET /{resource}/{id}`         | One record                                                     |
| `PUT /{resource}/{id}`         | Replace (draft/hidden state kept unless sent)                  |
| `PATCH /{resource}/{id}`       | Merge patch; `null` resets a field to its default              |
| `DELETE /{resource}/{id}`      | Delete                                                         |
| `GET /{resource}/{id}/history` | Previous versions                                              |
| `POST /{resource}/{id}/revert` | `{"rev": n}`                                                   |
| `POST /{resource}/_order`      | `{"ids": [...], "revs": {"id": rev}}`; every item, once        |
| `GET, PUT, PATCH /about`       | The About page (also `/about/history`, `/about/revert`)        |

Errors are JSON: `{"error": {"code", "message", ...}, "requestId"}`.

## CLI

```bash
export PORTFOLIO_AGENT_TOKEN=pfa_…
pnpm agent whoami
pnpm agent list talks
pnpm agent create talks --file talk.json          # saved as a draft
pnpm agent patch talks my-talk --set tagline="New tagline" --set 'tags:=["ai","ml"]'
pnpm agent publish talks my-talk                  # needs publish
pnpm agent patch about --set title="About me" --dry-run
pnpm agent history talks my-talk
pnpm agent revert talks my-talk --to 3
pnpm agent reorder projects first-id second-id …
pnpm agent help
```

The CLI reads the token from the environment, `.env.local`, or
`--token-file` (never from arguments), refuses to send it over plain HTTP except to localhost, and never
follows redirects.

## Testing

```bash
docker network create agenttest
docker run -d --rm --name agent-redis --network agenttest redis:7-alpine
docker run -d --rm --name agent-srh --network agenttest -p 8079:80 \
  -e SRH_MODE=env -e SRH_TOKEN=test_token \
  -e SRH_CONNECTION_STRING=redis://agent-redis:6379 \
  hiett/serverless-redis-http:latest
pnpm test
```

The suites run against that local Redis through an Upstash-compatible proxy,
and refuse to run against anything that isn't localhost (they flush the
database). `test/fuzz` holds the fast-check property tests: URL, image, text
and markdown guards; token parsing; and the HTTP API, where random request
sequences check that tokens without `publish` never change what the site
shows.
