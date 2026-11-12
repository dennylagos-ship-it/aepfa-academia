/* =========================================================================
   AEPFA — Piezas de interfaz compartidas entre aula y panel
   ========================================================================= */
(function () {
  "use strict";
  var A = window.AEPFA;

  function initials(n) { return String(n || "?").replace(/^(Lcd[oa]\.|Dr[a]?\.|Ing\.)\s*/i, "").split(/\s+/).slice(0, 2).map(function (p) { return p[0] || ""; }).join("").toUpperCase(); }
  var ROLE = { admin: "Administración", instructor: "Docente", student: "Estudiante" };

  /* Pantalla de acceso (ingresar / crear cuenta) */
  function renderAuth(root, opts) {
    opts = opts || {};
    var staff = !!opts.staff;
    root.innerHTML =
      '<div class="auth">' +
        '<div class="auth-art">' +
          '<a class="back" href="index.html">← Volver a la web</a>' +
          '<img class="auth-seal" src="assets/img/logo-medallon.webp" alt="Escudo AEPFA" width="300" height="300" />' +
          "<div><h1>" + (staff ? "Panel <em class=\"gold\">docente</em>" : "Aula <em class=\"gold\">virtual</em>") + "</h1>" +
          "<p>" + (staff ? "Cree programas, organice módulos y suba sus clases, guías y evaluaciones." : "Sus clases, lecturas y evaluaciones en un solo lugar, disponibles cuando usted pueda estudiar.") + "</p></div>" +
        "</div>" +
        '<div class="auth-panel"><div class="auth-box">' +
          "<h2>Bienvenido</h2>" +
          (staff ? "" : '<div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="in">Ingresar</button><button role="tab" aria-selected="false" data-tab="up">Crear cuenta</button></div>') +
          '<form class="auth-form" data-form="in">' +
            '<label>Correo<input name="email" type="email" required autocomplete="username" /></label>' +
            '<label>Contraseña<input name="pass" type="password" required autocomplete="current-password" /></label>' +
            '<p class="form-err" data-err></p>' +
            '<button class="btn btn-wine btn-block">Ingresar</button>' +
          "</form>" +
          '<form class="auth-form" data-form="up" hidden>' +
            '<label>Nombre y apellido<input name="name" required autocomplete="name" /></label>' +
            '<div class="row2"><label>Cédula<input name="cedula" placeholder="V-00.000.000" /></label><label>Teléfono<input name="phone" inputmode="tel" /></label></div>' +
            '<label>Correo<input name="email" type="email" required autocomplete="email" /></label>' +
            '<label>Contraseña<input name="pass" type="password" required minlength="6" autocomplete="new-password" /></label>' +
            '<p class="form-err" data-err></p>' +
            '<button class="btn btn-wine btn-block">Crear mi cuenta</button>' +
          "</form>" +
          '<div class="demo-accounts"><p>Cuentas de demostración</p>' +
            (staff ? "" : '<button type="button" data-demo="estudiante@aepfa.edu.ve|demo123"><span>Estudiante · Carlos Méndez</span><small>demo123</small></button>') +
            '<button type="button" data-demo="docente@aepfa.edu.ve|docente123"><span>Docente · Lcda. Rojas</span><small>docente123</small></button>' +
            '<button type="button" data-demo="admin@aepfa.edu.ve|admin123"><span>Administración</span><small>admin123</small></button>' +
          "</div>" +
        "</div></div>" +
      "</div>";

    var fin = root.querySelector('[data-form="in"]'), fup = root.querySelector('[data-form="up"]');
    root.querySelectorAll("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () {
        root.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
        fin.hidden = b.dataset.tab !== "in"; fup.hidden = b.dataset.tab !== "up";
      });
    });
    function done(u) {
      if (staff && u.role === "student") { A.logout(); throw new Error("Esta cuenta es de estudiante. Ingrese desde el aula virtual."); }
      A.toast("Hola, " + u.name.split(" ")[0] + ".", "ok");
      opts.onDone && opts.onDone(u);
    }
    function attempt(form, fn) {
      var err = form.querySelector("[data-err]");
      try { err.textContent = ""; done(fn()); } catch (e) { err.textContent = e.message; }
    }
    fin.addEventListener("submit", function (e) {
      e.preventDefault();
      attempt(fin, function () { return A.login(fin.email.value, fin.pass.value); });
    });
    fup.addEventListener("submit", function (e) {
      e.preventDefault();
      if (fup.pass.value.length < 6) { fup.querySelector("[data-err]").textContent = "La contraseña debe tener al menos 6 caracteres."; return; }
      attempt(fup, function () {
        var u = A.register({ name: fup.name.value, email: fup.email.value, pass: fup.pass.value, phone: fup.phone.value, cedula: fup.cedula.value });
        return A.login(u.email, u.pass);
      });
    });
    root.querySelectorAll("[data-demo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = b.dataset.demo.split("|");
        fin.hidden = false; fup.hidden = true;
        fin.email.value = p[0]; fin.pass.value = p[1];
        attempt(fin, function () { return A.login(p[0], p[1]); });
      });
    });
  }

  /* Estructura con barra lateral */
  function renderShell(root, user, items, active, sub) {
    root.innerHTML =
      '<div class="shell" data-shell>' +
        '<aside class="side">' +
          '<a class="side-brand" href="index.html"><img src="assets/img/logo-aepfa-320.webp" alt="" /><span><strong>AEPFA</strong><small>' + A.esc(sub) + "</small></span></a>" +
          items.map(function (it) {
            if (it === "-") return '<div class="side-sep"></div>';
            return '<a class="nl' + (it.key === active ? " on" : "") + '" href="' + it.href + '">' + A.icon(it.icon) + "<span>" + A.esc(it.label) + "</span>" + (it.count ? '<span class="count">' + it.count + "</span>" : "") + "</a>";
          }).join("") +
          '<button class="nl" data-logout>' + A.icon("book") + "<span>Cerrar sesión</span></button>" +
          '<div class="side-user"><span class="avatar">' + initials(user.name) + "</span><div><strong>" + A.esc(user.name) + "</strong><small>" + ROLE[user.role] + "</small></div></div>" +
        "</aside>" +
        '<div class="main-wrap"><div class="topbar"><img src="assets/img/logo-aepfa-320.webp" alt="" /><strong>AEPFA</strong><button class="btn btn-line btn-sm" data-menu>Menú</button></div>' +
        '<main class="main" data-main></main></div>' +
      "</div>";
    var shell = root.querySelector("[data-shell]");
    root.querySelector("[data-menu]").addEventListener("click", function (e) { e.stopPropagation(); shell.classList.toggle("menu-open"); });
    root.querySelector("[data-main]").addEventListener("click", function () { shell.classList.remove("menu-open"); });
    root.querySelector("[data-logout]").addEventListener("click", function () { A.logout(); location.hash = ""; location.reload(); });
    return root.querySelector("[data-main]");
  }

  /* Diálogo modal reutilizable */
  function modal(title, bodyHTML, footHTML) {
    var d = document.createElement("dialog");
    d.className = "modal";
    d.innerHTML = '<div class="modal-head"><h2>' + A.esc(title) + '</h2><button class="icon-btn" data-x aria-label="Cerrar">×</button></div>' +
      '<div class="modal-body">' + bodyHTML + "</div>" + (footHTML ? '<div class="modal-foot">' + footHTML + "</div>" : "");
    document.body.appendChild(d);
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-x]")) d.close(); });
    d.addEventListener("close", function () { setTimeout(function () { d.remove(); }, 50); });
    d.showModal();
    return d;
  }
  function confirmBox(msg, okLabel) {
    return new Promise(function (res) {
      var d = modal("Confirmar", "<p>" + A.esc(msg) + "</p>", '<button class="btn btn-line btn-sm" data-no>Cancelar</button><button class="btn btn-wine btn-sm" data-yes>' + A.esc(okLabel || "Aceptar") + "</button>");
      var answered = false;
      d.querySelector("[data-yes]").addEventListener("click", function () { answered = true; d.close(); res(true); });
      d.querySelector("[data-no]").addEventListener("click", function () { d.close(); });
      d.addEventListener("close", function () { if (!answered) res(false); });
    });
  }

  window.AEPFA_UI = { renderAuth: renderAuth, renderShell: renderShell, modal: modal, confirm: confirmBox, initials: initials, ROLE: ROLE };
})();
