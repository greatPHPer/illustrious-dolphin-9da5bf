# Algolassi — Eleventy migration

This project was generated from the supplied WordPress filesystem ZIP and WordPress WXR export.

## Run locally

```bash
npm install
npm run build
npm start
```

The generated static site is in `_site/`.

## What was migrated

- 40 published WordPress pages
- 19 published WordPress posts
- WordPress uploads from `wp-content/uploads`
- `ads.txt`
- Existing internal links rewritten to local paths
- Category and tag archive pages generated from the exported posts
- Original WordPress permalink paths are used where they were available in the export

## Static-site differences

WordPress-only shortcodes such as Revolution Slider cannot execute in a static Eleventy build. The old slider shortcode was removed from the home-page content and the home page was given a lightweight static hero.

The WordPress database is not needed by the generated site.
