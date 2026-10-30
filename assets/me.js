/* 我的工作台：全部数据存在本机 localStorage */
(function () {
  "use strict";
  var KEY = "radar.me";
  var IDX = window.RADAR_INDEX || {};
  var list = document.getElementById("me-list");
  if (!list) return;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; }
  }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var STATUS = ["想装", "装好了", "卡住了"];

  function render() {
    var d = load();
    var keys = Object.keys(d).sort(function (a, b) { return (d[b].ts || 0) - (d[a].ts || 0); });
    document.getElementById("me-empty").hidden = keys.length > 0;
    var block = document.getElementById("me-list-block");
    if (block) block.hidden = keys.length === 0;
    document.getElementById("me-count").textContent =
      keys.length ? "共 " + keys.length + " 个。按最近收藏排序。" : "";

    list.innerHTML = keys.map(function (slug) {
      var it = IDX[slug] || { n: slug, u: "#", l: "unknown", d: 3, v: 0 };
      var st = d[slug].status || "想装";
      var opts = STATUS.map(function (s) {
        return '<button class="chip' + (s === st ? " on" : "") + '" data-st="' + s + '" data-slug="' + slug + '">' + s + "</button>";
      }).join("");
      return '<div class="me-item" data-slug="' + slug + '">' +
        '<div class="me-head"><a href="' + it.u + '"><b>' + esc(it.n) + "</b></a>" +
        '<span class="badge ' + it.l + '">' + (it.l === "ok" ? "可商用" : it.l === "limited" ? "有条件" : it.l === "forbidden" ? "不可商用" : "待裁定") + "</span>" +
        (it.v ? '<span class="badge done">✓ 已实测</span>' : "") +
        "</div>" +
        '<div class="me-row">' + opts + "</div>" +
        '<textarea class="me-note" rows="2" placeholder="记一笔：装到哪一步、卡在哪、自己改了什么…">' + esc(d[slug].note || "") + "</textarea>" +
        '<button class="me-del" data-del="' + slug + '">移除</button>' +
        "</div>";
    }).join("");

    list.querySelectorAll("[data-st]").forEach(function (b) {
      b.addEventListener("click", function () {
        var d2 = load();
        d2[b.dataset.slug] = d2[b.dataset.slug] || {};
        d2[b.dataset.slug].status = b.dataset.st;
        save(d2); render();
      });
    });
    list.querySelectorAll(".me-note").forEach(function (t) {
      var timer;
      t.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var d2 = load();
          var slug = t.closest(".me-item").dataset.slug;
          d2[slug] = d2[slug] || {};
          d2[slug].note = t.value;
          save(d2);
        }, 400);
      });
    });
    list.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var d2 = load();
        delete d2[b.dataset.del];
        save(d2); render();
      });
    });
  }

  document.getElementById("me-export").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(load(), null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "radar-me.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("me-clear").addEventListener("click", function () {
    if (confirm("确定清空全部收藏和笔记？这个操作不能撤销。")) {
      localStorage.removeItem(KEY);
      render();
    }
  });

  render();
})();
