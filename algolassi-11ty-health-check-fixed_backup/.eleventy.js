module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy({
    "src/assets": "assets"
  });

  eleventyConfig.addPassthroughCopy({
    "src/wp-content": "wp-content"
  });

  eleventyConfig.addPassthroughCopy({
    "src/ads.txt": "ads.txt"
  });

  eleventyConfig.addPassthroughCopy({
    "src/robots.txt": "robots.txt"
  });

  eleventyConfig.addGlobalData(
    "currentYear",
    new Date().getFullYear()
  );

  eleventyConfig.addFilter("xmlEscape", function(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&apos;");
  });

  eleventyConfig.addFilter("date", function(value, format) {
    if (!value) return "";

    const d = new Date(value);

    if (format === "yyyy") {
      return String(d.getFullYear());
    }

    if (format === "dd LLLL yyyy") {
      return d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    }

    if (format === "r") {
      return d.toUTCString();
    }

    return d.toLocaleDateString("en-US");
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },

    templateFormats: ["html", "njk", "md"],

    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
