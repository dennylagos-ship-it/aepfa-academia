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
    var s = [p.n, p.ci, p.c, p.h, p.d, p.u, p.k, p.t, p.m].join("|") + "|" + SALT;
    var a = fnv(s, 2166136261).toString(36), b = fnv(s.split("").reverse().join(""), 33554467).toString(36);
    return ("00000" + a).slice(-6).toUpperCase() + "-" + ("00000" + b).slice(-6).toUpperCase();
  }
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }

  /* Datos del certificado de un estudiante en un curso */
  function build(user, course, issuedTs, teacherName) {
    var p = { n: user.name, ci: user.cedula || "", c: course.title, h: +course.hours, d: Math.floor(issuedTs / 1000), u: user.id.slice(-6), k: course.id, t: teacherName || "", m: course.modality || "" };
    p.code = "AEPFA-" + sign(p);
    return p;
  }
  function baseURL() { return location.href.split("#")[0].split("?")[0].replace(/[^/]*$/, ""); }
  function verifyURL(p) {
    var compact = { n: p.n, ci: p.ci, c: p.c, h: p.h, d: p.d, u: p.u, k: p.k, t: p.t, m: p.m, x: p.code };
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
  function qrSVG(text) {
    if (!window.qrcode) return "";
    var q = window.qrcode(0, "L"); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }


  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fdate(ts) { if (ts < 1e11) ts = ts * 1000; try { return new Date(ts).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return new Date(ts).toDateString(); } }

  /* Maqueta del certificado (A4 horizontal) */
  function html(p, url) {
    var B = (window.AEPFA_CONFIG || {}).brand || {};
    return '<div class="cert">' +
      '<span class="cert-corner tl"></span><span class="cert-corner tr"></span><span class="cert-corner bl"></span><span class="cert-corner br"></span>' +
      '<div class="cert-top"><img src="assets/img/logo-medallon.webp" alt="" /><p>' + esc(B.name) + '</p><small>RIF ' + esc(B.rif) + ' · Inscrita en el MPPE N.º ' + esc(B.mppe) + "</small></div>" +
      '<div class="cert-mid"><h2>Certificado de aprobación</h2><p>Se otorga el presente certificado a</p><span class="who">' + esc(p.n) + "</span>" +
        "<p>" + (p.ci ? "titular de la C.I. " + esc(p.ci) + ", " : "") + "por haber cursado y aprobado satisfactoriamente el programa de formación <strong>" + esc(p.c) + "</strong>, con una duración de " + esc(p.h) + " horas académicas" + (p.m ? ", en modalidad " + esc(String(p.m).toLowerCase()) : "") + ".</p>" +
        '<p class="cert-date">Emitido el ' + fdate(p.d) + "</p></div>" +
      '<div class="cert-bot">' +
        '<div class="sig"><span class="line"></span>' + esc(p.t || "Facilitador(a)") + "<br /><small>Facilitador(a)</small></div>" +
        '<div class="sig"><span class="line"></span>Dirección Académica<br /><small>AEPFA</small></div>' +
        '<div class="cert-qr"><div class="qr">' + qrSVG(url) + "</div><div><small>Verifique este certificado</small><br />escaneando el código QR<br /><code>" + esc(p.code) + "</code></div></div>" +
      "</div></div>";
  }

  window.AEPFA_CERT = { build: build, verifyURL: verifyURL, parse: parse, qrSVG: qrSVG, html: html, fdate: fdate, esc: esc };
})();
