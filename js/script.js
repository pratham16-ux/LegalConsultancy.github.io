/* ============================================================
   Stackly Legal Consultancy — shared behaviour
   ============================================================ */
(function () {
  "use strict";

  /* breadcrumb for the 404 page's Go-back button — every normal page
     records itself; the 404 (has .nf-stage) never overwrites it */
  try {
    if (!document.querySelector(".nf-stage")) {
      sessionStorage.setItem("stacklyLastPage", window.location.href);
    }
  } catch (e) { /* storage unavailable — 404 falls back to home */ }

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.querySelector(".mobile-panel");
  var toTop = document.querySelector(".to-top");

  /* ---------- header scroll state + back-to-top ---------- */
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (toTop) toTop.classList.toggle("show", y > 620);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- hamburger / mobile panel ---------- */
  if (toggle && panel) {
    var closePanel = function () {
      toggle.setAttribute("aria-expanded", "false");
      panel.classList.remove("open");
      document.body.classList.remove("nav-locked");
    };

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (open) {
        closePanel();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        panel.classList.add("open");
        document.body.classList.add("nav-locked");
      }
    });

    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closePanel);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });

    // if the viewport grows past the breakpoint, make sure state resets
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closePanel();
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealed = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && revealed.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          runCounter(en.target);
          cio.unobserve(en.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (c) { cio.observe(c); });
  }

  function runCounter(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1700;
    var t0 = null;

    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- testimonial slider ---------- */
  document.querySelectorAll(".testi-shell").forEach(function (shell) {
    var track = shell.querySelector(".testi-track");
    var slides = shell.querySelectorAll(".testi");
    var prev = shell.querySelector("[data-prev]");
    var next = shell.querySelector("[data-next]");
    var dotsWrap = shell.querySelector(".testi-dots");
    if (!track || slides.length < 2) return;

    var i = 0;
    var timer = null;

    if (dotsWrap) {
      slides.forEach(function (_, n) {
        var d = document.createElement("i");
        if (n === 0) d.classList.add("on");
        d.addEventListener("click", function () { go(n); restart(); });
        dotsWrap.appendChild(d);
      });
    }

    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = "translateX(-" + i * 100 + "%)";
      if (dotsWrap) {
        dotsWrap.querySelectorAll("i").forEach(function (d, k) {
          d.classList.toggle("on", k === i);
        });
      }
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(i + 1); }, 6000);
    }

    if (prev) prev.addEventListener("click", function () { go(i - 1); restart(); });
    if (next) next.addEventListener("click", function () { go(i + 1); restart(); });
    restart();
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;

    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");

      // close siblings in the same list
      var list = item.closest(".faq-list");
      if (list) {
        list.querySelectorAll(".faq.open").forEach(function (o) {
          o.classList.remove("open");
          o.querySelector(".faq-a").style.maxHeight = null;
        });
      }
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* ---------- contact form validation ---------- */
  var form = document.querySelector("#consult-form");
  if (form) {
    var ok = form.querySelector(".form-ok");

    function setInvalid(field, bad) {
      field.classList.toggle("invalid", bad);
      return !bad;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;

      form.querySelectorAll("[data-req]").forEach(function (input) {
        var field = input.closest(".field");
        var val = input.value.trim();
        var good = val.length > 1;

        if (input.type === "email") {
          good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
        }
        if (input.name === "phone") {
          good = /^[6-9]\d{9}$/.test(val.replace(/\s+/g, ""));
        }
        valid = setInvalid(field, !good) && valid;
      });

      if (!valid) return;

      if (ok) {
        ok.classList.add("show");
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
      setTimeout(function () { if (ok) ok.classList.remove("show"); }, 7000);
    });

    form.querySelectorAll("input, textarea, select").forEach(function (input) {
      input.addEventListener("input", function () {
        var f = input.closest(".field");
        if (f) f.classList.remove("invalid");
      });
    });
  }
})();