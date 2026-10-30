/* 开源雷达 · 选型向导
   三个问题 → 三个建议。纯前端，数据在 window.RADAR_DATA 里。 */
(function () {
  "use strict";

  var D = window.RADAR_DATA;
  var body = document.getElementById("wiz-body");
  if (!D || !body) return;

  var stepEl = document.getElementById("wiz-step");
  var fillEl = document.getElementById("wiz-fill");

  // 每个选项：scenarios = 命中的场景；diff = 能接受的最大难度；budget = 预算档
  var QUESTIONS = [
    {
      key: "scene",
      title: "你现在最想解决的是哪件事？",
      hint: "选那个让你最烦的，别选听起来最高级的。",
      options: [
        { label: "做内容、涨粉、获客", sub: "写文案、剪视频、发邮件、看数据", scenes: ["content", "marketing"] },
        { label: "让公司内部更省事", sub: "文档、报表、审批、自动化", scenes: ["office", "data"] },
        { label: "接待客户、卖东西", sub: "客服、电商、订单", scenes: ["service", "ecommerce"] },
        { label: "自己搭 AI 能力", sub: "私有化 AI、知识库、模型", scenes: ["ai"] },
        { label: "我自己用，图方便", sub: "记账、笔记、照片、学习", scenes: ["design", "finance", "edu", "hr", "industry"] }
      ]
    },
    {
      key: "skill",
      title: "你的技术底子到哪一步？",
      hint: "诚实一点，选高的那档只会让你装到一半放弃。",
      options: [
        { label: "完全不会", sub: "最好点点鼠标就好", diff: 1 },
        { label: "会照命令复制粘贴", sub: "能开终端，但看不懂报错", diff: 3 },
        { label: "我是开发 / 有技术同事", sub: "改配置、看日志都没问题", diff: 5 }
      ]
    },
    {
      key: "budget",
      title: "你打算怎么花这笔钱？",
      hint: "这条决定我给你推免费方案还是有人兜底的方案。",
      options: [
        { label: "一分钱不想花", sub: "时间我有，钱没有", budget: "free" },
        { label: "每月几十块可以", sub: "买台服务器不算事", budget: "low" },
        { label: "愿意花钱买服务", sub: "几千块能接受，只要别让我折腾", budget: "service" }
      ]
    }
  ];

  var answers = {};

  function scoreItem(it) {
    var s = 0;
    var q1 = answers.scene;
    var q2 = answers.skill;

    if (q2) {
      if (it.d <= q2.options[q2.pick].diff) s += 2;
      else s -= 3;
    }
    if (it.v) s += 2;

    var $b = answers.budget && answers.budget.options[answers.budget.pick].budget;
    if ($b === "free") {
      if (it.lic === "ok") s += 1;
      if (it.d > 2) s -= 1;
    }
    if ($b === "service" && it.v) s += 3;
    if (it.lv === "A") s += 1;
    return s;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderStep(i) {
    var q = QUESTIONS[i];
    stepEl.textContent = (i + 1) + " / " + QUESTIONS.length;
    fillEl.style.width = ((i) / QUESTIONS.length * 100) + "%";

    var opts = q.options.map(function (o, k) {
      return '<button class="wiz-opt" data-k="' + k + '"><b>' + esc(o.label) + "</b><span>" + esc(o.sub) + "</span></button>";
    }).join("");

    body.innerHTML =
      '<h2 class="wiz-q">' + esc(q.title) + "</h2>" +
      '<p class="wiz-hint">' + esc(q.hint) + "</p>" +
      '<div class="wiz-opts">' + opts + "</div>";

    body.querySelectorAll(".wiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        answers[QUESTIONS[i].key] = { options: q.options, pick: Number(btn.dataset.k) };
        if (i + 1 < QUESTIONS.length) renderStep(i + 1);
        else renderResult();
      });
    });
  }

  function renderResult() {
    fillEl.style.width = "100%";
    stepEl.textContent = "结果";

    var scenes = answers.scene.options[answers.scene.pick].scenes;
    var inScene = D.items.filter(function (it) {
      return scenes.some(function (sc) {
        return ("," + it.s + ",").indexOf("," + sc + ",") >= 0;
      });
    });
    var ranked = inScene.map(function (it) {
      return { it: it, s: scoreItem(it) };
    }).sort(function (a, b) { return b.s - a.s || (b.it.v - a.it.v); });

    var top = ranked.slice(0, 3);
    var pb = D.playbooks.filter(function (p) { return scenes.indexOf(p.s) >= 0; })[0];

    var pbHtml = "";
    if (pb) {
      pbHtml =
        '<div class="wiz-pb">' +
        '<span class="pb-kicker">现成方案</span>' +
        '<h3><a href="' + pb.u + '">' + esc(pb.t) + "</a></h3>" +
        "<p>" + esc(pb.o) + "</p>" +
        '<a class="btn ghost" href="' + pb.u + '">看这个方案 →</a>' +
        "</div>";
    }

    var listHtml = top.map(function (x, i) {
      var it = x.it;
      var why = [];
      if (it.v) why.push("我实测过");
      if (it.lic === "ok") why.push("可商用");
      if (it.d <= 2) why.push("好上手");
      var lv = answers.skill && answers.skill.options[answers.skill.pick].diff;
      if (lv && it.d > lv) why.push("比你现在的水平难一点");
      return (
        '<a class="wiz-card" href="' + it.u + '">' +
        '<span class="wiz-num">' + (i + 1) + "</span>" +
        '<div><b>' + esc(it.t) + "</b><p>" + esc(it.o) + "</p>" +
        '<span class="wiz-why">' + why.join(" · ") + "</span></div></a>"
      );
    }).join("");

    if (!top.length) {
      listHtml =
        '<div class="note-empty"><b>这三类里我们收录得还很少。</b>' +
        "<p>坦白说，现在没有能放心推给你的。你可以去全部收录里翻翻，或者告诉我你具体要做什么。</p></div>";
    }

    var countHint = top.length >= 3
      ? "按你的回答排的。第一个最该先试，装完再回来看第二个。"
      : "这一类我们收录得还少，先给你这几个；剩下的等你告诉我具体要做什么，我再补。";

    body.innerHTML =
      '<h2 class="wiz-q">给你 ' + top.length + ' 个建议</h2>' +
      '<p class="wiz-hint">' + countHint + "</p>" +
      pbHtml +
      '<div class="wiz-list">' + listHtml + "</div>" +
      '<div class="wiz-actions">' +
      '<button class="btn ghost" id="wiz-redo">重新回答</button>' +
      '<a class="btn primary" href="../index.html">回目录自己挑</a>' +
      "</div>";

    var redo = document.getElementById("wiz-redo");
    if (redo) redo.addEventListener("click", function () {
      answers = {};
      // ?demo=1：自动选每道题的第一个选项，方便截图和检查结果页
  var demo = location.search.match(/[?&]demo=(\d)/);
  if (demo) {
    var pick = Math.max(0, Math.min(4, Number(demo[1]) - 1));
    QUESTIONS.forEach(function (q) {
      answers[q.key] = { options: q.options, pick: Math.min(pick, q.options.length - 1) };
    });
    renderResult();
  } else {
    renderStep(0);
  }
    });
  }

  // ?demo=1：自动选每道题的第一个选项，方便截图和检查结果页
  var demo = location.search.match(/[?&]demo=(\d)/);
  if (demo) {
    var pick = Math.max(0, Math.min(4, Number(demo[1]) - 1));
    QUESTIONS.forEach(function (q) {
      answers[q.key] = { options: q.options, pick: Math.min(pick, q.options.length - 1) };
    });
    renderResult();
  } else {
    renderStep(0);
  }
})();
