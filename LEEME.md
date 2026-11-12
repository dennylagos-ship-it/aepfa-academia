# AEPFA — Web + Aula virtual (versión demo)

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
