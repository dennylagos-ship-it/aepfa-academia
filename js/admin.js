/* =========================================================================
   AEPFA — Panel docente / administración
   Rutas: #/  ·  #/cursos  ·  #/curso/:id|nuevo  ·  #/estudiantes  ·  #/solicitudes  ·  #/docentes
   ========================================================================= */
(function () {
  "use strict";
  var A = window.AEPFA, UI = window.AEPFA_UI, CFG = window.AEPFA_CONFIG;
  var root, main, user;
  var KSHORT = { text: "TXT", video: "VID", pdf: "PDF", file: "ARC", link: "URL", quiz: "EVA" };

  function isAdmin() { return user.role === "admin"; }
  function myCourses() { return A.db().courses.filter(function (c) { return A.canEdit(user, c); }); }
  function newLeads() { return A.db().leads.filter(function (l) { return l.status === "nuevo"; }).length; }

  function route() {
    user = A.session();
    if (!user || user.role === "student") {
      if (user) A.logout();
      UI.renderAuth(root, { staff: true, onDone: route }); return;
    }
    var parts = location.hash.replace(/^#\/?/, "").split("/"), key = parts[0] || "inicio";
    var items = [
      { key: "inicio", href: "#/", icon: "ecg", label: "Resumen" },
      { key: "cursos", href: "#/cursos", icon: "book", label: "Programas" },
      { key: "estudiantes", href: "#/estudiantes", icon: "hands", label: "Estudiantes" },
      { key: "solicitudes", href: "#/solicitudes", icon: "folder", label: "Solicitudes", count: newLeads() }
    ];
    if (isAdmin()) items.push({ key: "docentes", href: "#/docentes", icon: "shield", label: "Docentes" });
    items.push("-", { key: "aula", href: "aula.html", icon: "cross", label: "Ver el aula" }, { key: "web", href: "index.html", icon: "heart", label: "Ver la web" });
    main = UI.renderShell(root, user, items, key === "curso" ? "cursos" : key, "Panel docente");
    window.scrollTo(0, 0);
    if (key === "cursos") return viewCourses();
    if (key === "curso") return viewEditor(parts[1]);
    if (key === "estudiantes") return viewStudents();
    if (key === "solicitudes") return viewLeads();
    if (key === "docentes" && isAdmin()) return viewTeachers();
    viewDash();
  }

  /* ---------- Resumen ---------- */
  function viewDash() {
    var db = A.db(), cs = myCourses(), ids = cs.map(function (c) { return c.id; });
    var enr = db.enrollments.filter(function (e) { return ids.indexOf(e.courseId) >= 0; });
    var studs = {}; enr.forEach(function (e) { studs[e.userId] = 1; });
    var completed = enr.filter(function (e) { var c = A.courseById(e.courseId); return c && A.progressOf(e.userId, c).pct === 100; }).length;
    var lessons = cs.reduce(function (s, c) { return s + A.allLessons(c).length; }, 0);
    main.innerHTML =
      '<div class="page-head"><div><h1>Buen día.</h1><p>' + A.esc(user.name) + " · resumen de la actividad académica.</p></div>" +
      '<a class="btn btn-wine" href="#/curso/nuevo">+ Nuevo programa</a></div>' +
      '<div class="stats">' +
        stat(cs.length, "programas a su cargo") + stat(lessons, "lecciones publicadas") + stat(Object.keys(studs).length, "estudiantes activos") + stat(completed, "programas aprobados") +
      "</div>" +
      '<div class="editor" style="grid-template-columns:1.4fr 1fr">' +
        '<div class="panel"><h2>Avance por programa</h2>' + (cs.length ? '<div class="table-wrap" style="border:0"><table><thead><tr><th>Programa</th><th>Estudiantes</th><th>Avance promedio</th></tr></thead><tbody>' +
          cs.map(function (c) {
            var st = A.studentsOf(c.id), avg = st.length ? Math.round(st.reduce(function (s, e) { return s + A.progressOf(e.userId, c).pct; }, 0) / st.length) : 0;
            return '<tr><td><a href="#/curso/' + c.id + '" style="color:var(--wine);font-weight:600;text-decoration:none">' + A.esc(c.title) + "</a></td><td>" + st.length + '</td><td style="min-width:160px"><div class="bar"><i style="width:' + avg + '%"></i></div><small class="hint">' + avg + " %</small></td></tr>";
          }).join("") + "</tbody></table></div>" : "<p>Aún no hay programas.</p>") + "</div>" +
        '<div class="panel"><h2>Solicitudes recientes</h2>' + leadsMini() + '<p style="margin-top:14px"><a class="btn btn-line btn-sm" href="#/solicitudes">Ver todas</a></p></div>' +
      "</div>" +
      (isAdmin() ? '<p class="hint" style="margin-top:30px">Modo demostración: los datos se guardan en este navegador. <button class="btn btn-ghost btn-sm" data-reset>Restablecer datos de ejemplo</button></p>' : "");
    var r = main.querySelector("[data-reset]");
    if (r) r.addEventListener("click", function () {
      UI.confirm("Se borrarán los cambios y archivos subidos y se cargarán de nuevo los cursos de ejemplo.", "Restablecer").then(function (ok) {
        if (!ok) return; A.reset(); A.login("admin@aepfa.edu.ve", "admin123"); A.toast("Datos de ejemplo restablecidos.", "ok"); route();
      });
    });
  }
  function stat(n, l) { return '<div class="stat"><b>' + n + "</b><span>" + l + "</span></div>"; }
  function leadsMini() {
    var ls = A.db().leads.slice(0, 4);
    if (!ls.length) return '<p class="hint">Sin solicitudes por ahora.</p>';
    return ls.map(function (l) {
      var c = A.courseById(l.courseId);
      return '<div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><span class="avatar">' + UI.initials(l.name) + '</span><div style="flex:1;min-width:0"><strong style="display:block;font-size:.9rem">' + A.esc(l.name) + '</strong><small class="hint">' + A.esc(c ? c.title : "Sin programa definido") + "</small></div>" + (l.status === "nuevo" ? '<span class="pill gold">Nueva</span>' : '<span class="pill ok">Atendida</span>') + "</div>";
    }).join("");
  }

  /* ---------- Programas ---------- */
  function viewCourses() {
    var cs = myCourses();
    main.innerHTML = '<div class="page-head"><div><h1>Programas</h1><p>Cree cursos, organice módulos y suba contenido.</p></div><a class="btn btn-wine" href="#/curso/nuevo">+ Nuevo programa</a></div>' +
      (cs.length ? '<div class="grid-cards">' + cs.map(function (c) {
        return '<a class="mc" href="#/curso/' + c.id + '">' + A.coverHTML(c) + "<h3>" + A.esc(c.title) + "</h3>" +
          '<div class="mc-foot"><div class="mc-row"><span>' + c.modules.length + " módulos · " + A.allLessons(c).length + " lecciones</span>" +
          (c.published ? '<span class="pill ok">Publicado</span>' : '<span class="pill">Borrador</span>') + '</div><div class="mc-row"><span>' + A.studentsOf(c.id).length + " estudiantes</span><span>Editar →</span></div></div></a>";
      }).join("") + "</div>" : '<div class="empty">' + A.icon("book") + '<h3>Todavía no hay programas</h3><a class="btn btn-wine" href="#/curso/nuevo">Crear el primero</a></div>');
    A.hydrateCovers(main);
  }

  /* ---------- Editor de programa ---------- */
  function viewEditor(id) {
    var isNew = id === "nuevo";
    var c = isNew ? { id: "", title: "", category: CFG.categories[0], level: "Inicial", hours: 20, modality: "Mixta", icon: "book", color: CFG.palettes[0], summary: "", description: "", published: false, featured: false, instructorId: user.role === "instructor" ? user.id : "u-inst", modules: [] } : A.courseById(id);
    if (!c) return viewCourses();
    if (!A.canEdit(user, c)) { main.innerHTML = '<div class="empty"><h3>No tiene permiso para editar este programa.</h3></div>'; return; }
    c = JSON.parse(JSON.stringify(c)); // copia de trabajo
    var teachers = A.db().users.filter(function (u) { return u.role !== "student"; });

    main.innerHTML =
      '<p class="crumbs"><a href="#/cursos">Programas</a> / ' + (isNew ? "Nuevo" : A.esc(c.title)) + "</p>" +
      '<div class="page-head"><div><h1>' + (isNew ? "Nuevo programa" : "Editar programa") + "</h1></div>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + (isNew ? "" : '<a class="btn btn-line btn-sm" href="aula.html#/curso/' + c.id + '">Vista previa</a><button class="btn btn-ghost btn-sm" data-del style="color:var(--err)">Eliminar</button>') +
      '<button class="btn btn-wine btn-sm" data-save>Guardar programa</button></div></div>' +
      '<div class="editor">' +
        '<form class="panel form-grid" data-meta onsubmit="return false">' +
          '<div data-cover-prev></div>' +
          '<div class="cover-up"><label class="btn btn-line btn-sm" style="display:inline-flex">Subir portada<input type="file" accept="image/*" data-cover-file hidden /></label>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-cover-rm' + (c.coverId ? "" : " hidden") + ">Quitar imagen</button></div>" +
          '<label>Título<input name="title" required value="' + A.esc(c.title) + '" placeholder="Ej.: Primeros Auxilios Pediátricos" /></label>' +
          '<label>Resumen <small>(una línea para el catálogo)</small><input name="summary" maxlength="180" value="' + A.esc(c.summary) + '" /></label>' +
          '<label>Descripción<textarea name="description" rows="4">' + A.esc(c.description) + "</textarea></label>" +
          '<div class="row2"><label>Área<select name="category">' + CFG.categories.map(function (k) { return "<option" + (k === c.category ? " selected" : "") + ">" + k + "</option>"; }).join("") + "</select></label>" +
          '<label>Nivel<select name="level">' + ["Inicial", "Intermedio", "Avanzado", "Todos"].map(function (k) { return "<option" + (k === c.level ? " selected" : "") + ">" + k + "</option>"; }).join("") + "</select></label></div>" +
          '<div class="row2"><label>Horas académicas<input name="hours" type="number" min="1" value="' + c.hours + '" /></label>' +
          '<label>Modalidad<select name="modality">' + ["Presencial", "Mixta", "En línea"].map(function (k) { return "<option" + (k === c.modality ? " selected" : "") + ">" + k + "</option>"; }).join("") + "</select></label></div>" +
          (isAdmin() ? '<label>Docente responsable<select name="instructorId">' + teachers.map(function (t) { return '<option value="' + t.id + '"' + (t.id === c.instructorId ? " selected" : "") + ">" + A.esc(t.name) + "</option>"; }).join("") + "</select></label>" : "") +
          '<label>Color de portada</label><div class="swatches" data-sw>' + CFG.palettes.map(function (p) { return '<button type="button" style="background:' + p + '" data-c="' + p + '" aria-pressed="' + (p === c.color) + '" aria-label="Color ' + p + '"></button>'; }).join("") + "</div>" +
          '<label>Ícono</label><div class="icons-pick" data-ic>' + Object.keys(CFG.icons).map(function (k) { return '<button type="button" data-i="' + k + '" aria-pressed="' + (k === c.icon) + '" aria-label="' + k + '">' + A.icon(k) + "</button>"; }).join("") + "</div>" +
          '<div class="switch"><span>Publicado en la web y el catálogo</span><input type="checkbox" name="published"' + (c.published ? " checked" : "") + " /></div>" +
          '<div class="switch"><span>Destacado en la portada</span><input type="checkbox" name="featured"' + (c.featured ? " checked" : "") + " /></div>" +
        "</form>" +
        '<div><div class="panel"><h2>Módulos y lecciones</h2><p class="hint" style="margin:-6px 0 18px">Agregue lecturas, videos, PDF, enlaces y evaluaciones. Los cambios se aplican al pulsar «Guardar programa».</p><div data-mods></div>' +
        '<button class="btn btn-line btn-sm" data-add-mod>+ Agregar módulo</button></div></div>' +
      "</div>";

    var form = main.querySelector("[data-meta]");
    function preview() {
      var box = main.querySelector("[data-cover-prev]");
      box.innerHTML = A.coverHTML(c); A.hydrateCovers(box);
    }
    function readMeta() {
      ["title", "summary", "description", "category", "level", "modality"].forEach(function (k) { c[k] = form[k].value.trim(); });
      c.hours = Math.max(1, +form.hours.value || 1);
      c.published = form.published.checked; c.featured = form.featured.checked;
      if (form.instructorId) c.instructorId = form.instructorId.value;
    }
    form.addEventListener("input", function () { readMeta(); preview(); });
    main.querySelector("[data-sw]").addEventListener("click", function (e) {
      var b = e.target.closest("[data-c]"); if (!b) return;
      c.color = b.dataset.c; this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); preview();
    });
    main.querySelector("[data-ic]").addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]"); if (!b) return;
      c.icon = b.dataset.i; this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); preview();
    });
    main.querySelector("[data-cover-file]").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      A.files.put(f).then(function (fid) { c.coverId = fid; preview(); main.querySelector("[data-cover-rm]").hidden = false; A.toast("Portada cargada.", "ok"); });
    });
    main.querySelector("[data-cover-rm]").addEventListener("click", function () { c.coverId = ""; this.hidden = true; preview(); });

    var modsEl = main.querySelector("[data-mods]");
    function drawMods() {
      modsEl.innerHTML = c.modules.length ? c.modules.map(function (m, i) {
        return '<div class="mod" data-m="' + i + '"><div class="mod-head"><span class="n">' + (i + 1) + '</span><input value="' + A.esc(m.title) + '" data-mtitle aria-label="Título del módulo" />' +
          '<div class="row-actions"><button class="icon-btn" data-mup title="Subir">↑</button><button class="icon-btn" data-mdown title="Bajar">↓</button><button class="icon-btn danger" data-mdel title="Eliminar módulo">×</button></div></div>' +
          m.lessons.map(function (l, j) {
            var meta = A.KIND[l.kind] + " · " + l.minutes + " min" + (l.fileName ? " · " + l.fileName : l.url ? " · enlace" : (l.kind === "video" || l.kind === "pdf") ? " · <span style=\"color:var(--err)\">sin archivo</span>" : "");
            return '<div class="les" data-l="' + j + '"><span class="k">' + KSHORT[l.kind] + '</span><div class="t"><strong>' + A.esc(l.title) + "</strong><small>" + meta + "</small></div>" +
              '<div class="row-actions"><button class="icon-btn" data-lup title="Subir">↑</button><button class="icon-btn" data-ldown title="Bajar">↓</button><button class="icon-btn" data-ledit title="Editar">✎</button><button class="icon-btn danger" data-ldel title="Eliminar">×</button></div></div>';
          }).join("") +
          '<div class="add-les">' + ["text", "video", "pdf", "link", "quiz"].map(function (k) { return '<button data-add="' + k + '">+ ' + A.KIND[k] + "</button>"; }).join("") + "</div></div>";
      }).join("") : '<div class="empty" style="margin-bottom:14px"><p>Comience agregando el primer módulo.</p></div>';
    }
    drawMods(); preview();

    function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    main.querySelector("[data-add-mod]").addEventListener("click", function () {
      c.modules.push({ id: A.uid("m"), title: "Módulo " + (c.modules.length + 1), lessons: [] }); drawMods();
      var ins = modsEl.querySelectorAll("[data-mtitle]"); ins[ins.length - 1].select();
    });
    modsEl.addEventListener("input", function (e) {
      if (e.target.matches("[data-mtitle]")) c.modules[+e.target.closest("[data-m]").dataset.m].title = e.target.value;
    });
    modsEl.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var mi = +b.closest("[data-m]").dataset.m, m = c.modules[mi], le = b.closest("[data-l]"), li = le ? +le.dataset.l : -1;
      if (b.matches("[data-mup]")) move(c.modules, mi, -1);
      else if (b.matches("[data-mdown]")) move(c.modules, mi, 1);
      else if (b.matches("[data-mdel]")) {
        UI.confirm("¿Eliminar el módulo «" + m.title + "» y sus " + m.lessons.length + " lecciones?", "Eliminar").then(function (ok) { if (ok) { c.modules.splice(mi, 1); drawMods(); } });
        return;
      }
      else if (b.matches("[data-lup]")) move(m.lessons, li, -1);
      else if (b.matches("[data-ldown]")) move(m.lessons, li, 1);
      else if (b.matches("[data-ldel]")) { m.lessons.splice(li, 1); }
      else if (b.matches("[data-ledit]")) { lessonModal(m.lessons[li], function (l) { m.lessons[li] = l; drawMods(); }); return; }
      else if (b.matches("[data-add]")) {
        var nl = { id: A.uid("l"), kind: b.dataset.add, title: "", minutes: 10, body: b.dataset.add === "quiz" ? "[]" : "", url: "", fileId: "", fileName: "" };
        lessonModal(nl, function (l) { m.lessons.push(l); drawMods(); }); return;
      }
      drawMods();
    });

    main.querySelector("[data-save]").addEventListener("click", function () {
      readMeta();
      if (!c.title) { form.title.classList.add("invalid"); form.title.focus(); return A.toast("El programa necesita un título.", "err"); }
      if (!c.summary) c.summary = c.description.slice(0, 160);
      if (isNew) c.slug = A.slugify(c.title);
      A.upsertCourse(c);
      A.toast("Programa guardado.", "ok");
      if (isNew) location.hash = "#/curso/" + c.id; else route();
    });
    var del = main.querySelector("[data-del]");
    if (del) del.addEventListener("click", function () {
      UI.confirm("¿Eliminar «" + c.title + "»? Se perderán sus lecciones, archivos e inscripciones.", "Eliminar").then(function (ok) {
        if (ok) { A.deleteCourse(c.id); A.toast("Programa eliminado."); location.hash = "#/cursos"; }
      });
    });
  }

  /* ---------- Editor de lección ---------- */
  function lessonModal(src, onSave) {
    var l = JSON.parse(JSON.stringify(src)), k = l.kind;
    var qs = []; if (k === "quiz") try { qs = JSON.parse(l.body || "[]"); } catch (e) {}
    if (k === "quiz" && !qs.length) qs.push({ q: "", o: ["", "", ""], a: 0 });
    var accept = k === "video" ? "video/*" : k === "pdf" ? "application/pdf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" : "*/*";

    var body =
      '<div class="row2"><label>Tipo<select data-kind>' + Object.keys(A.KIND).filter(function (x) { return x !== "file"; }).map(function (x) { return '<option value="' + x + '"' + (x === k ? " selected" : "") + ">" + A.KIND[x] + "</option>"; }).join("") + "</select></label>" +
      '<label>Duración (min)<input type="number" min="1" data-min value="' + l.minutes + '" /></label></div>' +
      '<label>Título de la lección<input data-title value="' + A.esc(l.title) + '" placeholder="Ej.: Valoración primaria" /></label>';
    if (k === "video" || k === "pdf") {
      body += '<label class="file-drop" data-drop>' + A.icon("folder") + '<span data-fname>' + (l.fileName ? "Archivo actual: <strong>" + A.esc(l.fileName) + "</strong> · pulse para reemplazar" : "Arrastre aquí el " + (k === "video" ? "video (MP4)" : "documento (PDF)") + " o pulse para elegirlo") + '</span><input type="file" accept="' + accept + '" data-file /></label>' +
        '<label>' + (k === "video" ? "…o pegue un enlace de YouTube" : "…o pegue un enlace (Google Drive, etc.)") + '<input data-url value="' + A.esc(l.url) + '" placeholder="https://" /></label>' +
        '<label>Notas para el estudiante <small>(opcional)</small><textarea rows="3" data-body>' + A.esc(l.body) + "</textarea></label>";
    } else if (k === "link") {
      body += '<label>Enlace<input data-url value="' + A.esc(l.url) + '" placeholder="https://" /></label><label>Descripción<textarea rows="3" data-body>' + A.esc(l.body) + "</textarea></label>";
    } else if (k === "text") {
      body += '<label>Contenido<textarea rows="12" data-body placeholder="## Subtítulo&#10;&#10;Párrafo de texto…&#10;&#10;- Punto de lista&#10;- **Texto en negrita**">' + A.esc(l.body) + '</textarea><span class="hint">Formato: «## » para subtítulos, «- » para listas y **texto** para negritas.</span></label>';
    } else if (k === "quiz") {
      body += '<div data-qs style="display:grid;gap:12px"></div><button type="button" class="btn btn-line btn-sm" data-addq style="justify-self:start">+ Agregar pregunta</button><p class="hint">Marque con el círculo la respuesta correcta. Se aprueba con 70 %.</p>';
    }
    var d = UI.modal(src.title ? "Editar lección" : "Nueva lección", body, '<button class="btn btn-line btn-sm" data-x>Cancelar</button><button class="btn btn-wine btn-sm" data-ok>Guardar lección</button>');
    var $ = function (s) { return d.querySelector(s); };
    var pendingFile = null;

    $("[data-kind]").addEventListener("change", function () {
      // cambia de tipo conservando título
      l.title = $("[data-title]").value; l.kind = this.value;
      if (l.kind === "quiz" && !/^\[/.test(l.body)) l.body = "[]";
      if (l.kind !== "quiz" && /^\[/.test(l.body)) l.body = "";
      d.close(); setTimeout(function () { lessonModal(l, onSave); }, 60);
    });

    var fileIn = $("[data-file]");
    if (fileIn) {
      var drop = $("[data-drop]");
      var take = function (f) { if (!f) return; pendingFile = f; $("[data-fname]").innerHTML = "Listo para subir: <strong>" + A.esc(f.name) + "</strong> (" + (f.size / 1048576).toFixed(1) + " MB)"; };
      fileIn.addEventListener("change", function () { take(fileIn.files[0]); });
      ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("drag"); }); });
      ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("drag"); }); });
      drop.addEventListener("drop", function (e) { take(e.dataTransfer.files[0]); });
    }

    function drawQs() {
      $("[data-qs]").innerHTML = qs.map(function (q, i) {
        return '<div class="qb" data-q="' + i + '"><div style="display:flex;gap:8px"><input data-qq value="' + A.esc(q.q) + '" placeholder="Pregunta ' + (i + 1) + '" /><button type="button" class="icon-btn danger" data-qdel title="Quitar pregunta">×</button></div>' +
          q.o.map(function (o, j) { return '<div class="qb-opt"><input type="radio" name="ok' + i + '" value="' + j + '"' + (q.a === j ? " checked" : "") + ' title="Respuesta correcta" /><input data-qo="' + j + '" value="' + A.esc(o) + '" placeholder="Opción ' + (j + 1) + '" /></div>'; }).join("") +
          (q.o.length < 5 ? '<button type="button" class="btn btn-ghost btn-sm" data-qadd style="justify-self:start">+ opción</button>' : "") + "</div>";
      }).join("");
    }
    if (k === "quiz") {
      drawQs();
      var qsEl = $("[data-qs]");
      qsEl.addEventListener("input", function (e) {
        var qi = +e.target.closest("[data-q]").dataset.q;
        if (e.target.matches("[data-qq]")) qs[qi].q = e.target.value;
        if (e.target.matches("[data-qo]")) qs[qi].o[+e.target.dataset.qo] = e.target.value;
      });
      qsEl.addEventListener("change", function (e) { if (e.target.type === "radio") qs[+e.target.closest("[data-q]").dataset.q].a = +e.target.value; });
      qsEl.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return; var qi = +b.closest("[data-q]").dataset.q;
        if (b.matches("[data-qdel]")) qs.splice(qi, 1); if (b.matches("[data-qadd]")) qs[qi].o.push("");
        drawQs();
      });
      $("[data-addq]").addEventListener("click", function () { qs.push({ q: "", o: ["", "", ""], a: 0 }); drawQs(); });
    }

    $("[data-ok]").addEventListener("click", function () {
      l.title = $("[data-title]").value.trim();
      if (!l.title) { $("[data-title]").classList.add("invalid"); return A.toast("Escriba el título de la lección.", "err"); }
      l.minutes = Math.max(1, +$("[data-min]").value || 1);
      if ($("[data-url]")) l.url = $("[data-url]").value.trim();
      if (k === "quiz") {
        var clean = qs.map(function (q) { var o = q.o.map(function (x) { return x.trim(); }); return { q: q.q.trim(), o: o, a: q.a }; })
          .filter(function (q) { return q.q && q.o.filter(Boolean).length >= 2 && q.o[q.a]; })
          .map(function (q) { var ans = q.o[q.a], o = q.o.filter(Boolean); return { q: q.q, o: o, a: o.indexOf(ans) }; });
        if (!clean.length) return A.toast("Agregue al menos una pregunta con dos opciones y la respuesta marcada.", "err");
        l.body = JSON.stringify(clean);
      } else if ($("[data-body]")) l.body = $("[data-body]").value;

      var btn = this;
      if (pendingFile) {
        btn.disabled = true; btn.textContent = "Subiendo…";
        var old = l.fileId;
        A.files.put(pendingFile).then(function (fid) {
          if (old) A.files.del(old);
          l.fileId = fid; l.fileName = pendingFile.name; d.close(); onSave(l); A.toast("Archivo subido. Recuerde guardar el programa.", "ok");
        }).catch(function () { btn.disabled = false; btn.textContent = "Guardar lección"; A.toast("No se pudo guardar el archivo en este navegador.", "err"); });
      } else { d.close(); onSave(l); }
    });
  }

  /* ---------- Estudiantes ---------- */
  function viewStudents() {
    var db = A.db(), cs = myCourses(), ids = cs.map(function (c) { return c.id; });
    var studs = db.users.filter(function (u) { return u.role === "student" && (isAdmin() || db.enrollments.some(function (e) { return e.userId === u.id && ids.indexOf(e.courseId) >= 0; })); });
    main.innerHTML = '<div class="page-head"><div><h1>Estudiantes</h1><p>' + studs.length + " registrados</p></div>" + '<button class="btn btn-wine" data-new>+ Nuevo estudiante</button></div>' +
      '<div class="toolbar"><input type="search" placeholder="Buscar por nombre, correo o cédula" data-q /></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Contacto</th><th>Programas y avance</th><th></th></tr></thead><tbody data-rows></tbody></table></div>';
    function rows(q) {
      q = (q || "").toLowerCase();
      main.querySelector("[data-rows]").innerHTML = studs.filter(function (u) { return !q || (u.name + u.email + u.cedula).toLowerCase().indexOf(q) >= 0; }).map(function (u) {
        var en = A.enrollmentsOf(u.id).filter(function (e) { return isAdmin() || ids.indexOf(e.courseId) >= 0; });
        return '<tr data-u="' + u.id + '"><td><div class="who"><span class="avatar">' + UI.initials(u.name) + "</span><div><strong>" + A.esc(u.name) + "</strong><small>" + A.esc(u.cedula || "—") + "</small></div></div></td>" +
          "<td>" + A.esc(u.email) + "<br /><small class=\"hint\">" + A.esc(u.phone || "") + "</small></td>" +
          '<td style="min-width:240px">' + (en.length ? en.map(function (e) {
            var c = A.courseById(e.courseId); if (!c) return ""; var p = A.progressOf(u.id, c);
            return '<div style="display:grid;grid-template-columns:1fr 70px 26px;gap:8px;align-items:center;margin:4px 0"><small>' + A.esc(c.title) + '</small><div class="bar"><i style="width:' + p.pct + '%"></i></div><button class="icon-btn danger" style="width:26px;height:26px" data-unenroll="' + c.id + '" title="Retirar del programa">×</button></div>';
          }).join("") : '<small class="hint">Sin programas</small>') + "</td>" +
          '<td><div class="row-actions"><button class="btn btn-line btn-sm" data-enroll>Inscribir</button>' + (isAdmin() ? '<button class="icon-btn danger" data-del title="Eliminar">×</button>' : "") + "</div></td></tr>";
      }).join("") || '<tr><td colspan="4" class="hint">Sin resultados.</td></tr>';
    }
    rows();
    main.querySelector("[data-q]").addEventListener("input", function () { rows(this.value); });
    main.querySelector("[data-new]").addEventListener("click", function () { studentModal(); });
    main.querySelector("[data-rows]").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var u = A.userById(b.closest("[data-u]").dataset.u);
      if (b.matches("[data-enroll]")) enrollModal(u);
      if (b.matches("[data-unenroll]")) UI.confirm("¿Retirar a " + u.name + " de este programa?", "Retirar").then(function (ok) { if (ok) { A.unenroll(u.id, b.dataset.unenroll); route(); } });
      if (b.matches("[data-del]")) UI.confirm("¿Eliminar la cuenta de " + u.name + "?", "Eliminar").then(function (ok) { if (ok) { A.deleteUser(u.id); route(); } });
    });
  }
  function enrollModal(u, preselect, after) {
    var cs = myCourses().filter(function (c) { return !A.isEnrolled(u.id, c.id); });
    if (!cs.length) return A.toast(u.name + " ya está en todos sus programas.");
    var d = UI.modal("Inscribir a " + u.name, '<label>Programa<select data-c>' + cs.map(function (c) { return '<option value="' + c.id + '"' + (c.id === preselect ? " selected" : "") + ">" + A.esc(c.title) + "</option>"; }).join("") + "</select></label><p class=\"hint\">El estudiante verá el programa en «Mis cursos» de inmediato.</p>",
      '<button class="btn btn-line btn-sm" data-x>Cancelar</button><button class="btn btn-wine btn-sm" data-ok>Inscribir</button>');
    d.querySelector("[data-ok]").addEventListener("click", function () {
      A.enroll(u.id, d.querySelector("[data-c]").value); d.close(); A.toast("Inscripción activada.", "ok");
      after ? after() : route();
    });
  }
  function studentModal(prefill, after) {
    prefill = prefill || {};
    var d = UI.modal("Nuevo estudiante",
      '<label>Nombre y apellido<input data-f="name" value="' + A.esc(prefill.name || "") + '" /></label>' +
      '<div class="row2"><label>Cédula<input data-f="cedula" /></label><label>Teléfono<input data-f="phone" value="' + A.esc(prefill.phone || "") + '" /></label></div>' +
      '<label>Correo (usuario)<input type="email" data-f="email" value="' + A.esc(prefill.email || "") + '" /></label>' +
      '<label>Contraseña inicial<input data-f="pass" value="' + Math.random().toString(36).slice(2, 8) + '" /></label>' +
      '<label>Inscribir en<select data-f="course"><option value="">— Ninguno por ahora —</option>' + myCourses().map(function (c) { return '<option value="' + c.id + '"' + (c.id === prefill.courseId ? " selected" : "") + ">" + A.esc(c.title) + "</option>"; }).join("") + "</select></label>",
      '<button class="btn btn-line btn-sm" data-x>Cancelar</button><button class="btn btn-wine btn-sm" data-ok>Crear cuenta</button>');
    d.querySelector("[data-ok]").addEventListener("click", function () {
      var v = {}; d.querySelectorAll("[data-f]").forEach(function (i) { v[i.dataset.f] = i.value.trim(); });
      try {
        var u = A.register(v);
        if (v.course) A.enroll(u.id, v.course);
        d.close();
        var msg = "Hola " + u.name.split(" ")[0] + ", bienvenido(a) al aula virtual de AEPFA. Ingrese en " + location.href.replace(/admin\.html.*$/, "aula.html") + " con su correo " + u.email + " y la contraseña " + v.pass + ".";
        UI.modal("Cuenta creada", "<p>Envíe los datos de acceso a <strong>" + A.esc(u.name) + "</strong>:</p><p class=\"panel\" style=\"font-size:.9rem\">" + A.esc(msg) + "</p>",
          (u.phone ? '<a class="btn btn-wine btn-sm" target="_blank" rel="noopener" href="https://wa.me/58' + u.phone.replace(/\D/g, "").replace(/^0/, "") + "?text=" + encodeURIComponent(msg) + '">Enviar por WhatsApp</a>' : "") + '<button class="btn btn-line btn-sm" data-x>Listo</button>')
          .addEventListener("close", function () { after ? after(u) : route(); });
      } catch (e) { A.toast(e.message, "err"); }
    });
  }

  /* ---------- Solicitudes ---------- */
  function viewLeads() {
    var ls = A.db().leads;
    main.innerHTML = '<div class="page-head"><div><h1>Solicitudes</h1><p>Personas que pidieron inscribirse desde la web o el aula.</p></div></div>' +
      (ls.length ? '<div class="table-wrap"><table><thead><tr><th>Persona</th><th>Programa</th><th>Mensaje</th><th>Fecha</th><th></th></tr></thead><tbody>' +
      ls.map(function (l) {
        var c = A.courseById(l.courseId), wa = l.phone ? "https://wa.me/58" + l.phone.replace(/\D/g, "").replace(/^(58)?0?/, "") + "?text=" + encodeURIComponent("Hola " + l.name.split(" ")[0] + ", le escribimos de AEPFA por su solicitud" + (c ? " para «" + c.title + "»" : "") + ".") : "";
        return '<tr data-id="' + l.id + '"><td><div class="who"><span class="avatar">' + UI.initials(l.name) + "</span><div><strong>" + A.esc(l.name) + "</strong><small>" + A.esc(l.phone || "") + " " + A.esc(l.email || "") + "</small></div></div></td>" +
          "<td>" + A.esc(c ? c.title : "—") + "</td><td><small>" + A.esc(l.message || "") + "</small></td><td><small>" + A.fmtDate(l.date) + "</small></td>" +
          '<td><div class="row-actions">' + (l.status === "nuevo" ? '<span class="pill gold">Nueva</span>' : '<span class="pill ok">Atendida</span>') +
          (wa ? '<a class="icon-btn" target="_blank" rel="noopener" href="' + wa + '" title="Escribir por WhatsApp">✆</a>' : "") +
          (l.status === "nuevo" ? '<button class="btn btn-wine btn-sm" data-accept>Dar acceso</button>' : "") +
          '<button class="icon-btn danger" data-del title="Eliminar">×</button></div></td></tr>';
      }).join("") + "</tbody></table></div>" : '<div class="empty">' + A.icon("folder") + "<h3>Sin solicitudes</h3><p>Las inscripciones de la web aparecerán aquí.</p></div>");
    main.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var tr = b.closest("[data-id]"); if (!tr) return;
      var l = A.db().leads.filter(function (x) { return x.id === tr.dataset.id; })[0];
      var done = function () { l.status = "atendido"; A.save(); route(); };
      if (b.matches("[data-del]")) { A.db().leads = A.db().leads.filter(function (x) { return x !== l; }); A.save(); route(); }
      if (b.matches("[data-accept]")) {
        var u = l.userId ? A.userById(l.userId) : A.db().users.filter(function (x) { return l.email && x.email.toLowerCase() === l.email.toLowerCase(); })[0];
        if (u) { if (l.courseId && !A.isEnrolled(u.id, l.courseId)) { A.enroll(u.id, l.courseId); A.toast("Acceso activado para " + u.name + ".", "ok"); done(); } else enrollModal(u, l.courseId, done); }
        else studentModal(l, function () { done(); });
      }
    });
  }

  /* ---------- Docentes (solo administración) ---------- */
  function viewTeachers() {
    var ts = A.db().users.filter(function (u) { return u.role !== "student"; });
    main.innerHTML = '<div class="page-head"><div><h1>Docentes</h1><p>Cuentas con acceso al panel.</p></div><button class="btn btn-wine" data-new>+ Nuevo docente</button></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Programas</th></tr></thead><tbody>' +
      ts.map(function (u) {
        return '<tr><td><div class="who"><span class="avatar">' + UI.initials(u.name) + "</span><strong>" + A.esc(u.name) + "</strong></div></td><td>" + A.esc(u.email) + '</td><td><span class="pill ' + (u.role === "admin" ? "wine" : "") + '">' + UI.ROLE[u.role] + "</span></td><td>" +
          A.db().courses.filter(function (c) { return c.instructorId === u.id; }).length + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    main.querySelector("[data-new]").addEventListener("click", function () {
      var d = UI.modal("Nuevo docente", '<label>Nombre<input data-f="name" placeholder="Lcdo. …" /></label><label>Correo<input type="email" data-f="email" /></label><label>Contraseña<input data-f="pass" value="' + Math.random().toString(36).slice(2, 8) + '" /></label><label>Rol<select data-f="role"><option value="instructor">Docente</option><option value="admin">Administración</option></select></label>',
        '<button class="btn btn-line btn-sm" data-x>Cancelar</button><button class="btn btn-wine btn-sm" data-ok>Crear</button>');
      d.querySelector("[data-ok]").addEventListener("click", function () {
        var v = {}; d.querySelectorAll("[data-f]").forEach(function (i) { v[i.dataset.f] = i.value.trim(); });
        try { A.register(v); d.close(); A.toast("Docente creado.", "ok"); route(); } catch (e) { A.toast(e.message, "err"); }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    root = document.getElementById("app");
    window.addEventListener("hashchange", route);
    try { route(); } catch (e) { console.error(e); root.innerHTML = '<p style="padding:40px">No se pudo cargar el panel. Recargue la página.</p>'; }
  });
})();
