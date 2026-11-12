/* =========================================================================
   AEPFA — Verificación pública de certificados
   1) Por enlace/QR: los datos viajan en el enlace y se comprueba su firma.
   2) Por código: se busca en el registro público (data/certificados.json)
      y, en modo demo, también en los datos guardados en este navegador.
   ========================================================================= */
(function () {
  "use strict";
  var C, out, form;

  function verdictBad(title, msg) {
    return '<section class="verdict bad"><span class="mark">✕</span><div><h1>' + title + "</h1><p>" + msg + "</p></div></section>";
  }
  function show(d, source) {
    var e = C.esc, exp = C.expiry(d), expired = C.isExpired(d);
    document.title = (expired ? "Certificado vencido · " : "Certificado válido · ") + d.n + " · AEPFA";
    var where = source === "registro" ? " Consta en el registro de certificados de la academia." : "";
    out.innerHTML =
      (expired
        ? '<section class="verdict warn"><span class="mark">!</span><div><h1>Certificado auténtico, pero vencido</h1>' +
          "<p>Fue emitido por la Academia AEPFA y sus datos no han sido alterados, pero su vigencia terminó el " + C.fdate(exp) + "." + where + "</p></div></section>"
        : '<section class="verdict ok"><span class="mark">✓</span><div><h1>Certificado válido y vigente</h1>' +
          "<p>Fue emitido por la Academia AEPFA, sus datos no han sido alterados" + (exp ? " y se encuentra vigente hasta el " + C.fdate(exp) : "") + "." + where + "</p></div></section>") +
      '<div class="facts">' +
        "<div><span>Titular</span><strong>" + e(d.n) + "</strong></div>" +
        (d.ci ? "<div><span>Cédula</span><strong>" + e(d.ci) + "</strong></div>" : "") +
        "<div><span>Programa</span><strong>" + e(d.c) + "</strong></div>" +
        "<div><span>Duración</span><strong>" + e(d.h) + " horas académicas</strong></div>" +
        "<div><span>Fecha de emisión</span><strong>" + C.fdate(d.d) + "</strong></div>" +
        (exp ? "<div><span>Válido hasta</span><strong>" + C.fdate(exp) + (expired ? ' <em class="tag-bad">Vencido</em>' : ' <em class="tag-ok">Vigente</em>') + "</strong></div>" : "") +
        "<div><span>Código</span><strong>" + e(d.code) + "</strong></div>" +
      "</div>" +
      '<div class="cert-wrap">' + C.front(d, C.verifyURL(d)) + "</div>";
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Certificados completados en los datos de demostración de este navegador */
  function localCerts() {
    var list = [];
    try {
      var db = JSON.parse(localStorage.getItem("aepfa_demo_v1") || "null"); if (!db) return list;
      db.enrollments.forEach(function (en) {
        var u = db.users.filter(function (x) { return x.id === en.userId; })[0];
        var c = db.courses.filter(function (x) { return x.id === en.courseId; })[0];
        if (!u || !c) return;
        var ls = []; c.modules.forEach(function (m) { m.lessons.forEach(function (l) { ls.push(l); }); });
        var pr = (db.progress || {})[u.id] || {};
        if (!ls.length || ls.some(function (l) { return !pr[l.id]; })) return;
        var last = Math.max.apply(null, ls.map(function (l) { return pr[l.id]; }));
        var t = db.users.filter(function (x) { return x.id === c.instructorId; })[0];
        list.push(C.compact(C.build(u, c, last, t ? t.name : "")));
      });
    } catch (e) {}
    return list;
  }
  function registry() {
    return fetch("data/certificados.json?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { certificados: [] }; })
      .then(function (j) { return j.certificados || []; })
      .catch(function () { return []; });
  }

  function lookup(raw) {
    var code = C.normCode(raw);
    if (!code) { out.innerHTML = verdictBad("Código con formato incorrecto", "El código tiene la forma <strong>AEPFA-XXXXXX-XXXXXX</strong> y aparece debajo del QR del certificado."); return; }
    out.innerHTML = '<section class="verdict none"><span class="mark">…</span><div><h1>Buscando…</h1><p>Consultando el registro de certificados.</p></div></section>';
    registry().then(function (reg) {
      var hit = reg.filter(function (o) { return o.x === code; })[0], src = "registro";
      if (!hit) { hit = localCerts().filter(function (o) { return o.x === code; })[0]; src = "local"; }
      if (!hit) { out.innerHTML = verdictBad("No encontramos ese código", "El código <strong>" + C.esc(code) + "</strong> no corresponde a ningún certificado registrado. Revise que esté bien escrito o comuníquese con la academia."); return; }
      var r = C.validate(hit);
      if (!r.ok) { out.innerHTML = verdictBad("Certificado no válido", "El registro de este código no supera la comprobación de integridad. Comuníquese con la academia."); return; }
      show(r.data, src);
    });
  }

  function fromHash() {
    var r = C.parse(location.hash);
    if (!r.ok || !r.data) {
      out.innerHTML = verdictBad("Certificado no válido", "Los datos de este enlace no coinciden con ningún certificado emitido por la academia, o fueron modificados. Comuníquese con AEPFA para confirmarlo.");
      return;
    }
    form.code.value = r.data.code;
    registry().then(function (reg) { show(r.data, reg.some(function (o) { return o.x === r.data.code; }) ? "registro" : "qr"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    C = window.AEPFA_CERT; out = document.querySelector("[data-out]"); form = document.querySelector("[data-lookup]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (location.hash) history.replaceState(null, "", location.pathname + "?c=" + encodeURIComponent(form.code.value.trim()));
      lookup(form.code.value);
    });
    var q = new URLSearchParams(location.search).get("c");
    if (location.hash && location.hash.length > 8) fromHash();
    else if (q) { form.code.value = q; lookup(q); }
  });
  window.addEventListener("hashchange", function () { if (location.hash.length > 8) fromHash(); });
})();
