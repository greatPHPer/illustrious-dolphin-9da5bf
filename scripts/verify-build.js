const fs = require("fs");
const required = [
  "_site/index.html",
  "_site/robots.txt",
  "_site/ads.txt",
  "_site/sitemap.xml",
  "_site/197-2/index.html",
  "_site/wp-content/themes/twentytwentyfive/assets/images/woman-splashing-water.webp"
];
const missing = required.filter(p => !fs.existsSync(p));
if (missing.length) {
  console.error("Build verification failed. Missing:");
  missing.forEach(p => console.error(" - " + p));
  process.exit(1);
}
console.log("Build verification passed:", required.length, "required outputs present.");
