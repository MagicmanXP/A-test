# Subaru of the Day

A tiny app that shows the top-voted image posted to
[r/Subaru](https://www.reddit.com/r/Subaru/) in the last 24 hours.

## How it works

- A GitHub Actions workflow (`.github/workflows/update-subaru.yml`) runs
  once a day (and can be triggered manually). It calls
  `scripts/fetch-top-subaru.mjs`, which:
  1. Gets a short-lived OAuth token from Reddit (`client_credentials`
     grant — no user login required, just an API app registration).
  2. Fetches `r/Subaru`'s top posts of the day from `oauth.reddit.com`.
  3. Picks the first non-stickied, non-NSFW post that has an image
     (direct image links, `post_hint: image`, and image galleries are
     all supported) and writes it to `data/today.json`.
  4. Commits that file back to the repo.
- `index.html` is a static page with no build step. It just fetches
  `data/today.json` (same-origin, no CORS involved) and renders the
  image, title, score, comment count, and a link back to the post.

Fetching happens server-side (in the Action) rather than in the
visitor's browser. Reddit's public `www.reddit.com/*.json` endpoints
block anonymous requests from cloud/datacenter IPs (including browsers
making cross-origin calls in some cases and CI runners), which showed
up as CORS-style failures ("Load failed" in Safari) and outright `403
Blocked` responses. Going through the official OAuth API avoids that.

## One-time setup: Reddit API credentials

The workflow needs a free Reddit API app to authenticate:

1. Log into Reddit, go to <https://www.reddit.com/prefs/apps>.
2. Click **create app** (or **create another app**).
3. Fill in: name (e.g. `subaru-of-the-day`), type **script**,
   redirect uri `http://localhost:8080` (required but unused).
4. Click **create app**. Note the string under the app name (client
   ID) and the **secret** field.
5. In this repo: **Settings → Secrets and variables → Actions → New
   repository secret**, add:
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
6. Re-run the workflow (**Actions → Update Subaru of the Day → Run
   workflow**) to generate the first `data/today.json`.

Until these secrets are set, the page will show "Today's pick hasn't
been generated yet."

## Running it locally

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`. (`data/today.json` needs to exist
already — run `REDDIT_CLIENT_ID=... REDDIT_CLIENT_SECRET=... node
scripts/fetch-top-subaru.mjs` first, or wait for the Action to commit
one.)

## Hosting it "for real"

It's a static site — host it for free on GitHub Pages, Netlify,
Vercel, etc. The daily refresh is handled entirely by the scheduled
Action, so hosting just needs to serve the two static files
(`index.html` and `data/today.json`).

## Notes / limitations

- If r/Subaru's top post of the day happens to be text-only or a
  video, the app falls back to the next-highest-scoring image post.
- The scheduled (cron) trigger only fires for workflow files that live
  on the repository's **default branch** — a workflow on a feature
  branch only runs via manual dispatch until it's merged.
