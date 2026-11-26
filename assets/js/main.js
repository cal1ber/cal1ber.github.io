(function () {
  "use strict";

  var intro = document.getElementById("intro");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var forced = /[?&]intro=1\b/.test(location.search);
  var seen = false;
  try { seen = sessionStorage.getItem("introSeen") === "1"; } catch (e) {}
  try { if (sessionStorage.getItem("pt") === "1") seen = true; } catch (e) {}

  var timers = [];
  var finished = false;
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function finish() {
    if (finished || !intro) return;
    finished = true;
    timers.forEach(clearTimeout);
    try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}
    intro.classList.add("done");
    document.body.classList.remove("intro-running");
    setTimeout(function () { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); }, 1800);
    document.removeEventListener("keydown", finish);
  }

  function runBoot() {
    var stage = intro.querySelector(".glitch-stage");
    if (stage) stage.remove();
    var boot = document.createElement("div");
    boot.className = "boot";
    boot.setAttribute("aria-hidden", "true");
    intro.insertBefore(boot, intro.querySelector(".skip"));

    var lines = [
      ["dim", "[    0.000000] Booting offsec kernel ..."],
      ["ok", "[  OK  ] Mounted /home/cal1ber"],
      ["ok", "[  OK  ] Reached target Network (tun0 up)"],
      ["ok", "[  OK  ] Loaded " + (window.WRITEUPS ? window.WRITEUPS.length : 0) + " writeups"],
      ["ok", "[  OK  ] Loaded certifications"],
      ["warn", "[ WAIT ] Next certification: in progress"],
      ["ok", "[  OK  ] Started portfolio.service"],
      ["", ""],
      ["", "cal1ber@kali:~$ ./portfolio --open"]
    ];
    var i = 0;
    function next() {
      if (finished) return;
      if (i >= lines.length) {
        boot.insertAdjacentHTML("beforeend", '<span class="cursor"></span>');
        later(finish, 900);
        return;
      }
      var l = lines[i++];
      var row = document.createElement("div");
      if (l[0]) row.className = l[0];
      boot.appendChild(row);
      if (i === lines.length) {
        var txt = l[1], c = 0;
        (function type() {
          if (finished) return;
          row.textContent = txt.slice(0, ++c);
          if (c < txt.length) later(type, 28); else later(next, 200);
        })();
      } else {
        row.textContent = l[1] || " ";
        later(next, 170 + Math.random() * 120);
      }
    }
    next();
  }

  if (intro) {
    if (reduce || (seen && !forced)) {
      intro.remove();
    } else {
      document.body.classList.add("intro-running");
      intro.querySelector(".skip").addEventListener("click", finish);
      intro.addEventListener("click", finish);
      document.addEventListener("keydown", finish);
      later(runBoot, 1500);
    }
  }

  var list = document.getElementById("frames");
  var data = window.WRITEUPS || [];
  var count = document.getElementById("wu-count");
  if (count) count.textContent = data.length + " boxes pwned";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function hex(n) { return "0x" + n.toString(16).toUpperCase().padStart(2, "0"); }

  var LV = { easy: 1, medium: 2, hard: 3, insane: 4 };
  var PAGE = 5;
  var state = { filter: "all", q: "", limit: PAGE };

  data = data.map(function (w, i) { w._i = i; return w; })
             .sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || a._i - b._i; });

  var listed = data.slice().sort(function (a, b) { return (LV[b.level] || 0) - (LV[a.level] || 0) || a._i - b._i; });
  function matches(w) {
    var f = state.filter;
    if (f !== "all" && w.tracks.indexOf(f) === -1 && w.platform.toLowerCase() !== f) return false;
    if (!state.q) return true;
    var hay = [w.name, w.tech, w.summary, w.platform, w.os, w.level].concat(w.tags || [], w.chain || [], (w.findings || []).map(function (f) { return f.title; })).join(" ").toLowerCase();
    return state.q.split(/\s+/).every(function (t) { return hay.indexOf(t) !== -1; });
  }

  var SEV = ["critical", "high", "medium", "low", "info"];
  function topSev(w) {
    var best = 4;
    (w.findings || []).forEach(function (f) { var k = SEV.indexOf(f.sev); if (k !== -1 && k < best) best = k; });
    return SEV[best];
  }
  function reportHtml(w) {
    var risk = topSev(w);
    return '<div class="rpt">' +
      '<div class="rpt-head"><span>// assessment report · ' + esc(w.date) + '</span>' +
        '<span class="rpt-risk sev-' + risk + '">overall risk: ' + risk + '</span></div>' +
      '<h4 class="rpt-k">executive summary</h4>' +
      '<p class="summary">' + esc(w.summary) + '</p>' +
      '<h4 class="rpt-k">findings</h4>' +
      '<div class="rpt-findings">' + w.findings.map(function (f, i) {
        return '<div class="rpt-f">' +
          '<span class="rpt-id">F-' + String(i + 1).padStart(2, "0") + '</span>' +
          '<span class="rpt-sev sev-' + esc(f.sev) + '">' + esc(f.sev) + '</span>' +
          '<span class="rpt-title">' + esc(f.title) + '<small>' + esc(f.impact) + '</small></span>' +
          '<span class="rpt-fix"><b>fix&gt;</b>' + esc(f.fix) + '</span>' +
        '</div>';
      }).join("") + '</div>' +
      '<h4 class="rpt-k">attack path</h4>' +
      '<ol class="killchain">' + w.chain.map(function (st, i) {
        return '<li><span class="node">' + String(i + 1).padStart(2, "0") + '</span><span class="step">' + esc(st) + '</span></li>';
      }).join("") + '</ol>' +
      '<h4 class="rpt-k">lesson learned</h4>' +
      '<div class="lesson"><b>lesson&gt;</b>' + esc(w.lesson) + '</div>' +
    '</div>';
  }
  function rowHtml(w) {
    var html = "";
      var idx = w._i;
    var id = "wu-" + idx, lv = LV[w.level] || 1, bars = "";
          for (var i = 1; i <= 4; i++) bars += '<i class="' + (i <= lv ? "on" : "") + '"></i>';
    html +=
      '<article class="wu lvl-' + esc(w.level) + '">' +
        '<button class="wu-head" type="button" aria-expanded="false" aria-controls="' + id + '">' +
          '<span class="caret" aria-hidden="true">&gt;</span>' +
          '<span class="wu-main">' +
            '<span class="wu-name">' + esc(w.name) + '</span>' +
            '<span class="wu-tech">' + esc(w.tech) + '</span>' +
          '</span>' +
          '<span class="wu-side">' +
            '<span class="wu-plat">' + esc(w.platform) + ' · ' + esc(w.os) + '</span>' +
            '<span class="wu-diff" title="' + esc(w.level) + '"><span class="bars" aria-hidden="true">' + bars + '</span><span class="lv">' + esc(w.level) + '</span></span>' +
            '<span class="wu-state">' + esc(w.state) + '</span>' +
          '</span>' +
        '</button>' +
        '<div class="wu-body" id="' + id + '"><div class="wu-inner">' + (w.findings ? reportHtml(w) : (
          '<p class="summary">' + esc(w.summary) + '</p>' +
          '<ol class="killchain">' + w.chain.map(function (st, i) {
            return '<li><span class="node">' + String(i + 1).padStart(2, "0") + '</span><span class="step">' + esc(st) + '</span></li>';
          }).join("") + '</ol>' +
          '<div class="lesson"><b>lesson&gt;</b>' + esc(w.lesson) + '</div>')) +
          '<div class="tags">' + w.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join("") + '</div>' +
        '</div></div>' +
      '</article>';
    return html;
  }

  function sevCount(w) {
    var n = {};
    w.findings.forEach(function (f) { n[f.sev] = (n[f.sev] || 0) + 1; });
    return SEV.filter(function (k) { return n[k]; }).map(function (k) { return '<span class="sev-' + k + '">' + n[k] + ' ' + k + '</span>'; }).join("");
  }

  function cardHtml(w) {
    var lv = LV[w.level] || 1, bars = "";
    for (var i = 1; i <= 4; i++) bars += '<i class="' + (i <= lv ? "on" : "") + '"></i>';
    return '<a class="fcard lvl-' + esc(w.level) + '" href="writeups/#wu-' + w._i + '">' +
      '<span class="fc-top"><span class="fc-badge">' + esc(w.platform) + '</span><span class="fc-os">' + esc(w.os) + '</span>' +
        '<span class="fc-state">' + esc(w.state) + '</span></span>' +
      '<span class="fc-name">' + esc(w.name) + '</span>' +
      '<span class="fc-sum">' + esc(w.summary) + '</span>' +
      (w.findings ? '<span class="fc-find">' + sevCount(w) + '</span>'
        : '<span class="fc-chain">' + w.chain.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('<i aria-hidden="true">›</i>') + '</span>') +
      '<span class="fc-foot"><span class="wu-diff"><span class="bars" aria-hidden="true">' + bars + '</span><span class="lv">' + esc(w.level) + '</span></span>' +
        '<span class="fc-read">read writeup <b aria-hidden="true">→</b></span></span>' +
    '</a>';
  }

  function render() {
    if (!list) return;
    var html = "";
    var hits = listed.filter(matches);
    var visible = hits.slice(0, state.limit);
    var shown = visible.length;
    visible.forEach(function (w) { html += rowHtml(w); });
    if (!shown) html = '<div class="empty">// grep: no match</div>';
    list.innerHTML = html;
    var more = document.getElementById("wu-more");
    if (more) {
      var m = '<span class="dim">showing ' + shown + ' of ' + hits.length + '</span>';
      if (hits.length > shown) m += '<button type="button" class="btn wu-load" data-act="more">load ' + Math.min(PAGE, hits.length - shown) + ' more</button>';
      else if (state.limit > PAGE && hits.length > PAGE) m += '<button type="button" class="btn wu-load" data-act="less">show less</button>';
      more.innerHTML = hits.length ? m : "";
    }

    if (window.__reveal) list.querySelectorAll(".wu").forEach(window.__reveal);
  }

  var featured = document.getElementById("wu-featured");
  if (featured) {
    var pins = listed.filter(function (w) { return w.pinned; });
    if (!pins.length) pins = listed.slice(0, 3);
    featured.innerHTML = pins.map(cardHtml).join("");
    var allLink = document.getElementById("wu-all-count");
    if (allLink) allLink.textContent = data.length + " boxes";
  }

  var stats = document.getElementById("wu-stats");
  if (stats) {
    var c = function (fn) { return data.filter(fn).length; };
    var lvls = ["easy", "medium", "hard", "insane"].map(function (l) { return [l, c(function (w) { return w.level === l; })]; }).filter(function (x) { return x[1]; });
    stats.innerHTML =
      '<span><b>' + data.length + '</b> boxes</span>' +
      '<span><b>' + c(function (w) { return w.tracks.indexOf("ad") !== -1; }) + '</b> active directory</span>' +
      '<span><b>' + c(function (w) { return w.platform === "HTB"; }) + '</b> htb</span>' +
      '<span><b>' + c(function (w) { return w.platform === "THM"; }) + '</b> thm</span>' +
      '<span class="lvlbar" aria-label="difficulty breakdown">' + lvls.map(function (x) {
        return '<i class="lvl-' + x[0] + '" data-n="' + x[1] + '" title="' + x[0] + ': ' + x[1] + '"></i>';
      }).join("") + '</span>' +
      '<span class="lvl-legend">' + lvls.map(function (x) { return '<span class="lvl-' + x[0] + '">' + x[0] + ' ' + x[1] + '</span>'; }).join("") + '</span>';
    stats.querySelectorAll(".lvlbar i").forEach(function (i) { i.style.flex = i.getAttribute("data-n"); });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".wu-head");
    if (!btn) return;
    var open = btn.parentNode.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  if (list) {
    var hm = /^#wu-(\d+)$/.exec(location.hash);
    if (hm) {
      var pos = listed.filter(matches).map(function (w) { return w._i; }).indexOf(+hm[1]);
      if (pos >= state.limit) state.limit = Math.ceil((pos + 1) / PAGE) * PAGE;
    }
    render();
    if (hm) {
      var body = document.getElementById("wu-" + hm[1]);
      if (body) {
        var art = body.parentNode, head = art.querySelector(".wu-head");
        art.classList.add("open", "flash"); head.setAttribute("aria-expanded", "true");
        setTimeout(function () { art.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 250);
      }
    }
    var more = document.getElementById("wu-more");
    if (more) more.addEventListener("click", function (e) {
      var b = e.target.closest(".wu-load"); if (!b) return;
      if (b.getAttribute("data-act") === "more") state.limit += PAGE;
      else { state.limit = PAGE; document.getElementById("writeups").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
      render();
    });
    var search = document.getElementById("wu-search");
    if (search) search.addEventListener("input", function () {
      state.q = search.value.trim().toLowerCase(); state.limit = PAGE; render();
    });
    document.querySelectorAll(".filter[data-filter]").forEach(function (f) {
      f.addEventListener("click", function () {
        document.querySelectorAll(".filter[data-filter]").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        f.setAttribute("aria-pressed", "true");
        state.filter = f.getAttribute("data-filter"); state.limit = PAGE; render();
      });
    });
  }

  var mail = document.getElementById("mail"), pick = document.getElementById("mail-pick");
  if (mail) {
    var u = "ShouldITrustYou", d = "proton.me";
    var sendMail = function () { location.href = "mailto:" + u + "@" + d + "?subject=" + encodeURIComponent("Hello from your portfolio"); };
    if (!pick) {
      mail.addEventListener("click", function (e) { e.preventDefault(); sendMail(); });
    } else {

      var pgp = document.getElementById("mp-pgp"), pgpBtn = pick.querySelector('[data-mail="pgp"]');
      var addrEl = document.getElementById("mail-addr"), copyBtn = pick.querySelector('[data-mail="copy"]'), copyTimer;
      var selectAddr = function () { var r = document.createRange(); r.selectNodeContents(addrEl); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); };
      var copyAddr = function () {
        var done = function (msg) { copyBtn.textContent = msg; copyBtn.classList.add("ok"); clearTimeout(copyTimer); copyTimer = setTimeout(function () { copyBtn.textContent = "copy"; copyBtn.classList.remove("ok"); }, 2000); };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(u + "@" + d).then(function () { done("copied ✓"); }, function () { selectAddr(); done("press Ctrl+C"); });
        } else { selectAddr(); done("press Ctrl+C"); }
      };
      var setOpen = function (panel, btn, open) {
        panel.classList.toggle("open", open);
        panel.setAttribute("aria-hidden", open ? "false" : "true");
        panel.inert = !open;
        if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
      };
      mail.addEventListener("click", function (e) {
        e.preventDefault();
        var open = !pick.classList.contains("open");
        if (open && addrEl && !addrEl.textContent) addrEl.textContent = u + "@" + d;
        setOpen(pick, mail, open);
        if (!open && pgp) setOpen(pgp, pgpBtn, false);
      });
      pick.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("[data-mail]");
        if (!b) return;
        if (b.getAttribute("data-mail") === "pgp") setOpen(pgp, pgpBtn, !pgp.classList.contains("open"));
        else if (b.getAttribute("data-mail") === "copy") copyAddr();
        else sendMail();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && pick.classList.contains("open")) { setOpen(pick, mail, false); if (pgp) setOpen(pgp, pgpBtn, false); mail.focus(); }
      });
    }
  }

  var glow = document.querySelector(".cursor-glow");
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  if (glow && finePointer && !reduce) {
    var tx = innerWidth / 2, ty = innerHeight / 3, cx = tx, cy = ty, raf = null;
    function step() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      glow.style.transform = "translate(" + (cx - 300) + "px," + (cy - 300) + "px)";
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(step) : null;
    }
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add("on");
      if (!raf) raf = requestAnimationFrame(step);

      var card = e.target.closest && e.target.closest(".skill, .cert, .tool, .tcard, .kit, .fcard, .sq-door, .term, .frame, .contact, .proj, .sq-teaser");
      if (card) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--gx", (e.clientX - r.left) + "px");
        card.style.setProperty("--gy", (e.clientY - r.top) + "px");
      }
    }, { passive: true });
    document.addEventListener("pointerleave", function () { glow.classList.remove("on"); });
  } else if (glow) {
    glow.remove();
  }

  var PT_KEY = "pt";
  try { sessionStorage.removeItem(PT_KEY); } catch (e) {}
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
    var url = new URL(a.getAttribute("href"), location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || !/\.html$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    var target = /offline/.test(url.pathname) ? "cd ~/offline" : /writeups/.test(url.pathname) ? "cd ~/writeups" : /wall/.test(url.pathname) ? "cd ~/wall" : "cd ~";
    var o = document.createElement("div");
    o.className = "pt";
    o.setAttribute("aria-hidden", "true");
    o.innerHTML = '<div class="pt-cmd"><span class="p">cal1ber@kali</span>:~$ <span class="t"></span><span class="cursor"></span></div>';
    document.body.appendChild(o);
    var cmd = o.querySelector(".pt-cmd"), t = o.querySelector(".t"), i = 0;
    setTimeout(function type() {
      t.textContent = target.slice(0, ++i);
      if (i < target.length) return setTimeout(type, 38);
      setTimeout(function () { cmd.classList.add("sent"); }, 380);
      setTimeout(function () {
        try { sessionStorage.setItem(PT_KEY, "1"); } catch (e2) {}
        location.href = url.href;
      }, 680);
    }, 560);
  });

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) document.querySelectorAll(".pt").forEach(function (o) { o.remove(); });
  });

  if (!reduce && "IntersectionObserver" in window) {
    var groups = [
      [".cat, .fixed-sec, .sq-row, .contact2", 0],
      [".cert-card, .proj, .vid, .ph, .tool, .r:not(.head), .wu, .stats-strip", 0.07]
    ];
    var targets = [];
    groups.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (el) {
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(g[0]); });
        if (g[1]) el.style.setProperty("--d", (sibs.indexOf(el) * g[1]) + "s");
        el.classList.add("reveal"); targets.push(el);
      });
    });
    document.documentElement.classList.add("reveal-on");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle("in", en.isIntersecting);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
    window.__reveal = function (el) { if (!el.classList.contains("reveal")) { el.classList.add("reveal"); io.observe(el); } };
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
