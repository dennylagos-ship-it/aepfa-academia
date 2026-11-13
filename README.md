<p align="center">
  <img src=".github/frontino-oso.png" alt="Frontino Software Solutions" height="96">
</p>

<h1 align="center">AEPFA · Web + Aula Virtual</h1>
<p align="center"><b>Academia de Educación Permanente y Fortalecimiento del Aprendizaje</b><br>Formación en salud con aula virtual y certificados verificables · versión demo</p>

<p align="center">
  <img src="https://img.shields.io/badge/sitio-HTML%20%2B%20JS-1B2A41?logo=html5&logoColor=white" alt="sitio: HTML + JS">
  <img src="https://img.shields.io/badge/hosting-GitHub%20Pages-1B2A41?logo=github&logoColor=white" alt="hosting: GitHub Pages">
  <img src="https://img.shields.io/badge/estado-demo-F59E0B" alt="estado: demo">
</p>

---

## ¿Qué es?

Sitio web y **aula virtual** para AEPFA, academia de formación en salud inscrita en el MPPE (primeros auxilios, enfermería, flebotomía, bioseguridad y más). Los estudiantes estudian en línea, presentan sus evaluaciones y descargan su certificado; el docente maneja todo desde su panel.

🌐 **Demo:** https://dennylagos-ship-it.github.io/aepfa-academia/

## Funciones principales

**Web pública**
- Presentación de la academia, programas y metodología.
- Inscripción directa por **WhatsApp** con el mensaje ya escrito.
- **Verificación de certificados** con código QR (`verificar.html`).

**Aula virtual** (`aula.html`)
- Cursos con módulos, lecciones en video y PDF.
- Evaluaciones con nota automática.
- **Certificado descargable** con código QR verificable.

**Panel docente y administración** (`admin.html`)
- Crear programas, módulos, lecciones y evaluaciones.
- Subir videos y PDF, gestionar estudiantes y solicitudes de inscripción.
- Restablecer los cursos de ejemplo desde el Resumen.

## Tecnologías

HTML, CSS y JavaScript puros (sin compilación), animaciones con GSAP + ScrollTrigger y códigos QR con `lib/qrcode.js`. En esta versión demo los datos se guardan en el navegador (`localStorage`); para uso real con varios usuarios se conecta a **Supabase** (base de datos, archivos e inicio de sesión).

## Páginas
- `index.html` — web pública (programas, metodología, inscripción por WhatsApp)
- `aula.html` — aula virtual de estudiantes (cursos, lecciones, evaluaciones, certificado)
- `admin.html` — panel docente (crear programas, módulos, lecciones, subir videos/PDF, estudiantes, solicitudes)

## Cuentas de demostración
| Rol | Correo | Contraseña |
|---|---|---|
| Administración | admin@aepfa.edu.ve | admin123 |
| Docente | docente@aepfa.edu.ve | docente123 |
| Estudiante | estudiante@aepfa.edu.ve | demo123 |

## Importante (modo demo)
Los datos y archivos se guardan **en el navegador de quien la usa**. Sirve para mostrar el funcionamiento;
para uso real con varios usuarios hay que conectarla a Supabase (base de datos + archivos + inicio de sesión).
Desde el Resumen del panel (cuenta admin) se pueden restablecer los cursos de ejemplo.

## Publicar
- **Netlify:** arrastre esta carpeta a https://app.netlify.com/drop
- **Hostinger:** suba el contenido de la carpeta a `public_html` (incluye `.htaccess`).

## Ajustes rápidos
WhatsApp, horario y datos legales: `js/config.js`.

---

## Licencia

Desarrollado por **Frontino Software Solutions** para **AEPFA**. El código es © 2026 Frontino Software Solutions; la marca, los textos y las imágenes pertenecen a AEPFA.

<p align="center">
  <img src=".github/frontino-oso.png" alt="Frontino Software Solutions" height="56"><br>
  <b>Frontino Software Solutions</b> · Táchira, Venezuela<br>
  <i>«El poder de las grandes ideas hecho software»</i><br>
  Apps Android · páginas web · aulas virtuales · sistemas a la medida · chatbots con IA<br>
  📱 WhatsApp: <a href="https://wa.me/584247714625">+58 424 771 4625</a> · Instagram: <a href="https://instagram.com/frontino.software">@frontino.software</a>
</p>
