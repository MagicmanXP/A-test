import fs from "node:fs/promises";

const SUBREDDIT = "Subaru";
const USER_AGENT = "web:subaru-of-the-day:v1.0 (by /u/subaru_of_the_day_bot)";
const OUTPUT_PATH = "data/today.json";

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function isDirectImageUrl(url) {
  return /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url);
}

function extractImageUrl(post) {
  if (post.is_video) return null;

  if (post.post_hint === "image" && post.url) {
    return post.url;
  }

  if (isDirectImageUrl(post.url || "")) {
    return post.url;
  }

  if (post.is_gallery && post.media_metadata) {
    const firstItemId =
      post.gallery_data?.items?.[0]?.media_id ?? Object.keys(post.media_metadata)[0];
    const meta = post.media_metadata[firstItemId];
    if (meta?.s?.u) return decodeHtml(meta.s.u);
  }

  if (post.preview?.images?.[0]?.source?.url) {
    return decodeHtml(post.preview.images[0].source.url);
  }

  return null;
}

function findTopImagePost(children) {
  for (const child of children) {
    const post = child.data;
    if (!post || post.stickied || post.over_18) continue;
    const imageUrl = extractImageUrl(post);
    if (imageUrl) {
      return {
        title: post.title,
        author: post.author,
        score: post.score,
        numComments: post.num_comments,
        permalink: `https://www.reddit.com${post.permalink}`,
        imageUrl,
        createdUtc: post.created_utc
      };
    }
  }
  return null;
}

async function main() {
  const url = `https://www.reddit.com/r/${SUBREDDIT}/top/.json?t=day&limit=50`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error(`Reddit responded with ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const children = json?.data?.children ?? [];
  const post = findTopImagePost(children);

  if (!post) {
    throw new Error("No suitable image posts found in today's top listing");
  }

  const output = { ...post, fetchedAt: new Date().toISOString() };

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");

  console.log(`Wrote ${OUTPUT_PATH}:`, output.title);
}

main().catch((err) => {
  console.error("Failed to update Subaru of the Day:", err.message);
  process.exit(1);
});
