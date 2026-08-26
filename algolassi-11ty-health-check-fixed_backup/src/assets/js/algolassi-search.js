(function () {
  "use strict";

  var INDEX_URL = "/search-index.json";
  var indexCache = null;
  var loading = null;
  var initialized = false;
  var trackTimer = null;
  var weightsCache = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function isValidPage(item) {
    if (!item || !item.url || !item.title) return false;
    var url = String(item.url);
    if (url === "/search-index.json" || url === "/404.html") return false;
    if (/^\/(wp-content|wp-admin|wp-includes)(\/|$)/i.test(url)) return false;
    if (/\.(css|js|map|json|xml|txt|ico|png|jpe?g|gif|svg|webp|woff2?|ttf)(\?|#|$)/i.test(url)) return false;
    return /^\//.test(url);
  }

  function currentPath() {
    return location.pathname.replace(/\/+$/g, "") || "/";
  }

  async function getClient() {
    return window.AlgolassiSupabase || null;
  }

  async function getUser() {
    var sb = await getClient();
    if (!sb) return null;
    try {
      var result = await sb.auth.getSession();
      return result.data && result.data.session ? result.data.session.user : null;
    } catch (e) {
      return null;
    }
  }

  async function loadIndex() {
    if (indexCache) return indexCache;
    if (loading) return loading;

    loading = fetch(INDEX_URL, {
      credentials: "same-origin",
      cache: "no-store"
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Search index HTTP " + response.status);
        return response.json();
      })
      .then(function (items) {
        indexCache = Array.isArray(items) ? items.filter(isValidPage) : [];
        return indexCache;
      })
      .finally(function () {
        loading = null;
      });

    return loading;
  }

  async function getWeights(items) {
    if (weightsCache) return weightsCache;

    var sb = await getClient();
    var user = await getUser();
    var map = {};

    if (!sb || !user || !items.length) {
      weightsCache = map;
      return map;
    }

    try {
      var result = await sb.rpc("get_page_popularity", {
        p_page_paths: items.map(function (item) { return item.url; })
      });

      if (!result.error && Array.isArray(result.data)) {
        result.data.forEach(function (row) {
          map[row.page_path] = {
            personal: Number(row.personal_visit_count) || 0,
            global: Number(row.global_visit_count) || 0
          };
        });
      }
    } catch (e) {
      console.warn("Algolassi search weights:", e);
    }

    weightsCache = map;
    return map;
  }

  function searchCorpus(item) {
    return normalize([
      item.title,
      item.description,
      item.content
    ].join(" "));
  }

  function score(item, query, stats) {
    var title = normalize(item.title);
    var description = normalize(item.description);
    var content = normalize(item.content);
    var corpus = searchCorpus(item);
    var n = normalize(query);

    if (!n) {
      return Math.min(
        180,
        Math.log2((stats.personal || 0) + 1) * 32 +
        Math.log2((stats.global || 0) + 1) * 10
      );
    }

    var s = 0;

    if (title === n) s += 1200;
    if (title.indexOf(n) === 0) s += 650;
    if (title.indexOf(n) >= 0) s += 420;
    if (description.indexOf(n) >= 0) s += 140;
    if (content.indexOf(n) >= 0) s += 220;

    n.split(/\s+/).filter(Boolean).forEach(function (term) {
      if (title.indexOf(term) >= 0) s += 110;
      if (description.indexOf(term) >= 0) s += 30;
      if (content.indexOf(term) >= 0) s += 48;
    });

    if (corpus.indexOf(n) >= 0) s += 60;

    s += Math.min(260, Math.log2((stats.personal || 0) + 1) * 46);
    s += Math.min(120, Math.log2((stats.global || 0) + 1) * 18);

    return s;
  }

  function fontSize(scoreValue, maxScore, rank) {
    var ratio = maxScore > 0 ? scoreValue / maxScore : 0;
    return (1 + ratio * 0.52 + (rank < 3 ? 0.08 : 0)) * (rank === 0 ? 1.28 : 1);
  }

  function rankItems(items, query, weights) {
    var limit = query ? 15 : 25;

    return items
      .map(function (item) {
        var stats = weights[item.url] || { personal: 0, global: 0 };
        return {
          item: item,
          stats: stats,
          score: score(item, query, stats)
        };
      })
      .filter(function (entry) {
        return !query || entry.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score ||
          b.stats.personal - a.stats.personal ||
          b.stats.global - a.stats.global ||
          a.item.title.localeCompare(b.item.title);
      })
      .slice(0, limit);
  }

  function colorFor(scoreValue, maxScore, rank) {
    var ratio = maxScore ? scoreValue / maxScore : 0;
    if (rank === 0 || ratio > 0.82) return "#7c3aed";
    if (ratio > 0.62) return "#2563eb";
    if (ratio > 0.45) return "#059669";
    if (ratio > 0.28) return "#d97706";
    return "#475467";
  }

  function packCloudSafe(cloud, ranked) {
    var elements = ranked
      .map(function (entry) {
        return cloud.querySelector('[data-search-key="' + CSS.escape(entry.item.url) + '"]');
      })
      .filter(Boolean);

    var pad = 12;
    var gap = 12;
    var maxWidth = Math.max(240, cloud.clientWidth - pad * 2);
    var rows = [];
    var current = [];
    var used = 0;
    var rowHeight = 0;

    elements.forEach(function (element) {
      element.style.position = "absolute";
      element.style.whiteSpace = "normal";
      element.style.wordBreak = "break-word";
      element.style.maxWidth = maxWidth + "px";
      element.style.boxSizing = "border-box";
    });

    elements.forEach(function (element) {
      var width = Math.min(Math.ceil(element.offsetWidth || element.scrollWidth), maxWidth);
      var height = Math.ceil(element.offsetHeight || 32);

      if (current.length && used + width > maxWidth) {
        rows.push({ items: current, height: rowHeight });
        current = [];
        used = 0;
        rowHeight = 0;
      }

      current.push({ el: element, w: width, h: height });
      used += width + gap;
      rowHeight = Math.max(rowHeight, height);
    });

    if (current.length) rows.push({ items: current, height: rowHeight });

    var y = pad;
    rows.forEach(function (row) {
      var total = row.items.reduce(function (sum, record) {
        return sum + record.w;
      }, 0) + gap * (row.items.length - 1);
      var x = Math.max(pad, (maxWidth - total) / 2);

      row.items.forEach(function (record) {
        record.el.style.left = Math.round(x) + "px";
        record.el.style.top = Math.round(y) + "px";
        x += record.w + gap;
      });

      y += row.height + gap;
    });

    cloud.style.position = "relative";
    cloud.style.minHeight = Math.max(250, y + pad) + "px";
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightSnippet(text, query) {
    var safe = esc(text);
    var terms = normalize(query).split(/\s+/).filter(Boolean);

    if (!terms.length) return safe;

    terms.slice(0, 5).forEach(function (term) {
      var pattern = new RegExp("(" + escapeRegExp(term) + ")", "ig");
      safe = safe.replace(pattern, "<strong class=\"algolassi-search-match\">$1</strong>");
    });

    return safe;
  }

  function snippetFor(item, query) {
    var source = String(item.content || item.description || item.title || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!source) return "";

    var normalizedSource = normalize(source);
    var normalizedQuery = normalize(query);
    var position = normalizedSource.indexOf(normalizedQuery);

    if (position < 0) {
      var firstTerm = normalizedQuery.split(/\s+/).filter(Boolean)[0] || "";
      if (firstTerm) position = normalizedSource.indexOf(firstTerm);
    }

    if (position < 0) return source.slice(0, 150);

    var approximateStart = Math.max(0, position - 65);
    var approximateEnd = Math.min(source.length, approximateStart + 185);
    var snippet = source.slice(approximateStart, approximateEnd).trim();

    if (approximateStart > 0) snippet = "… " + snippet;
    if (approximateEnd < source.length) snippet += " …";

    return snippet;
  }

  function resultMarkup(entry, query) {
    var title = esc(entry.item.title);
    var count = entry.stats.personal > 0
      ? '<span class="algolassi-search-result-count">' + entry.stats.personal + "×</span>"
      : "";

    if (!query) {
      return '<span class="algolassi-search-result-title">' + title + count + "</span>";
    }

    var snippet = snippetFor(entry.item, query);
    var context = snippet
      ? '<span class="algolassi-search-result-context">↳ ' + highlightSnippet(snippet, query) + "</span>"
      : "";

    return '<span class="algolassi-search-result-title">' + title + count + "</span>" + context;
  }

  function animateCloud(panel, ranked, query) {
    var cloud = panel.querySelector(".algolassi-search-cloud");
    if (!cloud) {
      cloud = document.createElement("div");
      cloud.className = "algolassi-search-cloud";
      panel.appendChild(cloud);
    }

    var oldElements = {};
    Array.prototype.slice.call(
      cloud.querySelectorAll(".algolassi-search-result[data-search-key]")
    ).forEach(function (element) {
      oldElements[element.dataset.searchKey] = element;
    });

    var oldRects = {};
    Object.keys(oldElements).forEach(function (key) {
      var element = oldElements[key];
      element.style.transition = "none";
      element.style.transform = "none";
      oldRects[key] = element.getBoundingClientRect();
    });

    var nextKeys = {};
    ranked.forEach(function (entry) {
      nextKeys[entry.item.url] = true;
    });

    Object.keys(oldElements).forEach(function (key) {
      if (nextKeys[key]) return;
      var element = oldElements[key];
      element.style.opacity = "0";
      setTimeout(function () {
        if (element.parentNode) element.parentNode.removeChild(element);
      }, 180);
    });

    var maxScore = ranked[0] ? ranked[0].score : 1;

    ranked.forEach(function (entry, index) {
      var key = entry.item.url;
      var element = oldElements[key];

      if (!element) {
        element = document.createElement("a");
        element.className = "algolassi-search-result algolassi-search-result--entering";
        element.dataset.searchKey = key;
        cloud.appendChild(element);
      }

      element.href = entry.item.url;
      element.title = entry.item.title;

      var size = fontSize(entry.score, maxScore, index);
      var weight = entry.score > 700 ? 800 : entry.score > 450 ? 650 : entry.score > 250 ? 550 : 400;

      element.style.fontSize = size.toFixed(2) + "em";
      element.style.fontWeight = weight;
      element.style.color = colorFor(entry.score, maxScore, index);
      element.innerHTML = resultMarkup(entry, query);
    });

    requestAnimationFrame(function () {
      packCloudSafe(cloud, ranked);

      requestAnimationFrame(function () {
        ranked.forEach(function (entry) {
          var element = cloud.querySelector(
            '[data-search-key="' + CSS.escape(entry.item.url) + '"]'
          );
          if (!element) return;

          var first = oldRects[entry.item.url];
          var last = element.getBoundingClientRect();

          if (first) {
            var dx = first.left - last.left;
            var dy = first.top - last.top;

            element.style.transition =
              "transform .52s cubic-bezier(.22,1,.36,1)," +
              "font-size .42s cubic-bezier(.22,1,.36,1)," +
              "font-weight .36s ease,color .32s ease,opacity .4s ease";
            element.style.transform = "translate3d(" + dx + "px," + dy + "px,0)";
            void element.offsetWidth;

            requestAnimationFrame(function () {
              element.style.transform = "translate3d(0,0,0)";
            });
          } else {
            element.style.transition =
              "transform .48s cubic-bezier(.34,1.56,.64,1)," +
              "opacity .38s ease,filter .38s ease," +
              "font-size .42s cubic-bezier(.34,1.56,.64,1)," +
              "font-weight .36s ease,color .32s ease";
            element.style.transform = "scale(.15,1)";
            void element.offsetWidth;

            requestAnimationFrame(function () {
              element.style.transform = "scale(1)";
              element.style.opacity = "1";
              element.style.filter = "blur(0)";
            });
          }
        });
      });
    });
  }

  function render(panel, meta, items, query, weights) {
    var ranked = rankItems(items, query, weights);
    panel.hidden = false;
    meta.textContent = query
      ? ranked.length + " matching pages"
      : ranked.length + " popular pages";

    if (!ranked.length) {
      var emptyCloud = panel.querySelector(".algolassi-search-cloud");
      if (emptyCloud) emptyCloud.innerHTML = "";
      var emptyHint = panel.querySelector(".algolassi-search-hint");
      if (emptyHint) emptyHint.textContent = "No matching articles found.";
      return;
    }

    animateCloud(panel, ranked, query);

    var hint = panel.querySelector(".algolassi-search-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "algolassi-search-hint";
      panel.appendChild(hint);
    }

    hint.textContent = query
      ? "Searches article titles, headings, descriptions and full article text."
      : "Results prioritize your reading history and overall popularity.";
  }

  async function trackCurrentPage() {
    if (trackTimer) clearTimeout(trackTimer);

    trackTimer = setTimeout(async function () {
      var sb = await getClient();
      var user = await getUser();
      if (!sb || !user) return;

      try {
        var result = await sb.rpc("increment_page_visit", {
          p_page_path: currentPath()
        });
        if (result.error) throw result.error;
        weightsCache = null;
      } catch (e) {
        console.warn("Algolassi page visit tracking:", e);
      }
    }, 250);
  }

  async function init() {
    var root = document.getElementById("algolassi-home-search");
    if (!root) {
      initialized = false;
      return;
    }

    if (initialized && root.dataset.searchReady === "true") return;

    initialized = true;
    root.dataset.searchReady = "true";

    var input = root.querySelector(".algolassi-home-search-input");
    var panel = root.querySelector(".algolassi-search-panel");
    var meta = root.querySelector(".algolassi-search-meta");

    if (!input || !panel || !meta) return;

    var items = await loadIndex();
    var weights = await getWeights(items);

    function update() {
      render(panel, meta, items, input.value.trim(), weights);
    }

    update();
    input.addEventListener("input", update);
    input.addEventListener("focus", update);

    document.addEventListener("keydown", function (event) {
      if (
        event.key === "/" &&
        document.activeElement !== input &&
        !/input|textarea|select/i.test(document.activeElement.tagName)
      ) {
        event.preventDefault();
        input.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!root.contains(event.target)) panel.hidden = true;
    });

    trackCurrentPage();
  }

  window.AlgolassiSearchInit = init;

  window.addEventListener("algolassi:spa-navigation", function () {
    initialized = false;
    weightsCache = null;
    indexCache = null;
    requestAnimationFrame(init);
  });

  window.addEventListener("algolassi:auth-changed", function () {
    weightsCache = null;
    requestAnimationFrame(init);
    trackCurrentPage();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Chatbox hide/show control */
  (function () {
    var KEY = "algolassi-chat-hidden-v1";

    function setup() {
      var host = document.getElementById("algolassi-chat-presence-host");
      if (!host) return false;

      var card = host.querySelector(".algolassi-chat-presence-card");
      if (!card) return false;

      var head = card.querySelector(".algolassi-chat-presence-head");
      if (!head) return false;

      var button = head.querySelector(".algolassi-chat-hide");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "algolassi-chat-hide";
        button.textContent = "Hide";
        button.setAttribute("aria-label", "Hide chatbox");
        head.appendChild(button);
        button.addEventListener("click", function () {
          host.classList.add("algolassi-chat-is-hidden");
          try { localStorage.setItem(KEY, "1"); } catch (e) {}
        });
      }

      var show = document.getElementById("algolassi-chat-show");
      if (!show) {
        show = document.createElement("button");
        show.type = "button";
        show.id = "algolassi-chat-show";
        show.textContent = "💬 Chat";
        show.setAttribute("aria-label", "Show chatbox");
        document.body.appendChild(show);
        show.addEventListener("click", function () {
          host.classList.remove("algolassi-chat-is-hidden");
          try { localStorage.setItem(KEY, "0"); } catch (e) {}
        });
      }

      try {
        if (localStorage.getItem(KEY) === "1") host.classList.add("algolassi-chat-is-hidden");
      } catch (e) {}

      return true;
    }

    function watch() {
      if (setup()) return;
      var observer = new MutationObserver(function () {
        if (setup()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { observer.disconnect(); }, 15000);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", watch, { once: true });
    } else {
      watch();
    }
  })();
})();
