---
name: crit-mdx
description: Review an .mdx post in this repository with Crit. Crit renders only .md, so the review runs on a .md copy in the scratchpad while every fix goes into the .mdx and is copied over after each round. Use whenever the user asks for a crit review (/crit, "critでレビュー", "critレビューしたい") and the target is an .mdx file, such as a post's index.mdx.
---

# Crit review for .mdx posts

Crit renders a file as Markdown only when its name ends in `.md`; an `.mdx` file is shown as code. Posts in this repository are `index.mdx`, so the review runs on a copy. Follow the global `crit` skill for everything else (launching in the background, relaying the URL, reading comments, replying, starting the next round); this skill changes only which file Crit opens and where fixes go.

## Rules

- The `.mdx` file in the repository is the source of truth. Edit only it.
- The review copy is a byte-for-byte copy of the `.mdx`, so Crit's line numbers and anchors match the `.mdx` lines as they are.
- Put the copy in the scratchpad, never next to the post: an `index.md` beside `index.mdx` would be read by Astro as a second post.
- A symlink does not work: Crit resolves it, opens the `.mdx` target and shows it as code.

## Steps

1. Make the copy, named `index.md` so the review title matches the post:

   ```bash
   src=content/post/<year>/<slug>/index.mdx
   review=<scratchpad>/crit-mdx/<slug>
   mkdir -p "$review" && cp "$src" "$review/index.md"
   ```

2. If a Crit session for the `.mdx` itself is already open, stop it first: `crit stop "$src"`.

3. Launch Crit on the copy in the background, from the copy's directory, as the global `crit` skill says:

   ```bash
   cd "$review" && crit index.md
   ```

4. For each comment, locate the text in the `.mdx` (by the comment's quote or anchor; the line numbers are the same), fix it there with Edit, and reply to the comment as the global skill says.

5. Before starting the next round, copy the `.mdx` over the review copy again so Crit live-reloads the fixes:

   ```bash
   cp "$src" "$review/index.md"
   ```

   Never edit the copy directly. If it differs from the `.mdx` for another reason (the user edited the `.mdx` in an editor), the `.mdx` wins; copy it over.

6. When the review is approved, stop the daemon (`crit stop index.md` from `$review`) and leave the copy; the scratchpad is discarded with the session.
