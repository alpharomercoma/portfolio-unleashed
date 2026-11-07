---
name: site-content
description: Create, read, update, publish, or delete the site's content (talks, About page, research, selected work, projects, recommendations, gallery, awards, certifications) on alpharomer.com. Use whenever the user asks to add, change, hide, publish, reorder, or remove anything on those pages.
---

# Editing site content

Content lives in Upstash Redis behind the agent API. Change it only with
`pnpm agent` (`scripts/agent.mjs`). Don't write Redis directly, run the seed
scripts, or edit `data/*.seed.json` to change what the live site shows.

The CLI reads its token (`PORTFOLIO_AGENT_TOKEN`, the `claude` token with
read, write, publish, and delete) from `.env.local`, and talks to
`https://alpharomer.com` unless `PORTFOLIO_AGENT_URL` or `--url` says
otherwise. Changes go live on the real site within seconds.

If `pnpm` isn't on PATH: `export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"`.

## Resources

`talks` (id = slug), `about` (one document, no id), `research`, `selected-work`,
`projects`, `recommendations`, `gallery`, `certifications`, `awards`. No public
page shows awards or selected work any more; they stay editable. Student projects
stay hidden; scrapers and datasets take the `Data` category. A project with a
`finding` and `bars` gets a full feature, and the first of those opens the section.

A `research` entry shows its `finding` first; `bars` holds its chart rows as
`"Label = 42%"`, with a leading `*` on the row the finding is about. Copy these
numbers from the study and never estimate them.

A `talks` record is one deck, and /speaking lists one entry per record. Give every
deck its own record under the deck's own title, even when it reworks an earlier
talk; the API refuses a record whose events point at different decks. `events`
normally holds one session, and gets a second only when the same deck is given
again. Take dates and titles from the deck or the event's own page. Leave out what
you can't source: an empty `venue`, `audienceSize`, or `durationMinutes` isn't
shown. Check a Google deck is shared by link before linking it, or the embed shows
a sign-in wall. Covers go in `public/talks/covers/`, so a new one needs a deploy
before a record can point at it.

Before writing a resource for the first time, run `pnpm agent schema <resource>`
for the exact fields. Unknown fields are rejected.

## Commands

```bash
pnpm agent whoami                                   # token, scopes, rules
pnpm agent list talks                               # all records, with rev and live state
pnpm agent get talks my-talk                        # one record and its rev
pnpm agent get about

pnpm agent create projects --file /path/item.json   # saved hidden/draft
pnpm agent create talks --data '{"title":"…", …}'
pnpm agent patch projects my-item --set tagline="New text" --set 'tags:=["ai","ml"]'
pnpm agent patch about --file /path/patch.json
pnpm agent update talks my-talk --rev 7 --file /path/full.json   # full replace
pnpm agent publish talks my-talk                    # make it live
pnpm agent unpublish projects my-item               # hide it
pnpm agent reorder projects id-a id-b id-c          # every id, once
pnpm agent delete awards old-award --yes

pnpm agent history talks my-talk                    # previous versions
pnpm agent revert talks my-talk --to 3              # undo
pnpm agent audit --limit 20                         # recent changes
```

Add `--dry-run` to any write to validate it without saving. Add `--json` for
raw responses.

## How to work

- New records are created as a draft (talks) or hidden (items). If the user
  wants it on the site, `publish` it afterwards.
- Read before you write: `get` the record, then `patch` only the fields that
  change. `patch` fetches the current revision itself. A `412` means someone
  else changed it in between, so `get` it again and redo the change.
- Write JSON payloads to a file in the scratchpad and pass `--file`. Long
  `--data` strings break on quoting.
- A `422` lists every rejected field under `issues`. Fix those fields and retry.
  Images must be a `/public` path or an https URL on Vercel Blob or the Sanity
  CDN. Links must be http(s) or a site path. Text can't contain control
  characters.
- The last record of a section can't be deleted. Hide it with `unpublish`
  instead.
- If the user wants something undone, use `history` and then `revert`.
- `423 frozen` means the owner froze agent writes on `/admin/agents`. Tell the
  user; don't try to work around it.
- After a change, tell the user what changed, on which record, and its new rev.
