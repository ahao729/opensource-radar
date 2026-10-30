/* 开源雷达 · 前端交互：分级预览 + 搜索筛选 */
(function () {
  "use strict";

  var ORDER = ["guest", "follower", "member", "client"];
  var KEY = "radar.tier";
  var tier = localStorage.getItem(KEY) || "guest";
  var fromUrl = new URLSearchParams(location.search).get("tier");
  if (fromUrl && ORDER.indexOf(fromUrl) >= 0) tier = fromUrl;

  function applyTier() {
    document.body.dataset.tier = tier;
    document.querySelectorAll("[data-tier-btn]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.tierBtn === tier);
    });
    var cta = document.querySelector(".cta-row .primary");
    if (cta) cta.textContent = tier === "guest" ? "关注解锁完整内容"
      : tier === "follower" ? "升级会员看完整手册" : "查看会员权益";
    document.querySelectorAll(".gate").forEach(function (g) {
      var need = g.dataset.tier || "follower";
      var open = ORDER.indexOf(tier) >= ORDER.indexOf(need);
      g.dataset.open = open ? "1" : "0";
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tier-btn]");
    if (!b) return;
    tier = b.dataset.tierBtn;
    localStorage.setItem(KEY, tier);
    applyTier();

  // ── 收藏（存本机） ─────────────────────────
  var FAV_KEY = "radar.me";
  function favLoad() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "{}"); } catch (e) { return {}; }
  }
  function favSave(d) { localStorage.setItem(FAV_KEY, JSON.stringify(d)); }
  function favCount() {
    var b = document.getElementById("me-badge");
    if (!b) return;
    var n = Object.keys(favLoad()).length;
    b.textContent = n ? String(n) : "";
    b.hidden = !n;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fav]");
    if (!btn) return;
    var slug = btn.dataset.fav;
    var d = favLoad();
    if (d[slug]) {
      delete d[slug];
      btn.textContent = "☆ 收藏";
      btn.classList.remove("on");
    } else {
      d[slug] = { ts: Date.now(), status: "想装", name: btn.dataset.name || slug };
      btn.textContent = "★ 已收藏";
      btn.classList.add("on");
    }
    favSave(d);
    favCount();
  });
  favCount();
  document.querySelectorAll("[data-fav]").forEach(function (b) {
    if (favLoad()[b.dataset.fav]) {
      b.textContent = "★ 已收藏";
      b.classList.add("on");
    }
  });
  });

  applyTier();

  // ── 收藏（存本机） ─────────────────────────
  var FAV_KEY = "radar.me";
  function favLoad() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "{}"); } catch (e) { return {}; }
  }
  function favSave(d) { localStorage.setItem(FAV_KEY, JSON.stringify(d)); }
  function favCount() {
    var b = document.getElementById("me-badge");
    if (!b) return;
    var n = Object.keys(favLoad()).length;
    b.textContent = n ? String(n) : "";
    b.hidden = !n;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fav]");
    if (!btn) return;
    var slug = btn.dataset.fav;
    var d = favLoad();
    if (d[slug]) {
      delete d[slug];
      btn.textContent = "☆ 收藏";
      btn.classList.remove("on");
    } else {
      d[slug] = { ts: Date.now(), status: "想装", name: btn.dataset.name || slug };
      btn.textContent = "★ 已收藏";
      btn.classList.add("on");
    }
    favSave(d);
    favCount();
  });
  favCount();
  document.querySelectorAll("[data-fav]").forEach(function (b) {
    if (favLoad()[b.dataset.fav]) {
      b.textContent = "★ 已收藏";
      b.classList.add("on");
    }
  });

  // ── 命令复制按钮 ─────────────────────────────
  document.querySelectorAll(".step code").forEach(function (code) {
    var wrap = document.createElement("div");
    wrap.className = "code-wrap";
    code.parentNode.insertBefore(wrap, code);
    wrap.appendChild(code);

    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "复制";
    wrap.appendChild(btn);

    btn.addEventListener("click", function () {
      var text = code.textContent.trim();
      function done(ok) {
        btn.textContent = ok ? "已复制" : "复制失败";
        btn.classList.toggle("ok", ok);
        setTimeout(function () {
          btn.textContent = "复制";
          btn.classList.remove("ok");
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        done(ok);
      }
    });
  });

  // ── 首页搜索与筛选 ─────────────────────────────
  var input = document.getElementById("q");
  if (!input) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var empty = document.getElementById("empty");
  var state = { text: "", filter: "all" };

  function match(card) {
    var d = card.dataset;
    if (state.text) {
      var hay = (d.name || "").toLowerCase();
      if (hay.indexOf(state.text) === -1) return false;
    }
    if (state.filter === "ok" && d.lic !== "ok") return false;
    if (state.filter === "easy" && Number(d.diff || 99) > 2) return false;
    if (state.filter === "project" && d.type !== "project") return false;
    if (state.filter === "skill" && d.type !== "skill") return false;
    return true;
  }

  var countEl = document.getElementById("count");
  var moreBtn = document.getElementById("more-btn");
  var LIMIT = 24;
  var expanded = false;

  function render() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = match(c);
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
    if (countEl) countEl.textContent = shown ? "共 " + shown + " 个结果" : "";

    // 分页：超出 LIMIT 的先藏起来，点「显示更多」再放出来
    if (moreBtn) {
      var visibleIdx = 0;
      cards.forEach(function (c) {
        if (c.hidden) return;
        if (!expanded && visibleIdx >= LIMIT) c.hidden = true;
        visibleIdx++;
      });
      var left = Math.max(0, visibleIdx - (expanded ? visibleIdx : LIMIT));
      moreBtn.hidden = expanded || visibleIdx <= LIMIT;
      moreBtn.textContent = "显示更多（还有 " + left + " 个）";
    }
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      expanded = true;
      render();
    });
  }

  input.addEventListener("input", function () {
    state.text = input.value.trim().toLowerCase();
    render();
  });

  document.querySelectorAll(".filters .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.filter = chip.dataset.filter;
      document.querySelectorAll(".filters .chip").forEach(function (c) {
        c.classList.toggle("on", c === chip);
      });
      render();
    });
  });


  render();

  // ── 回到顶部 ────────────────────────────────
  var toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.type = "button";
  toTop.setAttribute("aria-label", "回到顶部");
  toTop.textContent = "↑";
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(toTop);
  window.addEventListener("scroll", function () {
    toTop.classList.toggle("show", window.scrollY > 700);
  }, { passive: true });
})();
