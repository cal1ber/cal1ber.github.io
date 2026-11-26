
(function () {
  var board = document.getElementById("board"), svg = document.getElementById("strings");
  if (!board || !svg) return;
  var NS = "http://www.w3.org/2000/svg";

  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (window.matchMedia("(max-width: 1000px)").matches) return;
    var b = board.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + b.width + " " + b.height);
    var pts = Array.prototype.slice.call(board.querySelectorAll("[data-chain]"))
      .sort(function (x, y) { return x.getAttribute("data-chain") - y.getAttribute("data-chain"); })
      .map(function (el) {
        var r = el.getBoundingClientRect();
        return { x: r.left - b.left + r.width / 2, y: r.top - b.top + 10, w: r.width };
      });
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], c = pts[i], dx = c.x - a.x, dy = c.y - a.y;
      var len = Math.sqrt(dx * dx + dy * dy), qx, qy;
      if (Math.abs(dy) > Math.abs(dx)) {
        var left = (a.x + c.x) / 2 < b.width / 2;
        qx = left ? Math.min(a.x, c.x) - Math.max(a.w, c.w) - 50 : Math.max(a.x, c.x) + Math.max(a.w, c.w) + 50;
        qy = a.y + dy / 2;
      } else {
        qx = a.x + dx / 2; qy = Math.min(a.y, c.y) - Math.min(40, 12 + len * 0.06);
      }
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", "M" + a.x + "," + a.y + " Q" + qx + "," + qy + " " + c.x + "," + c.y);
      if (i >= pts.length - 2) p.setAttribute("class", "next");
      svg.appendChild(p);
    }
  }
  draw();
  window.addEventListener("resize", function () { clearTimeout(draw.t); draw.t = setTimeout(draw, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  window.addEventListener("load", draw);

  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  Array.prototype.forEach.call(board.querySelectorAll(".holo"), function (card) {
    if (still) return;
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add("active");
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      card.style.setProperty("--ry", ((x - .5) * 22).toFixed(1) + "deg");
      card.style.setProperty("--rx", ((.5 - y) * 22).toFixed(1) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.classList.remove("active");
      ["--mx", "--my", "--rx", "--ry"].forEach(function (k) { card.style.removeProperty(k); });
    });
  });

  var dlg = document.getElementById("wall-view");
  if (!dlg || !dlg.showModal) return;
  var body = dlg.querySelector(".wv-body"), cap = dlg.querySelector(".lb-cap");
  board.addEventListener("click", function (e) {
    var s = e.target.closest(".sheet, .holo[data-full]"); if (!s) return;
    body.innerHTML = "";
    if (s.classList.contains("holo")) {
      var im = document.createElement("img");
      im.src = s.getAttribute("data-full"); im.alt = ""; im.className = "wv-img";
      body.appendChild(im);
    } else {
      body.appendChild(s.querySelector(".paper").cloneNode(true));
    }
    cap.textContent = s.getAttribute("data-caption") || "";
    dlg.showModal();
  });
  dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();
