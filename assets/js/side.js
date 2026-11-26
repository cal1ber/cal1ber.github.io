(function () {
  "use strict";

  var toggles = Array.prototype.slice.call(document.querySelectorAll(".cat-toggle"));
  function setOpen(btn, open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.closest(".cat").classList.toggle("open", open);
  }
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () { setOpen(btn, btn.getAttribute("aria-expanded") !== "true"); });
  });

  function openFromHash() {

    var key = location.hash.slice(1), sec = null;
    try { key = decodeURIComponent(key); } catch (e) { return; }
    if (key) sec = document.getElementById(key);
    if (sec && !sec.classList.contains("cat")) sec = null;
    if (sec) setOpen(sec.querySelector(".cat-toggle"), true);
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  function layoutPhotos(grid) {
    var tiles = Array.prototype.slice.call(grid.querySelectorAll(".ph")), cs = getComputedStyle(grid);
    var W = grid.clientWidth, H = parseFloat(cs.getPropertyValue("--row-h")) || 190, gap = parseFloat(cs.columnGap) || 0;
    var ar = tiles.map(function (t) { return parseFloat(t.style.getPropertyValue("--ar")) || 1.5; });
    if (!W || !tiles.length) return;

    var best = [0], cut = [0];
    for (var i = 1; i <= tiles.length; i++) {
      best[i] = Infinity;
      for (var j = i - 1, sum = 0; j >= 0; j--) {
        sum += ar[j];
        var h = (W - gap * (i - j - 1)) / sum, cost = best[j] + Math.pow(h - H, 2);
        if (cost < best[i]) { best[i] = cost; cut[i] = j; }
        if (h < H * 0.5) break;
      }
    }
    for (var end = tiles.length; end > 0; end = cut[end]) {
      var start = cut[end], total = 0, k;
      for (k = start; k < end; k++) total += ar[k];
      var rowH = (W - gap * (end - start - 1)) / total;
      for (k = start; k < end; k++) { tiles[k].style.flex = "0 0 auto"; tiles[k].style.width = Math.floor(ar[k] * rowH * 100) / 100 + "px"; }
      tiles[end - 1].style.flex = "1 0 auto";
    }
  }
  document.querySelectorAll(".photos").forEach(function (grid) {
    grid.querySelectorAll(".ph img[width][height]").forEach(function (img) {
      var w = +img.getAttribute("width"), h = +img.getAttribute("height");
      if (w > 0 && h > 0) img.closest(".ph").style.setProperty("--ar", (w / h).toFixed(4));
    });
    layoutPhotos(grid);
    if ("ResizeObserver" in window) {
      var last = grid.clientWidth;
      new ResizeObserver(function () { if (grid.clientWidth !== last) { last = grid.clientWidth; layoutPhotos(grid); } }).observe(grid);
    }
  });

  var lb = document.getElementById("lightbox");
  if (lb && lb.showModal) {
    var img = lb.querySelector("img"), cap = lb.querySelector(".lb-cap"), closeBtn = lb.querySelector(".lb-close");
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canAnimate = !still && typeof lb.animate === "function";
    var EASE_OUT = "cubic-bezier(.16,1,.3,1)", EASE_IN = "cubic-bezier(.55,0,.75,.3)";
    var current = null, closing = false;

    function overTile(tile) {
      var t = tile.getBoundingClientRect(), d = lb.getBoundingClientRect(), r = img.getBoundingClientRect();
      var k = t.width / r.width;
      return "translate(" + (t.left - d.left - (r.left - d.left) * k) + "px," + (t.top - d.top - (r.top - d.top) * k) + "px) scale(" + k + ")";
    }
    function fade(el, from, to, opts) { try { return el.animate([{ opacity: from }, { opacity: to }], opts); } catch (e) { return null; } }

    document.querySelectorAll(".ph").forEach(function (ph) {
      ph.addEventListener("click", function () {
        var src = ph.getAttribute("data-full"), thumb = ph.querySelector("img");
        if (!src || !/^((\.\.\/)?assets\/|https:\/\/)/.test(src) || closing) return;
        current = ph;

        var ar = parseFloat(ph.style.getPropertyValue("--ar")) || (thumb ? thumb.naturalWidth / thumb.naturalHeight : 1.5) || 1.5;
        img.style.width = Math.floor(Math.min(window.innerWidth * 0.92 - 2, 1200, window.innerHeight * 0.8 * ar)) + "px";
        img.src = thumb && thumb.currentSrc ? thumb.currentSrc : src;
        img.alt = cap.textContent = ph.getAttribute("data-caption") || "";
        lb.showModal();
        if (canAnimate) {
          lb.animate([{ transform: overTile(ph) }, { transform: "none" }], { duration: 480, easing: EASE_OUT });
          fade(lb, 0, 1, { duration: 480, easing: EASE_OUT, pseudoElement: "::backdrop" });
          [cap, closeBtn].forEach(function (el) { fade(el, 0, 1, { duration: 220, delay: 300, fill: "backwards" }); });
        }
        if (img.src !== new URL(src, location.href).href) {
          var full = new Image(); full.src = src;
          (full.decode ? full.decode() : Promise.resolve()).then(function () { if (current === ph && lb.open) img.src = src; }, function () {});
        }
      });
    });

    function closeViewer() {
      if (!lb.open || closing) return;
      if (!canAnimate || !current) { lb.close(); return; }
      closing = true;
      var anims = [lb.animate([{ transform: "none" }, { transform: overTile(current) }], { duration: 340, easing: EASE_IN, fill: "forwards" }),
                   fade(lb, 1, 0, { duration: 340, easing: "ease", fill: "forwards", pseudoElement: "::backdrop" }),
                   fade(cap, 1, 0, { duration: 120, fill: "forwards" }), fade(closeBtn, 1, 0, { duration: 120, fill: "forwards" })];
      anims[0].onfinish = function () {
        lb.close();
        anims.forEach(function (a) { if (a) a.cancel(); });
        closing = false;
      };
    }
    closeBtn.addEventListener("click", closeViewer);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeViewer(); });
    lb.addEventListener("cancel", function (e) { e.preventDefault(); closeViewer(); });
  }
})();
