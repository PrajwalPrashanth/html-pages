/* ============================================================================
   Amita Dongre — version D, "Moodboard". Motion layer.
   Every timing comes from the CSS custom properties in style.css; this file
   only decides *when* things run. prefers-reduced-motion short-circuits all
   of it and drops the page straight into its final state.
   ========================================================================== */
(function () {
  "use strict";

  try {
    var root = document.documentElement;
    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduce = motionQuery.matches;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    var ms = function (name, fallback) {
      var v = getComputedStyle(root).getPropertyValue(name).trim();
      var n = parseFloat(v);
      if (!v || isNaN(n)) return fallback;
      return v.indexOf("ms") > -1 ? n : n * 1000;
    };

    var DUR_POP = ms("--dur-pop", 550);
    var STAG_OBJ = ms("--stagger-obj", 70);
    var DELAY_LAB = ms("--delay-labels", 200);
    var STAG_CARD = ms("--stagger-card", 80);
    var STAG_ROW = ms("--stagger-row", 70);

    var board = document.getElementById("board");
    var objs = board ? Array.prototype.slice.call(board.querySelectorAll(".obj")) : [];

    /* ----------------------------------------------------------------------
       Every hand-drawn stroke on this page is animated with stroke-dashoffset.
       The paths carry `vector-effect: non-scaling-stroke`, so the dash pattern
       is measured in device pixels, not user units — which means each path has
       to be told its own rendered length. Until that happens `--len` falls back
       to 0 (no dashing at all), so a no-JS reader simply sees the finished ink.
       -------------------------------------------------------------------- */
    var STROKES = ".doodle [data-d],.arrow path,.arw path,.ring-svg path,.nav-ring path";
    function primeStrokes() {
      Array.prototype.forEach.call(document.querySelectorAll(STROKES), function (p) {
        var svg = p.ownerSVGElement;
        if (!svg) return;
        var vb = svg.viewBox && svg.viewBox.baseVal;
        if (!vb || !vb.width || !vb.height) return;
        /* layout size, not the transformed box: objects are mid pop-in (and can
           grow to 1.06 on hover), so a rect here would under-measure and leave
           a sliver of ink showing before the stroke is meant to exist. */
        var cs = getComputedStyle(svg);
        var w = parseFloat(cs.width), h = parseFloat(cs.height);
        if (!w || !h) return;
        var scale = Math.max(w / vb.width, h / vb.height);
        var len = p.getTotalLength() * scale * 1.15;
        if (!isFinite(len) || len <= 0) return;
        p.style.setProperty("--len", Math.ceil(len + 2));
      });
    }

    /* ------------------------------------------------------- 10 · load more */
    var moreBtn = document.getElementById("loadmore");
    var also = document.getElementById("also");

    /* --------------------------------------------- reveal helper (7 · 8 · 2) */
    function revealGroup(nodes, step) {
      nodes.forEach(function (el, i) {
        el.style.setProperty("--rise-delay", i * step + "ms");
        el.classList.add("is-in");
      });
    }

    /* ======================================================================
       REDUCED MOTION — show every final state, wire nothing else.
       ==================================================================== */
    function applyMotionPreference() {
      reduce = motionQuery.matches;
      root.classList.toggle("motion", !reduce);
      root.classList.toggle("no-motion", reduce);
      root.classList.toggle("cursor-on", !reduce && fine);
      document.querySelectorAll("video").forEach(function (video) {
        video.autoplay = !reduce;
        if (reduce) { video.pause(); video.currentTime = 0; }
        else { video.play().catch(function () {}); }
      });
      if (reduce) {
        if (board) board.classList.add("is-lit", "is-labelled");
        objs.forEach(function (o) { o.classList.add("is-on"); });
        document.querySelectorAll(".card,.tile,.row").forEach(function (el) { el.classList.add("is-in"); });
        document.querySelectorAll("[data-ring]").forEach(function (el) { el.classList.add("is-drawn"); });
      }
    }
    applyMotionPreference();
    motionQuery.addEventListener("change", applyMotionPreference);

    // The deployed folder is a sibling of versions; locally it sits inside it.
    var switcher = document.querySelector(".switcher");
    if (switcher && /\/versions\/moodboard\/(?:index\.html)?$/.test(location.pathname)) {
      switcher.href = "../";
    }

    primeStrokes();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(primeStrokes).catch(function () {});
    }
    window.addEventListener("load", primeStrokes);
    var rzT = null;
    window.addEventListener("resize", function () {
      clearTimeout(rzT);
      rzT = setTimeout(primeStrokes, ms("--dur-resize", 180));
    });

    /* ======================================================================
       1 · CUSTOM CURSOR — 28px yellow disc, ~120ms lerp, hollow 44px ring on
       anything interactive. Touch: never. Keyboard: the native cursor comes
       straight back the moment someone tabs.
       ==================================================================== */
    var dot = document.querySelector(".cursor");
    if (dot && fine) {
      dot.hidden = false;
      root.classList.toggle("cursor-on", !reduce);

      var cxp = window.innerWidth / 2, cyp = window.innerHeight / 2;
      var mxp = cxp, myp = cyp, cursorRaf = null;

      var hot = "a,button,.obj,.card,.tile,.row,summary,[tabindex]";

      var cursorTime = 0;
      var tick = function (now) {
        if (reduce) { cursorRaf = null; cursorTime = 0; return; }
        var elapsed = cursorTime ? Math.min(now - cursorTime, 64) : 16;
        cursorTime = now;
        var blend = 1 - Math.exp(-elapsed / ms("--dur-cursor", 120));
        cxp += (mxp - cxp) * blend;
        cyp += (myp - cyp) * blend;
        dot.style.transform = "translate3d(" + cxp.toFixed(2) + "px," + cyp.toFixed(2) + "px,0)";
        if (Math.abs(mxp - cxp) > 0.1 || Math.abs(myp - cyp) > 0.1) {
          cursorRaf = requestAnimationFrame(tick);
        } else {
          cursorRaf = null; cursorTime = 0;
        }
      };

      window.addEventListener("mousemove", function (e) {
        if (reduce) return;
        mxp = e.clientX; myp = e.clientY;
        root.classList.remove("kbd");
        if (e.target && e.target.closest) {
          dot.classList.toggle("is-big", !!e.target.closest(hot));
        }
        if (!cursorRaf) cursorRaf = requestAnimationFrame(tick);
      }, { passive: true });

      window.addEventListener("mouseout", function (e) {
        if (!e.relatedTarget) dot.style.opacity = "0";
      });
      window.addEventListener("mouseover", function () { dot.style.opacity = ""; });

      window.addEventListener("keydown", function (e) {
        if (e.key === "Tab") root.classList.add("kbd");
      });
    }

    /* ======================================================================
       2 · HERO ENTRANCE — objects pop in from the centre outward, in spiral
       order; 3 · each then breathes on its own 4–7s cycle.
       ==================================================================== */
    if (board && objs.length) {
      var rect = board.getBoundingClientRect();
      var bcx = rect.width / 2, bcy = rect.height / 2;

      var ranked = objs.map(function (el) {
        var r = el.getBoundingClientRect();
        var x = r.left - rect.left + r.width / 2 - bcx;
        var y = r.top - rect.top + r.height / 2 - bcy;
        var rad = Math.sqrt(x * x + y * y);
        var ang = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
        return { el: el, key: rad + (ang / (Math.PI * 2)) * 46, depth: +(el.dataset.depth || 2) };
      }).sort(function (a, b) { return a.key - b.key; });

      ranked.forEach(function (o, i) {
        o.el.style.setProperty("--pop-delay", i * STAG_OBJ + "ms");
        /* 3 · idle float: own period, own phase */
        o.el.querySelector(".obj-float").style.setProperty("--float", (ms("--float-base", 4000) + Math.random() * ms("--float-range", 3000)).toFixed(2) + "ms");
        o.el.querySelector(".obj-float").style.setProperty("--float-delay", (-Math.random() * (ms("--float-base", 4000) + ms("--float-range", 3000))).toFixed(2) + "ms");
      });

      requestAnimationFrame(function () {
        board.classList.add("is-lit");
        ranked.forEach(function (o) { o.el.classList.add("is-on"); });
      });

      /* labels + hand-drawn arrows come in after the last object lands */
      setTimeout(function () {
        board.classList.add("is-labelled");
      }, (ranked.length - 1) * STAG_OBJ + DUR_POP + DELAY_LAB);

      /* ====================================================================
         9 · POINTER PARALLAX — three depths, lerped so it trails the pointer
         instead of snapping to it.
         ================================================================== */
      if (fine) {
        board.classList.add("pfx");
        var css = getComputedStyle(root);
        var DEPTH = {1: parseFloat(css.getPropertyValue("--depth-1")), 2: parseFloat(css.getPropertyValue("--depth-2")), 3: parseFloat(css.getPropertyValue("--depth-3"))};
        var tx = 0, ty = 0, px = 0, py = 0, pRaf = null;

        var vx = 0, vy = 0, parallaxTime = 0;
        var pLoop = function (now) {
          if (reduce) { pRaf = null; px = py = vx = vy = tx = ty = parallaxTime = 0; return; }
          var dt = Math.min(parallaxTime ? (now - parallaxTime) / 1000 : 1 / 60, 0.032);
          parallaxTime = now;
          var frequency = 6 / (ms("--dur-parallax", 600) / 1000);
          vx += ((tx - px) * frequency * frequency - 2 * frequency * vx) * dt;
          vy += ((ty - py) * frequency * frequency - 2 * frequency * vy) * dt;
          px += vx * dt;
          py += vy * dt;
          ranked.forEach(function (o) {
            var d = DEPTH[o.depth] || 12;
            o.el.style.setProperty("--px", (px * d).toFixed(2) + "px");
            o.el.style.setProperty("--py", (py * d).toFixed(2) + "px");
          });
          if (Math.abs(tx - px) > 0.0015 || Math.abs(ty - py) > 0.0015 || Math.abs(vx) + Math.abs(vy) > 0.0015) {
            pRaf = requestAnimationFrame(pLoop);
          } else {
            pRaf = null; parallaxTime = 0;
          }
        };
        var kick = function () { if (!pRaf) pRaf = requestAnimationFrame(pLoop); };

        board.addEventListener("pointermove", function (e) {
          if (reduce || e.pointerType === "touch") return;
          var r = board.getBoundingClientRect();
          tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
          kick();
        }, { passive: true });

        board.addEventListener("pointerleave", function () { tx = 0; ty = 0; kick(); });
      }
    }

    /* ======================================================================
       6 · SECTION SCRIBBLES — the red ellipses draw when their heading lands.
       ==================================================================== */
    var io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          obs.unobserve(el);
          if (el.hasAttribute("data-ring")) { el.classList.add("is-drawn"); return; }
          var siblings = Array.prototype.slice.call(el.parentElement.children);
          var columns = getComputedStyle(el.parentElement).gridTemplateColumns.split(" ").length;
          var delay = el.classList.contains("row") ? siblings.indexOf(el) * STAG_ROW : (siblings.indexOf(el) % columns) * STAG_CARD;
          el.style.setProperty("--rise-delay", delay + "ms");
          el.classList.add("is-in");
        });
      }, { rootMargin: "0px", threshold: 0.05 });

      Array.prototype.forEach.call(
        document.querySelectorAll("[data-ring],.cards > .card,.rows > .row"),
        function (el) { io.observe(el); }
      );
    } else {
      Array.prototype.forEach.call(
        document.querySelectorAll("[data-ring]"), function (el) { el.classList.add("is-drawn"); }
      );
      Array.prototype.forEach.call(
        document.querySelectorAll("[data-stagger],[data-stagger-rows]"),
        function (el) { revealGroup(Array.prototype.slice.call(el.children), 0); }
      );
    }

    /* ======================================================================
       10 · LOAD MORE — the Also strip rises in with the same stagger.
       ==================================================================== */
    if (moreBtn && also) {
      moreBtn.addEventListener("click", function () {
        also.hidden = false;
        moreBtn.setAttribute("aria-expanded", "true");
        var grid = also.querySelector("[data-stagger-also]");
        requestAnimationFrame(function () {
          if (grid) revealGroup(Array.prototype.slice.call(grid.children), STAG_CARD);
        });
        primeStrokes();
        var first = also.querySelector("a");
        if (first) first.focus({ preventScroll: true });
        moreBtn.parentElement.remove();
      });
    }
  } catch (err) {
    /* Motion is decoration. If any of it throws, the page still reads:
       force every animated element into its final state. */
    try {
      var d = document;
      var b = d.getElementById("board");
      if (b) b.classList.add("is-lit", "is-labelled");
      Array.prototype.forEach.call(d.querySelectorAll(".obj"), function (el) { el.classList.add("is-on"); });
      Array.prototype.forEach.call(
        d.querySelectorAll(".card,.tile,.panel,.step,.row,.note-y"),
        function (el) { el.classList.add("is-in"); }
      );
      Array.prototype.forEach.call(d.querySelectorAll("[data-ring]"), function (el) { el.classList.add("is-drawn"); });
      var a = d.getElementById("also");
      if (a) a.hidden = false;
      d.documentElement.classList.remove("cursor-on", "motion");
      d.documentElement.classList.add("no-motion");
    } catch (e2) { /* nothing further to do */ }
    if (window.console && console.warn) console.warn("moodboard motion disabled:", err);
  }
})();
