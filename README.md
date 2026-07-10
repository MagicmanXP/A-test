# Subaru of the Day

A single-page static app that shows the top-voted image posted to
[r/Subaru](https://www.reddit.com/r/Subaru/) in the last 24 hours.

## How it works

`index.html` is fully self-contained (HTML/CSS/JS, no build step, no
backend). On load it calls Reddit's public JSON endpoint:

```
https://www.reddit.com/r/Subaru/top/.json?t=day&limit=50
```

It walks the results (already sorted by score) and picks the first
non-stickied, non-NSFW post that has an image (direct image links,
`post_hint: image`, and image galleries are all supported), then
displays the image, title, score, comment count, and a link back to
the Reddit post.

The result is cached in `localStorage` per calendar day, so reopening
the page later the same day won't re-hit Reddit — click **Refresh** to
force a new fetch.

## Running it

No dependencies, no server required. Just open `index.html` in a
browser, or serve the folder with any static file server, e.g.:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Hosting it "for real"

Since it's just a static file, it can be hosted for free on GitHub
Pages, Netlify, Vercel, etc. — point them at this repo/branch and
serve `index.html`. Because the "daily" logic runs client-side (the
page always fetches the current top post of the day whenever it's
opened), there's no cron job or server needed for it to stay fresh.

## Notes / limitations

- Relies on Reddit's public JSON API being reachable without
  authentication from the browser (no API key required). If Reddit
  changes CORS behavior or rate-limits anonymous requests, the page
  will show a "Try again" error state.
- If r/Subaru's top post of the day happens to be text-only or a
  video, the app falls back to the next-highest-scoring image post.
