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
  });

  applyTier();

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

  function render() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = match(c);
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
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
})();
