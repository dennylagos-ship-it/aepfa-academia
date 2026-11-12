/* =========================================================================
   AEPFA — Aula virtual (estudiantes)
   Rutas: #/  ·  #/catalogo  ·  #/curso/:id  ·  #/curso/:id/:leccion  ·  #/certificado/:id  ·  #/perfil
   ========================================================================= */
(function () {
  "use strict";
  var A = window.AEPFA, UI = window.AEPFA_UI, CFG = window.AEPFA_CONFIG;
  var root, main, user;

  function staff() { return user.role !== "student"; }
  function myCourses() {
    if (staff()) return A.db().courses.filter(function (c) { return A.canEdit(user, c); });
    return A.enrollmentsOf(user.id).map(function (e) { return A.courseById(e.courseId); }).filter(Boolean);
  }
  function canView(c) { return staff() || A.isEnrolled(user.id, c.id); }

  function route() {
    user = A.session();
    if (!user) { UI.renderAuth(root, { onDone: function () { route(); } }); return; }
    var parts = location.hash.replace(/^#\/?/, "").split("/");
    var key = parts[0] || "inicio";
    var items = [
      { key: "inicio", href: "#/", icon: "book", label: "Mis cursos" },
      { key: "catalogo", href: "#/catalogo", icon: "folder", label: "Catálogo" },
      { key: "perfil", href: "#/perfil", icon: "hands", label: "Mi perfil" }
    ];
    if (staff()) items.push("-", { key: "panel", href: "admin.html", icon: "shield", label: "Panel docente" });
    main = UI.renderShell(root, user, items, key === "curso" || key === "certificado" ? "inicio" : key, "Aula virtual");
    window.scrollTo(0, 0);
    if (key === "catalogo") return viewCatalog();
    if (key === "perfil") return viewProfile();
    if (key === "curso") return parts[2] ? viewLesson(parts[1], parts[2]) : viewCourse(parts[1]);
    if (key === "certificado") return viewCert(parts[1]);
    viewHome();
  }

  /* ---------- Mis cursos ---------- */
  function courseCard(c, href) {
    var p = A.progressOf(user.id, c);
    return '<a class="mc" href="' + href + '">' + A.coverHTML(c) + "<h3>" + A.esc(c.title) + "</h3>" +
      '<div class="mc-foot">' + (staff() ? '<div class="mc-row"><span>' + A.studentsOf(c.id).length + " estudiantes</span><span>" + A.allLessons(c).length + " lecciones</span></div>" :
      '<div class="bar"><i style="width:' + p.pct + '%"></i></div><div class="mc-row"><span>' + p.done + " de " + p.total + " lecciones</span><span>" + (p.pct === 100 ? '<span class="pill ok">Completado</span>' : p.pct + " %") + "</span></div>") +
      "</div></a>";
  }
  function viewHome() {
    var list = myCourses(), first = user.name.split(" ")[0];
    var next = null;
    if (!staff()) list.some(function (c) {
      var p = A.progressOf(user.id, c);
      var l = A.allLessons(c).filter(function (x) { return !p.map[x.id]; })[0];
      if (l) { next = { c: c, l: l }; return true; }
    });
    main.innerHTML =
      '<div class="page-head"><div><h1>Hola, ' + A.esc(first) + ".</h1><p>" + (staff() ? "Estos son los programas a su cargo." : "Continúe donde lo dejó.") + "</p></div>" +
      (next ? '<a class="btn btn-wine" href="#/curso/' + next.c.id + "/" + next.l.id + '">Continuar: ' + A.esc(next.l.title) + " →</a>" : "") + "</div>" +
      (list.length ? '<div class="grid-cards">' + list.map(function (c) { return courseCard(c, "#/curso/" + c.id); }).join("") + "</div>" :
        '<div class="empty">' + A.icon("book") + "<h3>Aún no tiene cursos activos</h3><p>Explore el catálogo y solicite su inscripción. La academia activará su acceso.</p>" +
        '<a class="btn btn-wine" href="#/catalogo">Ver catálogo</a></div>');
    A.hydrateCovers(main);
  }

  /* ---------- Catálogo ---------- */
  function viewCatalog() {
    var list = A.db().courses.filter(function (c) { return c.published; });
    main.innerHTML = '<div class="page-head"><div><h1>Catálogo</h1><p>Todos los programas disponibles en la academia.</p></div></div>' +
      '<div class="grid-cards">' + list.map(function (c) {
        var mine = A.isEnrolled(user.id, c.id);
        return '<a class="mc" href="#/curso/' + c.id + '">' + A.coverHTML(c) + "<h3>" + A.esc(c.title) + "</h3>" +
          '<div class="mc-foot"><div class="mc-row"><span>' + c.hours + " h · " + A.esc(c.modality) + "</span>" + (mine ? '<span class="pill ok">Inscrito</span>' : pending(c.id) ? '<span class="pill gold">Solicitado</span>' : "") + "</div></div></a>";
      }).join("") + "</div>";
    A.hydrateCovers(main);
  }
  function pending(cid) { return A.db().leads.some(function (l) { return l.userId === user.id && l.courseId === cid && l.status !== "atendido"; }); }

  /* ---------- Portada del curso ---------- */
  function viewCourse(id) {
    var c = A.courseById(id);
    if (!c) { main.innerHTML = '<div class="empty"><h3>Curso no encontrado</h3><a class="btn btn-line" href="#/">Volver</a></div>'; return; }
    var ok = canView(c), p = A.progressOf(user.id, c), inst = A.userById(c.instructorId);
    var firstOpen = A.allLessons(c).filter(function (l) { return !p.map[l.id]; })[0] || A.allLessons(c)[0];
    var cta;
    if (ok) cta = (firstOpen ? '<a class="btn btn-wine" href="#/curso/' + c.id + "/" + firstOpen.id + '">' + (p.done ? "Continuar" : "Comenzar") + " →</a>" : "") +
      (p.pct === 100 && !staff() ? '<a class="btn btn-gold" href="#/certificado/' + c.id + '">Ver certificado</a>' : "");
    else if (pending(c.id)) cta = '<span class="pill gold">Solicitud enviada · la academia activará su acceso</span>';
    else cta = '<button class="btn btn-wine" data-request>Solicitar inscripción</button><a class="btn btn-line" target="_blank" rel="noopener" href="' + A.waLink("Hola AEPFA, quiero inscribirme en «" + c.title + "». Mi correo en el aula: " + user.email) + '">Consultar por WhatsApp</a>';

    main.innerHTML =
      '<p class="crumbs"><a href="#/">Mis cursos</a> / ' + A.esc(c.title) + "</p>" +
      '<section class="course-hero"><div>' +
        '<span class="pill wine">' + A.esc(c.category) + "</span>" +
        "<h1>" + A.esc(c.title) + "</h1>" +
        '<p class="lead">' + A.esc(c.description) + "</p>" +
        '<p class="hint" style="margin-top:12px">' + c.hours + " horas · " + A.esc(c.modality) + " · Nivel " + A.esc(c.level).toLowerCase() + (inst ? " · Docente: " + A.esc(inst.name) : "") + "</p>" +
        (ok && !staff() ? '<div style="margin-top:18px;display:grid;gap:6px;max-width:420px"><div class="bar"><i style="width:' + p.pct + '%"></i></div><span class="hint">' + p.pct + " % completado</span></div>" : "") +
        '<div class="actions">' + cta + "</div>" +
      "</div>" + A.coverHTML(c) + "</section>" +
      '<div class="panel"><h2>Contenido del programa</h2>' +
      c.modules.map(function (m, i) {
        return '<p class="syl-mod">Módulo ' + (i + 1) + " · " + A.esc(m.title) + "</p>" +
          '<div class="syl" style="position:static;border:0;padding:0;max-height:none">' + m.lessons.map(function (l) { return lessonLink(c, l, null, ok); }).join("") + "</div>";
      }).join("") + "</div>";
    A.hydrateCovers(main);
    var rq = main.querySelector("[data-request]");
    if (rq) rq.addEventListener("click", function () {
      A.addLead({ name: user.name, phone: user.phone, email: user.email, courseId: c.id, userId: user.id, message: "Solicitud desde el aula virtual" });
      A.toast("Solicitud enviada. Le avisaremos al activar su acceso.", "ok");
      viewCourse(id);
    });
  }
  function lessonLink(c, l, current, ok) {
    var done = A.progressOf(user.id, c).map[l.id];
    var href = ok ? "#/curso/" + c.id + "/" + l.id : "javascript:void(0)";
    return '<a href="' + href + '" class="' + (done ? "done " : "") + (current === l.id ? "on" : "") + '"' + (ok ? "" : ' aria-disabled="true" style="opacity:.65;cursor:default"') + '><span class="chk">' + (done ? "✓" : "") + "</span><span>" + A.esc(l.title) + "</span><small>" + (ok ? A.KIND[l.kind] : "🔒") + "</small></a>";
  }

  /* ---------- Lección ---------- */
  function viewLesson(cid, lid) {
    var c = A.courseById(cid); if (!c) return viewHome();
    if (!canView(c)) return viewCourse(cid);
    var found = A.findLesson(c, lid); if (!found) return viewCourse(cid);
    var l = found.lesson, all = A.allLessons(c), idx = all.indexOf(l), prev = all[idx - 1], next = all[idx + 1];
    var p = A.progressOf(user.id, c), done = !!p.map[l.id];

    main.innerHTML =
      '<p class="crumbs"><a href="#/">Mis cursos</a> / <a href="#/curso/' + c.id + '">' + A.esc(c.title) + "</a></p>" +
      '<div class="player">' +
        '<aside class="syl"><div class="syl-head"><strong>' + A.esc(c.title) + '</strong><div class="bar"><i style="width:' + p.pct + '%"></i></div><span class="hint">' + p.done + " de " + p.total + " lecciones · " + p.pct + " %</span></div>" +
          c.modules.map(function (m, i) { return '<p class="syl-mod">' + (i + 1) + ". " + A.esc(m.title) + "</p>" + m.lessons.map(function (x) { return lessonLink(c, x, l.id, true); }).join(""); }).join("") +
        "</aside>" +
        '<article class="lesson">' +
          '<header class="lesson-head"><span class="pill wine">' + A.KIND[l.kind] + " · " + l.minutes + " min</span><h1>" + A.esc(l.title) + "</h1><p class=\"hint\">" + A.esc(found.module.title) + "</p></header>" +
          '<div class="lesson-body" data-body></div>' +
          '<footer class="lesson-foot">' +
            (l.kind === "quiz" ? '<span class="hint">' + (done ? "✓ Evaluación aprobada" : "Apruebe con 70 % o más para completar") + "</span>" :
              '<button class="btn ' + (done ? "btn-line" : "btn-wine") + ' btn-sm" data-done>' + (done ? "✓ Completada · desmarcar" : "Marcar como completada") + "</button>") +
            '<div class="nav-btns">' + (prev ? '<a class="btn btn-ghost btn-sm" href="#/curso/' + c.id + "/" + prev.id + '">← Anterior</a>' : "") +
            (next ? '<a class="btn btn-line btn-sm" href="#/curso/' + c.id + "/" + next.id + '">Siguiente →</a>' : (p.pct === 100 && !staff() ? '<a class="btn btn-gold btn-sm" href="#/certificado/' + c.id + '">Obtener certificado</a>' : "")) + "</div>" +
          "</footer>" +
        "</article>" +
      "</div>";

    renderContent(main.querySelector("[data-body]"), c, l, done);
    var b = main.querySelector("[data-done]");
    if (b) b.addEventListener("click", function () {
      A.markLesson(user.id, l.id, !done);
      var np = A.progressOf(user.id, c);
      if (!done && np.pct === 100 && !staff()) A.toast("¡Programa completado! Ya puede descargar su certificado.", "ok");
      else if (!done) A.toast("Lección completada.", "ok");
      if (!done && next) location.hash = "#/curso/" + c.id + "/" + next.id; else viewLesson(cid, lid);
    });
  }

  function placeholder(kind, text, doc) {
    return '<div class="media' + (doc ? " doc" : "") + '"><div class="media-empty">' + A.icon(kind === "video" ? "ecg" : "folder") +
      "<strong>" + (kind === "video" ? "El video aún no ha sido publicado" : "El documento aún no ha sido publicado") + "</strong><span>" + A.esc(text || "El docente lo subirá desde el panel.") + "</span></div></div>";
  }
  function renderContent(el, c, l, done) {
    var notes = l.body && l.kind !== "text" && l.kind !== "quiz" ? '<div class="prose">' + A.md(l.body) + "</div>" : "";
    if (l.kind === "text") { el.innerHTML = '<div class="prose">' + A.md(l.body) + "</div>"; return; }
    if (l.kind === "quiz") return renderQuiz(el, c, l, done);
    if (l.kind === "link") {
      el.innerHTML = notes + (l.url ? '<p style="margin-top:16px"><a class="btn btn-wine" target="_blank" rel="noopener" href="' + A.esc(l.url) + '">Abrir recurso ↗</a></p>' : placeholder("file", "", true));
      return;
    }
    if (l.kind === "video") {
      if (l.fileId) {
        el.innerHTML = '<div class="media"></div>' + notes;
        A.files.url(l.fileId).then(function (u) {
          var box = el.querySelector(".media");
          if (u) box.innerHTML = '<video controls playsinline src="' + u + '"></video>'; else box.outerHTML = placeholder("video");
        });
      } else if (A.youtubeEmbed(l.url)) {
        el.innerHTML = '<div class="media"><iframe src="' + A.youtubeEmbed(l.url) + '" title="' + A.esc(l.title) + '" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>' + notes;
      } else if (/^https?:.*\.(mp4|webm)(\?|$)/i.test(l.url || "")) {
        el.innerHTML = '<div class="media"><video controls playsinline src="' + A.esc(l.url) + '"></video></div>' + notes;
      } else el.innerHTML = placeholder("video", l.body);
      return;
    }
    // pdf / archivo
    if (l.fileId) {
      el.innerHTML = '<div class="media doc"></div>' + notes;
      A.files.url(l.fileId).then(function (u) {
        var box = el.querySelector(".media");
        if (!u) { box.outerHTML = placeholder("file", "", true); return; }
        var isPdf = /\.pdf$/i.test(l.fileName || "") || l.kind === "pdf";
        box.innerHTML = isPdf ? '<iframe src="' + u + '" title="' + A.esc(l.title) + '"></iframe>' : '<div class="media-empty">' + A.icon("folder") + "<strong>" + A.esc(l.fileName) + "</strong></div>";
        box.insertAdjacentHTML("afterend", '<p style="margin:-8px 0 18px"><a class="btn btn-line btn-sm" download="' + A.esc(l.fileName || "archivo") + '" href="' + u + '">Descargar ' + A.esc(l.fileName || "archivo") + "</a></p>");
      });
    } else if (l.url) {
      el.innerHTML = notes + '<p style="margin-top:16px"><a class="btn btn-wine" target="_blank" rel="noopener" href="' + A.esc(l.url) + '">Abrir documento ↗</a></p>';
    } else el.innerHTML = placeholder("file", l.body, true);
  }

  function renderQuiz(el, c, l, done) {
    var qs = []; try { qs = JSON.parse(l.body || "[]"); } catch (e) {}
    if (!qs.length) { el.innerHTML = '<div class="empty"><h3>Evaluación en preparación</h3></div>'; return; }
    el.innerHTML = '<form class="quiz" data-quiz>' + qs.map(function (q, i) {
      return '<div class="q"><p>' + (i + 1) + ". " + A.esc(q.q) + "</p>" + q.o.map(function (o, j) {
        return '<label><input type="radio" name="q' + i + '" value="' + j + '" required /> ' + A.esc(o) + "</label>";
      }).join("") + "</div>";
    }).join("") + '<div data-score></div><div><button class="btn btn-wine">' + (done ? "Volver a presentar" : "Enviar respuestas") + "</button></div></form>";
    var f = el.querySelector("[data-quiz]");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var right = 0;
      qs.forEach(function (q, i) {
        var sel = f.querySelector('input[name="q' + i + '"]:checked'), v = sel ? +sel.value : -1;
        f.querySelectorAll('input[name="q' + i + '"]').forEach(function (inp) {
          var lab = inp.parentNode; lab.classList.remove("right", "wrong");
          if (+inp.value === q.a) lab.classList.add("right"); else if (inp.checked) lab.classList.add("wrong");
        });
        if (v === q.a) right++;
      });
      var pct = Math.round(right / qs.length * 100), pass = pct >= 70;
      f.querySelector("[data-score]").innerHTML = '<div class="score ' + (pass ? "pass" : "fail") + '">' + right + " de " + qs.length + " correctas · " + pct + " % — " + (pass ? "¡Aprobado!" : "Repase la lección e intente de nuevo.") + "</div>";
      if (pass && !done) {
        A.markLesson(user.id, l.id, true);
        var np = A.progressOf(user.id, c);
        A.toast(np.pct === 100 && !staff() ? "¡Programa completado! Ya puede descargar su certificado." : "Evaluación aprobada.", "ok");
        setTimeout(function () { viewLesson(c.id, l.id); }, 1600);
      }
    });
  }

  /* ---------- Certificado ---------- */
  function viewCert(cid) {
    var c = A.courseById(cid); if (!c) return viewHome();
    var p = A.progressOf(user.id, c);
    if (p.pct < 100 || staff()) {
      main.innerHTML = '<div class="empty">' + A.icon("shield") + "<h3>Certificado aún no disponible</h3><p>Complete todas las lecciones y evaluaciones del programa (" + p.pct + " % actual).</p><a class=\"btn btn-wine\" href=\"#/curso/" + c.id + '">Ir al curso</a></div>';
      return;
    }
    var last = Math.max.apply(null, A.allLessons(c).map(function (l) { return p.map[l.id] || 0; }));
    var inst = A.userById(c.instructorId), CERT = window.AEPFA_CERT;
    var data = CERT.build(user, c, last, inst ? inst.name : ""), url = CERT.verifyURL(data);
    main.innerHTML =
      '<p class="crumbs"><a href="#/">Mis cursos</a> / <a href="#/curso/' + c.id + '">' + A.esc(c.title) + "</a> / Certificado</p>" +
      '<div class="cert-wrap">' + CERT.html(data, url, c) + '</div>' +
      '<div class="cert-actions" style="margin-top:22px"><button class="btn btn-wine" data-print>Imprimir o guardar PDF</button>' +
      '<button class="btn btn-line" data-copy>Copiar enlace de verificación</button>' +
      '<a class="btn btn-line" target="_blank" rel="noopener" href="' + A.waLink("Mi certificado AEPFA en «" + c.title + "». Verificación en línea: " + url).replace("wa.me/" + CFG.brand.whatsapp, "wa.me/") + '">Compartir por WhatsApp</a>' +
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="' + A.esc(url) + '">Probar verificación ↗</a></div>';
    main.querySelector("[data-print]").addEventListener("click", function () { window.print(); });
    main.querySelector("[data-copy]").addEventListener("click", function () {
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { A.toast("Enlace copiado.", "ok"); }, function () { prompt("Copie el enlace:", url); });
    });
  }

  /* ---------- Perfil ---------- */
  function viewProfile() {
    main.innerHTML = '<div class="page-head"><div><h1>Mi perfil</h1><p>Estos datos aparecen en sus certificados.</p></div></div>' +
      '<form class="panel form-grid" style="max-width:560px" data-prof>' +
      '<label>Nombre y apellido<input name="name" required value="' + A.esc(user.name) + '" /></label>' +
      '<div class="row2"><label>Cédula<input name="cedula" value="' + A.esc(user.cedula) + '" /></label><label>Teléfono<input name="phone" value="' + A.esc(user.phone) + '" /></label></div>' +
      '<label>Correo<input value="' + A.esc(user.email) + '" disabled /></label>' +
      '<label>Nueva contraseña <small>(deje en blanco para no cambiarla)</small><input name="pass" type="password" minlength="6" autocomplete="new-password" /></label>' +
      '<div><button class="btn btn-wine">Guardar cambios</button></div></form>';
    var f = main.querySelector("[data-prof]");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      user.name = f.name.value.trim() || user.name; user.cedula = f.cedula.value.trim(); user.phone = f.phone.value.trim();
      if (f.pass.value) { if (f.pass.value.length < 6) return A.toast("La contraseña debe tener 6 caracteres o más.", "err"); user.pass = f.pass.value; }
      A.updateUser(user); A.toast("Perfil actualizado.", "ok"); route();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    root = document.getElementById("app");
    window.addEventListener("hashchange", route);
    try { route(); } catch (e) { console.error(e); root.innerHTML = '<p style="padding:40px">No se pudo cargar el aula. Recargue la página.</p>'; }
  });
})();
