/* =========================================================================
   AEPFA — Capa de datos (modo DEMO)
   Guarda todo en el navegador: localStorage para datos, IndexedDB para
   archivos (videos, PDF, portadas). Misma interfaz que usará la versión
   conectada a Supabase, para poder cambiar el backend sin tocar las vistas.
   ========================================================================= */
(function () {
  "use strict";

  var KEY = "aepfa_demo_v1";
  var SKEY = "aepfa_session_v1";
  var CFG = window.AEPFA_CONFIG;

  /* ---------- utilidades ---------- */
  function uid(p) { return (p || "id") + "-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slugify(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || uid("curso");
  }
  function fmtDate(ts) {
    try { return new Date(ts).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return new Date(ts).toDateString(); }
  }

  /* ---------- persistencia ---------- */
  var mem = null;
  function load() {
    if (mem) return mem;
    try { var raw = localStorage.getItem(KEY); if (raw) mem = JSON.parse(raw); } catch (e) {}
    if (!mem) { mem = clone(window.AEPFA_SEED); save(); }
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { console.warn("[AEPFA] no se pudo guardar", e); } }
  function reset() { mem = clone(window.AEPFA_SEED); save(); files.clear(); }

  /* ---------- archivos (IndexedDB) ---------- */
  var files = (function () {
    var dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        if (!window.indexedDB) return rej(new Error("IndexedDB no disponible"));
        var r = indexedDB.open("aepfa_files", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
      return dbp;
    }
    function tx(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (res, rej) {
          var t = db.transaction("files", mode), st = t.objectStore("files"), out = fn(st);
          t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
          t.onerror = function () { rej(t.error); };
        });
      });
    }
    var urlCache = {};
    return {
      put: function (file) {
        var id = uid("f");
        return tx("readwrite", function (st) { st.put({ blob: file, name: file.name, type: file.type, size: file.size }, id); }).then(function () { return id; });
      },
      url: function (id) {
        if (!id) return Promise.resolve("");
        if (urlCache[id]) return Promise.resolve(urlCache[id]);
        return tx("readonly", function (st) { return st.get(id); }).then(function (rec) {
          if (!rec) return "";
          urlCache[id] = URL.createObjectURL(rec.blob);
          return urlCache[id];
        }).catch(function () { return ""; });
      },
      del: function (id) { if (!id) return Promise.resolve(); return tx("readwrite", function (st) { st.delete(id); }).catch(function () {}); },
      clear: function () { return tx("readwrite", function (st) { st.clear(); }).catch(function () {}); }
    };
  })();

  /* ---------- sesión ---------- */
  function session() {
    try { var id = localStorage.getItem(SKEY); return id ? userById(id) : null; } catch (e) { return null; }
  }
  function login(email, pass) {
    var u = load().users.filter(function (x) { return x.email.toLowerCase() === String(email).trim().toLowerCase(); })[0];
    if (!u || u.pass !== pass) throw new Error("Correo o contraseña incorrectos.");
    localStorage.setItem(SKEY, u.id);
    return u;
  }
  function logout() { localStorage.removeItem(SKEY); }
  function register(data) {
    var db = load();
    if (!data.name || !data.email || !data.pass) throw new Error("Complete nombre, correo y contraseña.");
    if (db.users.some(function (x) { return x.email.toLowerCase() === data.email.trim().toLowerCase(); })) throw new Error("Ya existe una cuenta con ese correo.");
    var u = { id: uid("u"), name: data.name.trim(), email: data.email.trim(), pass: data.pass, role: data.role || "student", phone: data.phone || "", cedula: data.cedula || "", created: Date.now() };
    db.users.push(u); save();
    return u;
  }

  /* ---------- consultas ---------- */
  function userById(id) { return load().users.filter(function (u) { return u.id === id; })[0] || null; }
  function courseById(id) { return load().courses.filter(function (c) { return c.id === id; })[0] || null; }
  function courseBySlug(s) { return load().courses.filter(function (c) { return c.slug === s; })[0] || null; }
  function allLessons(c) { var o = []; (c.modules || []).forEach(function (m) { (m.lessons || []).forEach(function (l) { o.push(l); }); }); return o; }
  function findLesson(c, lid) {
    var r = null;
    (c.modules || []).forEach(function (m) { (m.lessons || []).forEach(function (l) { if (l.id === lid) r = { module: m, lesson: l }; }); });
    return r;
  }
  function isEnrolled(uidv, cid) { return load().enrollments.some(function (e) { return e.userId === uidv && e.courseId === cid; }); }
  function enrollmentsOf(uidv) { return load().enrollments.filter(function (e) { return e.userId === uidv; }); }
  function studentsOf(cid) { return load().enrollments.filter(function (e) { return e.courseId === cid; }); }
  function progressOf(uidv, c) {
    var p = load().progress[uidv] || {}, ls = allLessons(c), done = ls.filter(function (l) { return p[l.id]; }).length;
    return { done: done, total: ls.length, pct: ls.length ? Math.round(done / ls.length * 100) : 0, map: p };
  }
  function canEdit(u, c) { return u && (u.role === "admin" || (u.role === "instructor" && (!c || c.instructorId === u.id))); }

  /* ---------- escritura ---------- */
  function upsertCourse(c) {
    var db = load(), i = db.courses.findIndex(function (x) { return x.id === c.id; });
    if (!c.id) c.id = uid("c");
    if (!c.slug) c.slug = slugify(c.title);
    if (!c.modules) c.modules = [];
    if (i >= 0) db.courses[i] = c; else db.courses.unshift(c);
    save(); return c;
  }
  function deleteCourse(id) {
    var db = load(), c = courseById(id);
    if (c) { allLessons(c).forEach(function (l) { files.del(l.fileId); }); files.del(c.coverId); }
    db.courses = db.courses.filter(function (x) { return x.id !== id; });
    db.enrollments = db.enrollments.filter(function (e) { return e.courseId !== id; });
    save();
  }
  function enroll(uidv, cid) { if (!isEnrolled(uidv, cid)) { load().enrollments.push({ userId: uidv, courseId: cid, date: Date.now() }); save(); } }
  function unenroll(uidv, cid) { var db = load(); db.enrollments = db.enrollments.filter(function (e) { return !(e.userId === uidv && e.courseId === cid); }); save(); }
  function markLesson(uidv, lid, done) {
    var db = load(); db.progress[uidv] = db.progress[uidv] || {};
    if (done) db.progress[uidv][lid] = Date.now(); else delete db.progress[uidv][lid];
    save();
  }
  function addLead(d) {
    var l = { id: uid("ld"), name: d.name, phone: d.phone, email: d.email || "", courseId: d.courseId || "", message: d.message || "", date: Date.now(), status: "nuevo", userId: d.userId || "" };
    load().leads.unshift(l); save(); return l;
  }
  function updateUser(u) { var db = load(), i = db.users.findIndex(function (x) { return x.id === u.id; }); if (i >= 0) { db.users[i] = u; save(); } }
  function deleteUser(id) {
    var db = load();
    db.users = db.users.filter(function (u) { return u.id !== id; });
    db.enrollments = db.enrollments.filter(function (e) { return e.userId !== id; });
    delete db.progress[id]; save();
  }

  /* ---------- presentación compartida ---------- */
  function icon(name, cls) {
    return '<svg class="' + (cls || "ico") + '" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (CFG.icons[name] || CFG.icons.book) + "</svg>";
  }
  /* Portada: imagen subida o composición tipográfica con el ícono del curso */
  function coverHTML(c, cls) {
    var col = c.color || "#6E1A26";
    return '<div class="cover ' + (cls || "") + '" style="--c:' + col + '" data-cover="' + esc(c.coverId || "") + '">' +
      '<div class="cover-art">' + icon(c.icon) + '</div>' +
      '<span class="cover-cat">' + esc(c.category) + "</span>" +
      '<span class="cover-hours">' + esc(c.hours) + " h</span></div>";
  }
  function hydrateCovers(root) {
    (root || document).querySelectorAll("[data-cover]").forEach(function (el) {
      var id = el.getAttribute("data-cover");
      if (!id || el.dataset.hyd) return;
      el.dataset.hyd = "1";
      files.url(id).then(function (u) { if (u) { el.style.backgroundImage = "url('" + u + "')"; el.classList.add("has-img"); } });
    });
  }
  /* Mini-markdown seguro: ## títulos, - listas, **negrita**, párrafos */
  function md(src) {
    var out = [], list = false;
    String(src || "").split(/\n/).forEach(function (line) {
      var t = line.trim();
      var inline = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); };
      if (/^- /.test(t)) { if (!list) { out.push("<ul>"); list = true; } out.push("<li>" + inline(t.slice(2)) + "</li>"); return; }
      if (list) { out.push("</ul>"); list = false; }
      if (!t) return;
      if (/^## /.test(t)) out.push("<h3>" + inline(t.slice(3)) + "</h3>");
      else out.push("<p>" + inline(t) + "</p>");
    });
    if (list) out.push("</ul>");
    return out.join("");
  }
  function toast(msg, kind) {
    var host = document.querySelector(".toasts");
    if (!host) { host = document.createElement("div"); host.className = "toasts"; host.setAttribute("aria-live", "polite"); document.body.appendChild(host); }
    var t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.textContent = msg; host.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 2800);
    setTimeout(function () { t.remove(); }, 3300);
  }
  function waLink(text) { return "https://wa.me/" + CFG.brand.whatsapp + "?text=" + encodeURIComponent(text); }
  function youtubeEmbed(url) {
    var m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? "https://www.youtube-nocookie.com/embed/" + m[1] : "";
  }
  var KIND = { text: "Lectura", video: "Video", pdf: "Documento PDF", file: "Archivo", link: "Enlace", quiz: "Evaluación" };

  window.AEPFA = {
    db: load, save: save, reset: reset, files: files, uid: uid, esc: esc, slugify: slugify, fmtDate: fmtDate,
    session: session, login: login, logout: logout, register: register,
    userById: userById, courseById: courseById, courseBySlug: courseBySlug, allLessons: allLessons, findLesson: findLesson,
    isEnrolled: isEnrolled, enrollmentsOf: enrollmentsOf, studentsOf: studentsOf, progressOf: progressOf, canEdit: canEdit,
    upsertCourse: upsertCourse, deleteCourse: deleteCourse, enroll: enroll, unenroll: unenroll, markLesson: markLesson,
    addLead: addLead, updateUser: updateUser, deleteUser: deleteUser,
    icon: icon, coverHTML: coverHTML, hydrateCovers: hydrateCovers, md: md, toast: toast, waLink: waLink, youtubeEmbed: youtubeEmbed, KIND: KIND
  };
})();
