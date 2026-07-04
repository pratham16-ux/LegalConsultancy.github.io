/* ============================================================
   Stackly Legal — shared dashboard behaviour (both roles)
   ============================================================ */
window.StacklyDash = (function () {
  "use strict";

  /* ---------- auth guard + email display ---------- */
  function guard(requiredRole) {
    var user = null;
    try {
      user = JSON.parse(sessionStorage.getItem("stacklyLegalAuth") || "null");
    } catch (e) { user = null; }

    if (!user || !user.email || user.role !== requiredRole) {
      window.location.replace("signin.html");
      return null;
    }
    return user;
  }

  function showEmail(user, ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = user.email;
    });
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    var dock = document.getElementById("toastDock");
    if (!dock) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML =
      '<span class="t-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12l5 5L20 7"/></svg></span>' +
      "<span></span>";
    t.lastChild.textContent = msg;
    dock.appendChild(t);
    setTimeout(function () {
      t.classList.add("leaving");
      setTimeout(function () { t.remove(); }, 400);
    }, 3200);
  }

  /* ---------- modals ---------- */
  function openModal(veil) { veil.classList.add("open"); }
  function closeModal(veil) { veil.classList.remove("open"); }

  document.addEventListener("click", function (e) {
    var closer = e.target.closest("[data-close]");
    if (closer) closeModal(closer.closest(".modal-veil"));
    if (e.target.classList && e.target.classList.contains("modal-veil")) {
      closeModal(e.target);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-veil.open").forEach(closeModal);
    }
  });

  /* ---------- shared wiring on DOM ready ---------- */
  document.addEventListener("DOMContentLoaded", function () {

    /* panel routing (sidebar + any [data-go] button) */
    var navBtns = document.querySelectorAll(".side-nav [data-panel]");
    var panels = document.querySelectorAll(".panel");
    var pageTitle = document.getElementById("pageTitle");
    var crumbCode = document.getElementById("crumbCode");
    var side = document.getElementById("dashSide");
    var veil = document.getElementById("sideVeil");

    function goPanel(name) {
      panels.forEach(function (p) { p.classList.toggle("on", p.id === "panel-" + name); });
      navBtns.forEach(function (b, i) {
        var on = b.dataset.panel === name;
        b.classList.toggle("on", on);
        if (on) {
          if (pageTitle) pageTitle.textContent = b.textContent.trim();
          if (crumbCode) crumbCode.textContent = ("0" + (i + 1)).slice(-2);
        }
      });
      closeSide();
      window.scrollTo({ top: 0, behavior: "smooth" });

      /* animate any progress bars that just became visible */
      document.querySelectorAll(".panel.on .bar i[data-w]").forEach(function (bar) {
        requestAnimationFrame(function () { bar.style.width = bar.dataset.w; });
      });
    }

    navBtns.forEach(function (b) {
      b.addEventListener("click", function () { goPanel(b.dataset.panel); });
    });
    document.addEventListener("click", function (e) {
      var go = e.target.closest("[data-go]");
      if (go) goPanel(go.dataset.go);
    });

    /* initial bars */
    document.querySelectorAll(".panel.on .bar i[data-w]").forEach(function (bar) {
      requestAnimationFrame(function () { bar.style.width = bar.dataset.w; });
    });

    /* sidebar drawer (mobile) */
    var toggle = document.getElementById("sideToggle");
    function closeSide() {
      if (side) side.classList.remove("open");
      if (veil) veil.classList.remove("show");
    }
    if (toggle) {
      toggle.addEventListener("click", function () {
        side.classList.toggle("open");
        veil.classList.toggle("show", side.classList.contains("open"));
      });
    }
    if (veil) veil.addEventListener("click", closeSide);

    /* notifications */
    var notifBtn = document.getElementById("notifBtn");
    var notifPanel = document.getElementById("notifPanel");
    var notifDot = document.getElementById("notifDot");
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        notifPanel.classList.toggle("open");
      });
      document.addEventListener("click", function (e) {
        if (!notifPanel.contains(e.target)) notifPanel.classList.remove("open");
      });
      var markRead = document.getElementById("markRead");
      if (markRead) {
        markRead.addEventListener("click", function () {
          notifPanel.querySelectorAll("li.unread").forEach(function (li) {
            li.classList.remove("unread");
          });
          if (notifDot) notifDot.style.display = "none";
          toast("All notifications marked as read");
        });
      }
    }

    /* logout */
    var logout = document.getElementById("logoutBtn");
    if (logout) {
      logout.addEventListener("click", function () {
        sessionStorage.removeItem("stacklyLegalAuth");
        toast("Signed out");
        setTimeout(function () { window.location.href = "signin.html"; }, 500);
      });
    }
  });

  return { guard: guard, showEmail: showEmail, toast: toast, openModal: openModal, closeModal: closeModal };
})();