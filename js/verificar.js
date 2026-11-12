/* AEPFA — Página pública de verificación de certificados */
(function () {
  "use strict";
  function render() {
    var C = window.AEPFA_CERT, out = document.querySelector("[data-out]");
    if (!location.hash || location.hash.length < 8) return;
    var r = C.parse(location.hash), d = r.data, e = C.esc;
    if (!r.ok || !d) {
      out.innerHTML = '<section class="verdict bad"><span class="mark">✕</span><div><h1>Certificado no válido</h1>' +
        "<p>Los datos de este enlace no coinciden con ningún certificado emitido por la academia, o fueron modificados. Comuníquese con AEPFA para confirmarlo.</p></div></section>";
      return;
    }
    var exp = C.expiry(d), expired = C.isExpired(d);
    document.title = (expired ? "Certificado vencido · " : "Certificado válido · ") + d.n + " · AEPFA";
    out.innerHTML =
      (expired
        ? '<section class="verdict warn"><span class="mark">!</span><div><h1>Certificado auténtico, pero vencido</h1>' +
          "<p>Fue emitido por la Academia AEPFA y sus datos no han sido alterados, pero su vigencia terminó el " + C.fdate(exp) + ". El titular debe realizar la actualización correspondiente.</p></div></section>"
        : '<section class="verdict ok"><span class="mark">✓</span><div><h1>Certificado válido y vigente</h1>' +
          "<p>Fue emitido por la Academia AEPFA, sus datos no han sido alterados" + (exp ? " y se encuentra vigente hasta el " + C.fdate(exp) : "") + ".</p></div></section>") +
      '<div class="facts">' +
        "<div><span>Titular</span><strong>" + e(d.n) + "</strong></div>" +
        (d.ci ? "<div><span>Cédula</span><strong>" + e(d.ci) + "</strong></div>" : "") +
        "<div><span>Programa</span><strong>" + e(d.c) + "</strong></div>" +
        "<div><span>Duración</span><strong>" + e(d.h) + " horas académicas</strong></div>" +
        "<div><span>Fecha de emisión</span><strong>" + C.fdate(d.d) + "</strong></div>" +
        (exp ? "<div><span>Válido hasta</span><strong>" + C.fdate(exp) + (expired ? ' <em class="tag-bad">Vencido</em>' : ' <em class="tag-ok">Vigente</em>') + "</strong></div>" : "") +
        "<div><span>Código</span><strong>" + e(d.code) + "</strong></div>" +
      "</div>" +
      '<div class="cert-wrap">' + C.front(d, location.href) + "</div>";
  }
  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("hashchange", function () { location.reload(); });
})();
