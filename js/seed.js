/* =========================================================================
   AEPFA — Datos de demostración (se cargan la primera vez que se abre la web)
   ========================================================================= */
(function () {
  "use strict";

  function L(id, kind, title, minutes, extra) {
    var o = { id: id, kind: kind, title: title, minutes: minutes || 10, body: "", url: "", fileId: "", fileName: "" };
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  function quiz(qs) { return JSON.stringify(qs); }

  var courses = [
    {
      id: "c-rcp", slug: "primeros-auxilios-rcp", title: "Primeros Auxilios y RCP Básico",
      category: "Emergencias", level: "Inicial", hours: 40, modality: "Mixta", icon: "heart", color: "#6E1A26",
      featured: true, published: true, instructorId: "u-inst",
      summary: "Actúe con criterio en los primeros minutos de una emergencia: evaluación, reanimación y control de hemorragias.",
      description: "Curso teórico-práctico orientado a la comunidad, personal de empresas y estudiantes del área de salud. Incluye práctica con maniquí en sede y evaluación final para optar al certificado.",
      modules: [
        { id: "m-rcp-1", title: "Evaluación de la escena y del paciente", lessons: [
          L("l-rcp-1", "text", "Antes de tocar al paciente: seguridad primero", 12, { body:
"## La regla de oro\n\nNingún rescatista ayuda si se convierte en una segunda víctima. Antes de acercarse, observe la escena durante unos segundos.\n\n- **Riesgos visibles:** tránsito, cables eléctricos, fuego, gas, estructuras inestables.\n- **Protección personal:** guantes y barrera para ventilación si están disponibles.\n- **Recursos:** ¿hay alguien que pueda llamar al 911 o buscar un DEA?\n\n## Evaluar la respuesta\n\nToque los hombros del paciente y háblele en voz alta: «¿Se encuentra bien?». Si no responde, pida ayuda de inmediato y verifique si respira con normalidad (no más de 10 segundos).\n\n**Respiraciones agónicas** (boqueos aislados) no son respiración normal: trate al paciente como en paro cardíaco." }),
          L("l-rcp-2", "video", "Demostración: valoración primaria", 8, { body: "Video de demostración grabado por el instructor en sede." })
        ]},
        { id: "m-rcp-2", title: "Reanimación cardiopulmonar en adultos", lessons: [
          L("l-rcp-3", "text", "Compresiones de alta calidad", 15, { body:
"## Dónde y cómo comprimir\n\nColoque el talón de una mano en el centro del pecho, sobre la mitad inferior del esternón, y la otra mano encima. Mantenga los brazos rectos y los hombros sobre las manos.\n\n- **Frecuencia:** 100 a 120 compresiones por minuto.\n- **Profundidad:** 5 a 6 cm en adultos.\n- **Reexpansión:** permita que el tórax vuelva completamente a su posición.\n- **Interrupciones:** minimícelas; cada pausa reduce el flujo al cerebro.\n\n## Relación compresión-ventilación\n\nPara un rescatista entrenado: **30 compresiones y 2 ventilaciones**. Si no está entrenado o no desea ventilar, realice solo compresiones continuas hasta que llegue ayuda.\n\n## Desfibrilador externo automático (DEA)\n\nEncienda el equipo apenas llegue y siga sus indicaciones de voz. Reanude las compresiones inmediatamente después de cada descarga." }),
          L("l-rcp-4", "video", "Práctica guiada con maniquí", 10, { body: "Grabación de la práctica en sede." }),
          L("l-rcp-5", "quiz", "Evaluación: RCP en adultos", 10, { body: quiz([
            { q: "¿Cuál es la frecuencia recomendada de compresiones en un adulto?", o: ["60 a 80 por minuto", "100 a 120 por minuto", "140 a 160 por minuto"], a: 1 },
            { q: "¿Qué profundidad deben tener las compresiones en un adulto?", o: ["2 a 3 cm", "5 a 6 cm", "8 a 10 cm"], a: 1 },
            { q: "La relación compresión-ventilación para un rescatista entrenado es:", o: ["15:2", "30:2", "5:1"], a: 1 },
            { q: "Unas respiraciones agónicas (boqueos) indican que…", o: ["El paciente respira bien", "Debe iniciarse la RCP", "Hay que esperar 2 minutos"], a: 1 }
          ]) })
        ]},
        { id: "m-rcp-3", title: "Atragantamiento, hemorragias y quemaduras", lessons: [
          L("l-rcp-6", "text", "Obstrucción de la vía aérea por cuerpo extraño", 10, { body:
"## Reconocer la obstrucción grave\n\nLa persona no puede hablar, toser ni respirar y suele llevarse las manos al cuello.\n\n## Qué hacer\n\n- Colóquese detrás y rodee la cintura con los brazos.\n- Ubique el puño por encima del ombligo y realice **compresiones abdominales** hacia adentro y hacia arriba.\n- Repita hasta que el objeto salga o la persona pierda la conciencia.\n\nSi pierde la conciencia, bájela con cuidado al suelo, pida ayuda e **inicie la RCP**." }),
          L("l-rcp-7", "text", "Hemorragias y quemaduras", 10, { body:
"## Hemorragias externas\n\nAplique **presión directa y firme** con gasa o un paño limpio. Si se empapa, coloque otro encima sin retirar el primero. En hemorragias graves de extremidades que no se controlan, un torniquete aplicado por personal entrenado puede salvar la vida.\n\n## Quemaduras\n\n- Enfríe la zona con **agua corriente templada durante 20 minutos**.\n- No aplique hielo, pasta dental, aceite ni mantequilla.\n- Retire anillos y prendas que no estén adheridas.\n- Cubra con material limpio y no adherente y busque atención médica." }),
          L("l-rcp-8", "pdf", "Guía de bolsillo (PDF)", 5, { body: "El instructor adjuntará la guía de bolsillo en PDF." })
        ]}
      ]
    },
    {
      id: "c-flebo", slug: "flebotomia", title: "Flebotomía y Toma de Muestras",
      category: "Laboratorio", level: "Inicial", hours: 48, modality: "Mixta", icon: "drop", color: "#7A3B1E",
      featured: true, published: true, instructorId: "u-inst",
      summary: "Técnica de venopunción segura, identificación del paciente y orden correcto de extracción de tubos.",
      description: "Formación para trabajar en laboratorios clínicos, consultorios y servicios de atención domiciliaria. Incluye prácticas supervisadas.",
      modules: [
        { id: "m-fl-1", title: "Fundamentos", lessons: [
          L("l-fl-1", "text", "Identificación del paciente y preparación", 12, { body:
"## Dos identificadores, siempre\n\nConfirme **nombre completo y fecha de nacimiento** (o número de cédula) preguntándole al paciente; nunca diga usted el nombre para que él lo confirme.\n\n## Antes de la punción\n\n- Verifique la orden médica y las condiciones de la prueba (ayuno, horario).\n- Higiene de manos y guantes nuevos.\n- Prepare tubos, aguja, torniquete, algodón y contenedor de punzocortantes a la mano.\n\n## Selección de la vena\n\nLa **vena cubital media**, en el pliegue del codo, es la primera opción: es superficial, gruesa y menos dolorosa. El torniquete no debe permanecer más de **un minuto**." })
        ]},
        { id: "m-fl-2", title: "Técnica de venopunción", lessons: [
          L("l-fl-2", "text", "Orden de extracción de tubos", 15, { body:
"## Por qué importa el orden\n\nCada tubo contiene un aditivo distinto. Un orden incorrecto puede arrastrar aditivo al tubo siguiente y alterar resultados (por ejemplo, potasio falsamente elevado por EDTA).\n\n## Orden recomendado\n\n- **1.** Hemocultivos\n- **2.** Tubo celeste (citrato) — coagulación\n- **3.** Tubo rojo o amarillo (suero, con o sin gel)\n- **4.** Tubo verde (heparina)\n- **5.** Tubo lila (EDTA) — hematología\n- **6.** Tubo gris (fluoruro/oxalato) — glucosa\n\nInvierta suavemente cada tubo según indicación del fabricante; **nunca lo agite**." }),
          L("l-fl-3", "video", "Venopunción paso a paso", 12, { body: "Video de la técnica completa." }),
          L("l-fl-4", "quiz", "Evaluación: técnica y orden de tubos", 8, { body: quiz([
            { q: "¿Cuál es la vena de primera elección para la venopunción?", o: ["Cefálica", "Cubital media", "Basílica"], a: 1 },
            { q: "¿Cuánto tiempo máximo debe permanecer el torniquete?", o: ["1 minuto", "3 minutos", "5 minutos"], a: 0 },
            { q: "¿Qué tubo va antes: lila (EDTA) o celeste (citrato)?", o: ["Lila", "Celeste", "Da igual"], a: 1 }
          ]) })
        ]}
      ]
    },
    {
      id: "c-bio", slug: "bioseguridad", title: "Bioseguridad y Control de Infecciones",
      category: "Bioseguridad", level: "Todos", hours: 24, modality: "En línea", icon: "shield", color: "#2E4F4A",
      featured: true, published: true, instructorId: "u-inst",
      summary: "Precauciones estándar, higiene de manos y manejo seguro de punzocortantes para todo el personal de salud.",
      description: "Curso 100 % en línea, ideal como inducción para personal nuevo de clínicas, laboratorios y consultorios.",
      modules: [
        { id: "m-bio-1", title: "Precauciones estándar", lessons: [
          L("l-bio-1", "text", "Los cinco momentos de la higiene de manos", 10, { body:
"## Según la Organización Mundial de la Salud\n\n- **1.** Antes de tocar al paciente.\n- **2.** Antes de realizar una tarea limpia o aséptica.\n- **3.** Después del riesgo de exposición a fluidos corporales.\n- **4.** Después de tocar al paciente.\n- **5.** Después del contacto con el entorno del paciente.\n\n## Tiempos\n\nLavado con agua y jabón: **40 a 60 segundos**. Fricción con solución alcohólica: **20 a 30 segundos**." }),
          L("l-bio-2", "text", "Manejo de punzocortantes", 8, { body:
"## Reglas que no se negocian\n\n- **No reencapuche** agujas usadas.\n- Deseche inmediatamente en el contenedor rígido, en el mismo lugar donde se usó.\n- Cierre y reemplace el contenedor cuando alcance **tres cuartas partes** de su capacidad.\n\n## Si ocurre un pinchazo\n\nLave con agua y jabón sin frotar ni exprimir, notifique de inmediato a su supervisor y acuda al servicio de salud ocupacional para la evaluación correspondiente." }),
          L("l-bio-3", "quiz", "Evaluación: bioseguridad", 6, { body: quiz([
            { q: "¿Cuánto debe durar la fricción de manos con solución alcohólica?", o: ["5 a 10 segundos", "20 a 30 segundos", "2 minutos"], a: 1 },
            { q: "Después de usar una aguja, usted debe…", o: ["Reencapucharla con cuidado", "Desecharla de inmediato en el contenedor rígido", "Guardarla para desecharla al final del turno"], a: 1 },
            { q: "¿Cuándo se reemplaza el contenedor de punzocortantes?", o: ["Al llenarse por completo", "Al llegar a ¾ de su capacidad", "Una vez por semana"], a: 1 }
          ]) })
        ]}
      ]
    },
    stub("c-enf", "auxiliar-enfermeria", "Auxiliar de Enfermería", "Enfermería", "Inicial", 120, "Presencial", "cross", "#5B2A44", true,
      "Bases del cuidado al paciente: signos vitales, higiene, confort, movilización y registro de enfermería.",
      ["Rol del auxiliar y ética del cuidado", "Signos vitales", "Higiene, confort y movilización", "Registros de enfermería"]),
    stub("c-iny", "inyectologia", "Administración de Medicamentos e Inyectología", "Enfermería", "Intermedio", 40, "Mixta", "syringe", "#2F3B52", false,
      "Vías de administración, los «correctos» de la medicación y técnica intramuscular, subcutánea e intradérmica.",
      ["Farmacología básica", "Los correctos de la administración", "Técnicas de inyección"]),
    stub("c-farm", "asistente-farmacia", "Asistente de Farmacia", "Farmacia", "Inicial", 80, "Mixta", "pill", "#8A5A1F", false,
      "Dispensación responsable, control de inventario, cadena de frío y atención al cliente en farmacia.",
      ["La farmacia y su marco legal", "Formas farmacéuticas", "Inventario y cadena de frío", "Atención al usuario"]),
    stub("c-ger", "gericultura", "Cuidado del Adulto Mayor", "Cuidados", "Inicial", 60, "Presencial", "hands", "#3F4A3A", false,
      "Acompañamiento digno al adulto mayor: prevención de caídas, alimentación, higiene y estimulación cognitiva.",
      ["Envejecimiento y dignidad", "Prevención de caídas y úlceras", "Alimentación e hidratación", "Estimulación cognitiva"]),
    stub("c-ecg", "electrocardiografia", "Electrocardiografía Básica", "Diagnóstico", "Intermedio", 32, "Mixta", "ecg", "#6E1A26", false,
      "Colocación correcta de electrodos, toma de un ECG de 12 derivaciones y reconocimiento de artefactos.",
      ["Anatomía eléctrica del corazón", "Colocación de electrodos", "Calidad del trazado"]),
    stub("c-sec", "secretariado-medico", "Secretariado Médico y Gestión de Historias", "Gestión en salud", "Inicial", 60, "En línea", "folder", "#4A3F2F", false,
      "Agenda, admisión de pacientes, terminología médica y resguardo confidencial de historias clínicas.",
      ["Terminología médica", "Admisión y agenda", "Historia clínica y confidencialidad"])
  ];

  function stub(id, slug, title, cat, level, hours, modality, icon, color, featured, summary, mods) {
    return {
      id: id, slug: slug, title: title, category: cat, level: level, hours: hours, modality: modality,
      icon: icon, color: color, featured: featured, published: true, instructorId: "u-inst",
      summary: summary,
      description: summary + " Al aprobar recibe certificado avalado por la academia.",
      modules: mods.map(function (t, i) {
        return { id: id + "-m" + (i + 1), title: t, lessons: [
          L(id + "-l" + (i + 1) + "a", "text", "Introducción: " + t.toLowerCase(), 10, { body: "## " + t + "\n\nContenido en preparación por el equipo docente. El instructor publicará aquí las lecturas, videos y materiales de este módulo." }),
          L(id + "-l" + (i + 1) + "b", "video", "Clase grabada", 20, { body: "El instructor subirá la clase grabada." })
        ]};
      })
    };
  }

  var now = Date.now(), day = 864e5;

  window.AEPFA_SEED = {
    users: [
      { id: "u-admin", name: "Dirección Académica", email: "admin@aepfa.edu.ve", pass: "admin123", role: "admin", phone: "", cedula: "", created: now - 60 * day },
      { id: "u-inst", name: "Lcda. María F. Rojas", email: "docente@aepfa.edu.ve", pass: "docente123", role: "instructor", phone: "", cedula: "", created: now - 50 * day, bio: "Licenciada en Enfermería, instructora de soporte vital." },
      { id: "u-est", name: "Carlos Méndez", email: "estudiante@aepfa.edu.ve", pass: "demo123", role: "student", phone: "0414-0000000", cedula: "V-20.000.000", created: now - 20 * day },
      { id: "u-est2", name: "Andreína Pérez", email: "andreina@correo.com", pass: "demo123", role: "student", phone: "0424-0000000", cedula: "V-25.000.000", created: now - 9 * day }
    ],
    courses: courses,
    enrollments: [
      { userId: "u-est", courseId: "c-rcp", date: now - 18 * day },
      { userId: "u-est", courseId: "c-bio", date: now - 6 * day },
      { userId: "u-est2", courseId: "c-flebo", date: now - 8 * day }
    ],
    progress: {
      "u-est": { "l-rcp-1": now - 17 * day, "l-rcp-2": now - 16 * day, "l-rcp-3": now - 12 * day, "l-bio-1": now - 5 * day },
      "u-est2": { "l-fl-1": now - 7 * day }
    },
    leads: [
      { id: "ld-1", name: "José Gregorio Silva", phone: "0412-0000000", email: "jgsilva@correo.com", courseId: "c-enf", message: "¿Cuándo inicia la próxima cohorte?", date: now - 2 * day, status: "nuevo" }
    ]
  };
})();
