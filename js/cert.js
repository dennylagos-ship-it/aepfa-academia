/* =========================================================================
   AEPFA — Certificados con código y QR de verificación
   En modo demo los datos del certificado viajan dentro del enlace del QR,
   protegidos con un código de integridad: si alguien altera el nombre, el
   curso o la fecha, el código deja de coincidir y la verificación falla.
   Con Supabase, el QR apuntará al registro oficial guardado en la base de datos.
   ========================================================================= */
(function () {
  "use strict";
  var SALT = "AEPFA·RIF V-13147867-0·MPPE R02682509";

  function fnv(str, seed) {
    var h = seed >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function sign(p) {
    var s = [p.n, p.ci, p.c, p.h, p.d, p.u, p.k, p.t, p.m, p.v].join("|") + "|" + SALT;
    var a = fnv(s, 2166136261).toString(36), b = fnv(s.split("").reverse().join(""), 33554467).toString(36);
    return ("00000" + a).slice(-6).toUpperCase() + "-" + ("00000" + b).slice(-6).toUpperCase();
  }
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }

  /* Datos del certificado de un estudiante en un curso */
  function build(user, course, issuedTs, teacherName) {
    var p = { n: user.name, ci: user.cedula || "", c: course.title, h: +course.hours, d: Math.floor(issuedTs / 1000), u: user.id.slice(-6), k: course.id, t: teacherName || "", m: course.modality || "", v: +(((window.AEPFA_CONFIG || {}).brand || {}).certYears || 0) };
    p.code = "AEPFA-" + sign(p);
    return p;
  }
  function baseURL() { return location.href.split("#")[0].split("?")[0].replace(/[^/]*$/, ""); }
  function verifyURL(p) {
    var compact = { n: p.n, ci: p.ci, c: p.c, h: p.h, d: p.d, u: p.u, k: p.k, t: p.t, m: p.m, v: p.v, x: p.code };
    return baseURL() + "verificar.html#" + b64e(JSON.stringify(compact));
  }
  function parse(hash) {
    try {
      var o = JSON.parse(b64d(String(hash).replace(/^#/, "")));
      var ok = ("AEPFA-" + sign(o)) === o.x;
      o.code = o.x;
      return { ok: ok, data: o };
    } catch (e) { return { ok: false, data: null }; }
  }
  /* Vencimiento: fecha de emisión + años de vigencia (en segundos) */
  function expiry(p) {
    if (!p || !+p.v) return 0;
    var dt = new Date(p.d * 1000); dt.setFullYear(dt.getFullYear() + (+p.v));
    return Math.floor(dt.getTime() / 1000);
  }
  function isExpired(p) { var e = expiry(p); return !!e && Date.now() / 1000 > e; }
  function qrSVG(text) {
    if (!window.qrcode) return "";
    var q = window.qrcode(0, "L"); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }


  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fdate(ts) { if (ts < 1e11) ts = ts * 1000; try { return new Date(ts).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return new Date(ts).toDateString(); } }

  var KIND = { text: "Lectura", video: "Video", pdf: "Documento", file: "Archivo", link: "Recurso", quiz: "Evaluación" };
  function roman(n) { return ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][n] || String(n + 1); }

  /* Anverso (A4 horizontal) */
  function front(p, url) {
    var B = (window.AEPFA_CONFIG || {}).brand || {};
    return '<div class="cx cx-front">' +
      '<aside class="cx-side">' +
        '<div class="cx-brand"><img src="assets/img/logo-medallon.webp" alt="" /><strong>AEPFA</strong><span>Academia de Educación Permanente<br />y Fortalecimiento del Aprendizaje</span></div>' +
        '<div class="cx-verify"><div class="cx-qr">' + qrSVG(url) + '</div><p>Escanee para verificar<br />la autenticidad en línea</p><code>' + esc(p.code) + "</code></div>" +
        '<p class="cx-legal">RIF ' + esc(B.rif) + "<br />MPPE N.º " + esc(B.mppe) + "</p>" +
      "</aside>" +
      '<section class="cx-main">' +
        '<img class="cx-water" src="assets/img/logo-medallon.webp" alt="" />' +
        '<header class="cx-head"><span class="cx-kicker">Certificado de aprobación</span><span class="cx-no">N.º ' + esc(p.code.replace("AEPFA-", "")) + "</span></header>" +
        '<div class="cx-body">' +
          '<p class="cx-lead">La Academia AEPFA certifica que</p>' +
          '<h2 class="cx-name">' + esc(p.n) + "</h2>" +
          (p.ci ? '<p class="cx-ci">C.I. ' + esc(p.ci) + "</p>" : "") +
          '<p class="cx-text">cursó y aprobó satisfactoriamente el programa de formación</p>' +
          '<h3 class="cx-course">' + esc(p.c) + "</h3>" +
        "</div>" +
        '<dl class="cx-facts">' +
          "<div><dt>Duración</dt><dd>" + esc(p.h) + " horas académicas</dd></div>" +
          (p.m ? "<div><dt>Modalidad</dt><dd>" + esc(p.m) + "</dd></div>" : "") +
          "<div><dt>Fecha de emisión</dt><dd>" + fdate(p.d) + "</dd></div>" +
          (expiry(p) ? "<div><dt>Válido hasta</dt><dd>" + fdate(expiry(p)) + "</dd></div>" : "") +
        "</dl>" +
        '<footer class="cx-sigs">' +
          '<div><span class="ln"></span><strong>' + esc(p.t || "Facilitador(a)") + "</strong><small>Facilitador(a)</small></div>" +
          '<div><span class="ln"></span><strong>Dirección Académica</strong><small>AEPFA</small></div>' +
        "</footer>" +
      "</section>" +
    "</div>";
  }

  /* Reverso: contenido programático */
  function back(p, course) {
    if (!course || !course.modules || !course.modules.length) return "";
    var lessons = 0, quizzes = 0, minutes = 0;
    course.modules.forEach(function (m) { (m.lessons || []).forEach(function (l) { lessons++; minutes += +l.minutes || 0; if (l.kind === "quiz") quizzes++; }); });
    var dense = lessons > 14 ? " dense" : "";
    return '<div class="cx cx-back' + dense + '">' +
      '<header class="cx-bhead"><div><span class="cx-kicker">Contenido programático</span><h3>' + esc(course.title) + "</h3></div>" +
        '<img src="assets/img/logo-medallon.webp" alt="" /></header>' +
      '<div class="cx-bgrid">' +
        '<aside class="cx-summary">' +
          (course.description ? "<p>" + esc(course.description) + "</p>" : "") +
          "<dl>" +
            "<div><dt>Horas académicas</dt><dd>" + esc(course.hours) + "</dd></div>" +
            "<div><dt>Módulos</dt><dd>" + course.modules.length + "</dd></div>" +
            "<div><dt>Lecciones</dt><dd>" + lessons + "</dd></div>" +
            "<div><dt>Evaluaciones</dt><dd>" + quizzes + "</dd></div>" +
            "<div><dt>Modalidad</dt><dd>" + esc(course.modality) + "</dd></div>" +
            "<div><dt>Nivel</dt><dd>" + esc(course.level) + "</dd></div>" +
          "</dl>" +
          '<p class="cx-approval">Aprobación con calificación mínima de 70 % en las evaluaciones y 100 % de las actividades completadas.</p>' +
        "</aside>" +
        '<ol class="cx-modules">' + course.modules.map(function (m, i) {
          return '<li><span class="cx-mn">' + roman(i) + '</span><div><h4>' + esc(m.title) + "</h4><ul>" +
            (m.lessons || []).map(function (l) { return "<li>" + esc(l.title) + " <em>" + (KIND[l.kind] || "") + "</em></li>"; }).join("") +
            "</ul></div></li>";
        }).join("") + "</ol>" +
      "</div>" +
      '<footer class="cx-bfoot"><span>Este contenido forma parte del certificado <strong>' + esc(p.code) + "</strong> emitido a " + esc(p.n) + ".</span>" +
        '<span>AEPFA · RIF ' + esc(((window.AEPFA_CONFIG || {}).brand || {}).rif) + "</span></footer>" +
    "</div>";
  }

  function html(p, url, course) { return front(p, url) + back(p, course); }

  window.AEPFA_CERT = { build: build, verifyURL: verifyURL, parse: parse, qrSVG: qrSVG, html: html, expiry: expiry, isExpired: isExpired, front: front, back: back, fdate: fdate, esc: esc };
})();
