/* =========================================================================
   AEPFA — Sitio público
   ========================================================================= */
(function () {
  "use strict";
  var A = window.AEPFA, CFG = window.AEPFA_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hoverable = window.matchMedia("(hover: hover)").matches;

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[AEPFA] " + name, e); } }

  function published() { return A.db().courses.filter(function (c) { return c.published; }); }

  /* Splash */
  function initSplash() {
    var s = $("[data-splash]"); if (!s) return;
    var hide = function () { s.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 500);
    else window.addEventListener("load", function () { setTimeout(hide, 350); });
    setTimeout(hide, 3800);
  }

  /* Navegación */
  function initNav() {
    var nav = $("[data-nav]"), burger = $("[data-burger]");
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 30); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    burger.addEventListener("click", function () {
      var o = nav.classList.toggle("is-open"); burger.setAttribute("aria-expanded", o);
    });
    $$(".nav-links a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("is-open"); }); });
  }

  /* Cifras reales calculadas del catálogo */
  function initStats() {
    var list = published();
    var data = { programs: list.length, hours: list.reduce(function (s, c) { return s + (+c.hours || 0); }, 0) };
    $$("[data-count]").forEach(function (el) {
      var to = data[el.getAttribute("data-count")]; if (to == null) return;
      el.textContent = to;
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        var t0 = performance.now(), dur = 1400;
        (function tick(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }, { threshold: 0.01 });
      io.observe(el);
    });
  }

  /* Catálogo */
  function cardHTML(c) {
    return '<article class="course-card reveal" tabindex="0" role="button" data-id="' + c.id + '" data-cat="' + A.esc(c.category) + '" aria-label="Ver programa ' + A.esc(c.title) + '">' +
      (c.featured ? '<span class="badge-feat">Destacado</span>' : "") +
      A.coverHTML(c) +
      '<div class="course-body"><h3>' + A.esc(c.title) + "</h3><p>" + A.esc(c.summary) + "</p></div>" +
      '<div class="course-meta"><span>' + A.esc(c.level) + "</span><span>" + A.esc(c.modality) + "</span><span>" + c.modules.length + " módulos</span></div>" +
      "</article>";
  }
  function initCatalog() {
    var grid = $("[data-course-grid]"), filters = $("[data-filters]");
    var list = published().sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    grid.innerHTML = list.map(cardHTML).join("");
    A.hydrateCovers(grid);

    var cats = {}; list.forEach(function (c) { cats[c.category] = (cats[c.category] || 0) + 1; });
    var chips = [["Todos", list.length]].concat(Object.keys(cats).map(function (k) { return [k, cats[k]]; }));
    filters.innerHTML = chips.map(function (c, i) {
      return '<button class="chip" role="tab" aria-selected="' + (i === 0) + '" data-f="' + A.esc(c[0]) + '">' + A.esc(c[0]) + "<b>" + c[1] + "</b></button>";
    }).join("");
    filters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      $$(".chip", filters).forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      var f = b.getAttribute("data-f");
      $$(".course-card", grid).forEach(function (card) {
        var show = f === "Todos" || card.getAttribute("data-cat") === f;
        card.classList.toggle("is-hidden", !show);
        if (show) card.classList.add("is-visible");
      });
    });

    grid.addEventListener("click", function (e) { var c = e.target.closest(".course-card"); if (c) openCourse(c.getAttribute("data-id")); });
    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var c = e.target.closest(".course-card"); if (c) { e.preventDefault(); openCourse(c.getAttribute("data-id")); }
    });

    // selector del formulario
    var sel = $("[data-course-select]");
    sel.innerHTML = '<option value="">Aún no lo decido</option>' + list.map(function (c) { return '<option value="' + c.id + '">' + A.esc(c.title) + "</option>"; }).join("");

    initTilt();
  }

  /* Inclinación 3D + halo en tarjetas */
  function initTilt() {
    if (!hoverable) return;
    $$(".course-card").forEach(function (card) {
      if (card.dataset.tilt) return; card.dataset.tilt = "1";
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%"); card.style.setProperty("--my", y * 100 + "%");
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 7) + "deg) rotateY(" + ((x - 0.5) * 7) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* Detalle del programa */
  function openCourse(id) {
    var c = A.courseById(id); if (!c) return;
    var dlg = $("[data-dialog]"), body = $("[data-dialog-body]");
    body.innerHTML =
      '<button class="dlg-close" data-close aria-label="Cerrar">×</button>' +
      A.coverHTML(c) +
      '<div class="dlg-body">' +
      '<p class="eyebrow">' + A.esc(c.category) + "</p>" +
      "<h2>" + A.esc(c.title) + "</h2>" +
      '<div class="dlg-facts"><span>' + c.hours + " horas</span><span>" + A.esc(c.modality) + "</span><span>Nivel " + A.esc(c.level).toLowerCase() + "</span><span>Certificado</span></div>" +
      "<p>" + A.esc(c.description) + "</p>" +
      '<div class="syllabus">' + c.modules.map(function (m, i) {
        return "<details" + (i === 0 ? " open" : "") + "><summary>Módulo " + (i + 1) + " · " + A.esc(m.title) + "</summary><ul>" +
          m.lessons.map(function (l) { return "<li>" + A.esc(l.title) + " <small>(" + A.KIND[l.kind] + ")</small></li>"; }).join("") + "</ul></details>";
      }).join("") + "</div>" +
      '<div class="dlg-actions"><a class="btn btn-line" href="aula.html#/curso/' + c.id + '">Ver en el aula</a><button class="btn btn-wine" data-pick="' + c.id + '">Solicitar inscripción</button></div>' +
      "</div>";
    A.hydrateCovers(body);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function initDialog() {
    var dlg = $("[data-dialog]");
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
      var pick = e.target.closest("[data-pick]");
      if (pick) {
        dlg.close();
        $("[data-course-select]").value = pick.getAttribute("data-pick");
        $("#inscripcion").scrollIntoView({ behavior: "smooth" });
        setTimeout(function () { $("[data-enroll] [name=name]").focus({ preventScroll: true }); }, 700);
      }
    });
  }

  /* Formulario de inscripción → solicitud + WhatsApp */
  function initForm() {
    var f = $("[data-enroll]"), ok = $("[data-ok]");
    $("[data-wa]").href = A.waLink("Hola AEPFA, quisiera información sobre sus programas.");
    $("[data-hours]").textContent = CFG.brand.hours;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = Object.fromEntries(new FormData(f).entries()), bad = false;
      ["name", "phone"].forEach(function (k) {
        var el = f.elements[k], v = (d[k] || "").trim(), invalid = !v || (k === "phone" && v.replace(/\D/g, "").length < 10);
        el.classList.toggle("invalid", invalid); if (invalid) bad = true;
      });
      if (bad) { A.toast("Revise nombre y teléfono.", "err"); return; }
      A.addLead(d);
      var c = A.courseById(d.courseId);
      var msg = "Hola AEPFA, soy " + d.name.trim() + ". Quiero inscribirme" + (c ? " en «" + c.title + "»" : "") + ". Mi teléfono: " + d.phone + (d.message ? ". " + d.message : "");
      ok.hidden = false;
      setTimeout(function () { window.open(A.waLink(msg), "_blank", "noopener"); }, 900);
      setTimeout(function () { ok.hidden = true; f.reset(); }, 7000);
    });
  }

  /* Sello del hero: sigue suavemente al puntero */
  function initSeal() {
    if (!hoverable) return;
    var seal = $("[data-seal]"), img = $(".seal-img", seal);
    window.addEventListener("pointermove", function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      img.style.transform = "translate3d(" + x * 18 + "px," + y * 18 + "px,0) rotate(" + x * 4 + "deg)";
    }, { passive: true });
  }

  /* Entrada del titular */
  function initHeroIntro() {
    if (!window.gsap) return;
    var lines = $$("[data-hero-title] .ln");
    gsap.from(lines, { yPercent: 60, opacity: 0, duration: 1.2, stagger: 0.12, ease: "expo.out", delay: 0.55, clearProps: "all" });
    gsap.from(".hero-sub, .hero-actions, .hero-stats", { y: 24, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out", delay: 0.9, clearProps: "all" });
    gsap.from(".seal-img", { scale: 0.85, opacity: 0, duration: 1.6, ease: "expo.out", delay: 0.5, clearProps: "opacity" });
  }

  /* Revelado al hacer scroll (con red de seguridad) */
  function initReveal() {
    $$(".sec-head, .steps li, .device, .aval-quote, .aval-item, .enroll-copy, .enroll-form").forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
    $$(".reveal").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el); });
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible"); });
    }, 6000);
    // barra de la maqueta
    var bar = $("[data-demo-bar]");
    if (bar) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { bar.style.width = "84%"; o.disconnect(); } }, { threshold: 0.05 }).observe(bar);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.documentElement.classList.remove("no-js");
    $("[data-year]").textContent = new Date().getFullYear();
    safe(initSplash, "splash");
    safe(initNav, "nav");
    safe(initCatalog, "catalog");
    safe(initStats, "stats");
    safe(initDialog, "dialog");
    safe(initForm, "form");
    safe(initSeal, "seal");
    safe(initHeroIntro, "hero");
    safe(initReveal, "reveal");
  });
})();
