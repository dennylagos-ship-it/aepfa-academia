/* =========================================================================
   AEPFA — Configuración de marca + catálogo inicial (demo)
   Edite aquí los datos de contacto. Todo lo demás se gestiona desde el panel.
   ========================================================================= */
(function () {
  "use strict";

  var ICONS = {
    heart: '<path d="M32 54s-20-12.4-20-27.2C12 19.5 17.4 14 24 14c3.6 0 6.4 1.7 8 4.4 1.6-2.7 4.4-4.4 8-4.4 6.6 0 12 5.5 12 12.8C52 41.6 32 54 32 54z"/><path d="M14 34h10l4-8 6 16 4-8h12"/>',
    cross: '<rect x="24" y="10" width="16" height="44" rx="3"/><rect x="10" y="24" width="44" height="16" rx="3"/>',
    pill: '<rect x="8" y="22" width="48" height="20" rx="10" transform="rotate(-35 32 32)"/><path d="M26 23l12 18"/>',
    drop: '<path d="M32 8s16 18 16 30a16 16 0 0 1-32 0C16 26 32 8 32 8z"/><path d="M24 40a8 8 0 0 0 8 8"/>',
    syringe: '<path d="M44 8l12 12M50 14L22 42l-8-8L42 6"/><path d="M14 34l-6 6 16 16 6-6M8 56l6-6M28 28l4 4M34 22l4 4"/>',
    shield: '<path d="M32 6l20 8v14c0 13-8.5 23.6-20 28C20.5 51.6 12 41 12 28V14z"/><path d="M23 31l6 6 12-13"/>',
    hands: '<path d="M10 40l10-10c3-3 7-3 10 0l2 2 2-2c3-3 7-3 10 0l10 10"/><path d="M10 40l14 14h16l14-14"/><circle cx="32" cy="16" r="6"/>',
    folder: '<path d="M8 18a4 4 0 0 1 4-4h12l6 6h22a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z"/><path d="M20 34h24M20 42h14"/>',
    ecg: '<rect x="6" y="12" width="52" height="40" rx="4"/><path d="M10 34h10l4-12 6 22 5-14 3 4h16"/>',
    award: '<circle cx="32" cy="24" r="14"/><path d="M24 35l-6 21 14-7 14 7-6-21"/><path d="M26 24l4 4 8-8"/>',
    book: '<path d="M32 16c-6-4-14-5-22-4v36c8-1 16 0 22 4 6-4 14-5 22-4V12c-8-1-16 0-22 4z"/><path d="M32 16v36"/>'
  };

  window.AEPFA_CONFIG = {
    version: "20261112",
    brand: {
      short: "AEPFA",
      name: "Academia de Educación Permanente y Fortalecimiento del Aprendizaje",
      rif: "V-13147867-0",
      mppe: "R02682509",
      founded: 2025,
      // ⚠️ Cambie por el WhatsApp oficial de la academia (formato internacional, sin "+")
      whatsapp: "584247714625",
      email: "contacto@aepfa.edu.ve",
      city: "Venezuela",
      hours: "Lunes a sábado · 8:00 a. m. – 5:00 p. m."
    },
    icons: ICONS,
    categories: ["Emergencias", "Enfermería", "Laboratorio", "Farmacia", "Bioseguridad", "Cuidados", "Diagnóstico", "Gestión en salud"],
    palettes: ["#6E1A26", "#8A5A1F", "#3F4A3A", "#2F3B52", "#5B2A44", "#7A3B1E", "#2E4F4A", "#4A3F2F"]
  };
})();
