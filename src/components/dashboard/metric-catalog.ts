/**
 * Central catalog of metric definitions for the usage dashboard. Every widget references an entry by
 * id so the dashboard is self-explanatory: the `InfoPopover` shows `description` (what it is),
 * `howComputed` (where the number comes from) and `goodWhen` (what "healthy" looks like). Golden tiles
 * use the optional `threshold` to colour themselves. Copy is user-facing → Spanish (voseo, Argentina).
 */

export type MetricTone = "success" | "warning" | "danger" | "neutral";

/**
 * Threshold for a golden tile. `dir: "down"` means lower is better (errors, latency); `dir: "up"`
 * means higher is better (active users, accuracy). `warn`/`danger` are the crossing points.
 */
export type MetricThreshold = { dir: "up" | "down"; warn: number; danger: number };

export type MetricDef = {
  label: string;
  description: string;
  howComputed: string;
  goodWhen: string;
  threshold?: MetricThreshold;
};

/** Resolves a value to a tone given a threshold (neutral when value is null or no threshold). */
export function toneFor(value: number | null | undefined, t?: MetricThreshold): MetricTone {
  if (value == null || !t) return "neutral";
  if (t.dir === "down") {
    if (value >= t.danger) return "danger";
    if (value >= t.warn) return "warning";
    return "success";
  }
  if (value <= t.danger) return "danger";
  if (value <= t.warn) return "warning";
  return "success";
}

export const METRICS = {
  // ── Negocio & crecimiento ──────────────────────────────────────────────────────────────────────
  users_total: {
    label: "Usuarios totales",
    description: "Cuentas de usuario habilitadas en toda la plataforma (con y sin organización).",
    howComputed:
      "Cuenta de usuarios con la cuenta activa (enabled = true). No depende del período.",
    goodWhen: "Crece de forma sostenida en el tiempo.",
  },
  users_active: {
    label: "Usuarios activos",
    description: "Personas que hicieron al menos un ejercicio dentro del período elegido.",
    howComputed: "Usuarios distintos con algún intento de bloque (LessonBlockAttempt) en el rango.",
    goodWhen: "Es una fracción alta de los usuarios totales.",
  },
  dau: {
    label: "DAU",
    description: "Usuarios activos por día (Daily Active Users).",
    howComputed: "Usuarios distintos con actividad cada día del rango. Serie diaria.",
    goodWhen: "Se mantiene estable o crece; sin caídas bruscas.",
  },
  wau: {
    label: "WAU",
    description: "Usuarios activos por semana (Weekly Active Users).",
    howComputed:
      "Usuarios distintos con actividad en cada semana (lunes a domingo, hora Argentina).",
    goodWhen: "Crece o se mantiene; la relación DAU/WAV indica recurrencia.",
  },
  mau: {
    label: "MAU",
    description: "Usuarios activos en los últimos 30 días (Monthly Active Users).",
    howComputed:
      "Usuarios distintos con actividad en el mes móvil que termina al cierre del rango.",
    goodWhen: "Crece mes a mes.",
  },
  stickiness: {
    label: "Recurrencia (DAU/MAU)",
    description: "Qué parte de los usuarios del mes usa la app en un día típico.",
    howComputed: "DAU / MAU × 100 (usuarios activos del día sobre los del mes).",
    goodWhen: "Más alto = más hábito diario; >20% es fuerte.",
    threshold: { dir: "up", warn: 20, danger: 10 },
  },
  engagement_rate: {
    label: "Tasa de actividad",
    description: "Qué parte de los usuarios totales estuvo activa en el período elegido.",
    howComputed: "Usuarios activos en el rango / usuarios totales × 100.",
    goodWhen: "Cuanto más alta, más gente usando la app en ese período.",
    threshold: { dir: "up", warn: 20, danger: 10 },
  },
  xp_per_user: {
    label: "XP por usuario activo",
    description: "Experiencia promedio ganada por cada usuario activo en el período.",
    howComputed: "XP total del período / usuarios activos del período.",
    goodWhen: "Alto: cada usuario activo avanza bastante.",
  },
  new_users: {
    label: "Nuevos usuarios",
    description: "Altas de cuentas nuevas dentro del período.",
    howComputed: "Usuarios cuya fecha de alta (created_at) cae dentro del rango. Serie diaria.",
    goodWhen: "Acompaña o supera la tasa de baja.",
  },
  activation_rate: {
    label: "Tasa de activación",
    description: "Qué parte de los usuarios nuevos del período realmente empieza a aprender.",
    howComputed:
      "Nuevos usuarios con al menos un intento de ejercicio (LessonBlockAttempt) / total de nuevos usuarios del período.",
    goodWhen: "Alta: la mayoría de las altas pasan del registro a la primera lección.",
    threshold: { dir: "up", warn: 40, danger: 20 },
  },
  cohort_retention: {
    label: "Retención por cohorte",
    description:
      "Porcentaje de usuarios que vuelven a estar activos 1, 7 y 30 días después de registrarse, agrupados por la semana de alta.",
    howComputed:
      "Por cohorte semanal (lunes de la semana de alta): usuarios con actividad el día alta+N / total de la cohorte. '—' = la semana todavía no es observable a ese horizonte.",
    goodWhen: "Las columnas no caen a pico; D7 y D30 se sostienen por encima de D1 esperado.",
  },
  retention_w1: {
    label: "Retención semana 1",
    description: "Porcentaje de usuarios nuevos que vuelven a estar activos a la semana siguiente.",
    howComputed: "Por cohorte de alta semanal: activos en la semana +1 / total de la cohorte.",
    goodWhen: "Cuanto más alta, mejor; >40% es saludable para una app de aprendizaje.",
    threshold: { dir: "up", warn: 40, danger: 20 },
  },
  enrollments_active: {
    label: "Inscripciones en curso",
    description: "Inscripciones a cursos que están activas (no completadas ni abandonadas).",
    howComputed: "Inscripciones con estado ENROLLED al cierre del período.",
    goodWhen: "Alta y creciente respecto de las abandonadas.",
  },
  enrollment_completion: {
    label: "Completitud de inscripciones",
    description: "Qué parte de las inscripciones llega a completar el curso.",
    howComputed: "Inscripciones COMPLETED / total de inscripciones, al cierre del período.",
    goodWhen: "Cuanto más alta, mejor.",
    threshold: { dir: "up", warn: 30, danger: 15 },
  },
  revenue: {
    label: "Ingresos (B2B)",
    description: "Ingresos por compras de cupos de organizaciones pagadas en el período.",
    howComputed:
      "Suma de total_amount de las compras (CoursePurchase) con pago confirmado (paidAt en el rango).",
    goodWhen: "Crece y supera a los reembolsos.",
  },
  refund_rate: {
    label: "Tasa de reembolso",
    description: "Proporción de ingresos devueltos por reembolsos o contracargos.",
    howComputed: "Monto reembolsado (PurchaseRefund) / ingresos del período.",
    goodWhen: "Lo más baja posible.",
    threshold: { dir: "down", warn: 5, danger: 10 },
  },
  seat_utilization: {
    label: "Uso de cupos",
    description: "Cupos comprados que efectivamente fueron aceptados por un participante.",
    howComputed: "Cupos ACTIVE / cupos vendidos (PurchaseSeat) de las compras pagadas.",
    goodWhen: "Cuanto más alta, mejor aprovechamiento.",
    threshold: { dir: "up", warn: 60, danger: 40 },
  },
  gems_revenue: {
    label: "Compras de gemas",
    description: "Compras de packs de gemas con dinero real vía Google Play.",
    howComputed: "Registros de GemPurchase verificados en el período.",
    goodWhen: "Crece a medida que la economía interna madura.",
  },
  waitlist: {
    label: "Lista de espera",
    description: "Emails anotados en la waitlist desde la landing.",
    howComputed: "Altas de WaitlistEntry (total y serie diaria por created_at).",
    goodWhen: "Crece antes y durante campañas.",
  },
  paid_course_users: {
    label: "Usuarios en cursos pagos",
    description:
      "Usuarios inscriptos en al menos un curso que no es gratis (excluye el curso free).",
    howComputed:
      "Usuarios distintos con una inscripción a un curso con isFree = false, al cierre del período.",
    goodWhen: "Crece: refleja conversión del contenido gratis al pago.",
  },
  orgs_active: {
    label: "Organizaciones activas",
    description: "Empresas/instituciones con la cuenta aprobada y operativa.",
    howComputed: "Organizaciones con estado ACTIVE al cierre del período.",
    goodWhen: "Crece; pocas quedan en PENDING sin resolver.",
  },

  // ── Aprendizaje & contenido ──────────────────────────────────────────────────────────────────
  courses_total: {
    label: "Cursos",
    description: "Cursos existentes en el catálogo de la plataforma.",
    howComputed: "Cuenta total de cursos (Course). No depende del período.",
    goodWhen: "Crece con la oferta de contenido.",
  },
  versions_published: {
    label: "Versiones publicadas",
    description: "Versiones de curso publicadas (las únicas que los usuarios pueden cursar).",
    howComputed: "Versiones de curso (CourseVersion) con estado PUBLISHED.",
    goodWhen: "Cada curso activo tiene al menos una versión publicada.",
  },
  lessons_completed: {
    label: "Lecciones completadas",
    description: "Lecciones terminadas por los usuarios en el período.",
    howComputed: "UserLessonProgress que pasó a COMPLETED con completedAt dentro del rango.",
    goodWhen: "Acompaña a la cantidad de usuarios activos.",
  },
  topics_completed: {
    label: "Temas completados",
    description: "Temas (capítulos) terminados en el período.",
    howComputed: "UserTopicProgress COMPLETED con completedAt dentro del rango.",
    goodWhen: "Crece junto con las lecciones completadas.",
  },
  accuracy_global: {
    label: "Precisión global",
    description: "Qué porcentaje de ejercicios evaluables se responde correctamente.",
    howComputed: "Intentos correctos / intentos evaluados (isCorrect no nulo) en el período.",
    goodWhen: "Alta pero no del 100% (si es muy alta, el contenido puede ser demasiado fácil).",
    threshold: { dir: "up", warn: 70, danger: 55 },
  },
  accuracy_by_type: {
    label: "Precisión por tipo de ejercicio",
    description:
      "Precisión abierta por tipo de bloque (elegir significado, seña, match, cámara, etc.).",
    howComputed: "Correctos / evaluados agrupado por tipo de bloque, en el período.",
    goodWhen: "Pareja entre tipos; un tipo muy bajo marca contenido o UX a revisar.",
  },
  sign_reports_pending: {
    label: "Reportes de señas pendientes",
    description: "Reportes de usuarios sobre señas incorrectas o de baja calidad, sin resolver.",
    howComputed: "SignReport con estado PENDING (estado actual, no acotado al período).",
    goodWhen: "Cerca de cero; se resuelven rápido.",
    threshold: { dir: "down", warn: 10, danger: 25 },
  },
  sign_report_resolution: {
    label: "Tiempo de resolución de reportes",
    description: "Cuánto tarda en promedio resolver un reporte de seña.",
    howComputed: "Promedio de (resolvedAt − createdAt) de reportes resueltos en el período.",
    goodWhen: "Lo más bajo posible.",
  },
  imports_failed: {
    label: "Imports de contenido fallidos",
    description: "Corridas de importación de cursos (YAML) que fallaron.",
    howComputed: "ContentImportRun con estado FAILED iniciadas dentro del período.",
    goodWhen: "Cero: un import fallido significa contenido que no se actualizó.",
    threshold: { dir: "down", warn: 1, danger: 3 },
  },
  daily_activity: {
    label: "Actividad diaria",
    description: "Ejercicios resueltos y lecciones completadas por día.",
    howComputed: "Intentos de bloque y lecciones completadas agrupados por día (hora Argentina).",
    goodWhen: "Constante, sin huecos inesperados.",
  },
  course_completion: {
    label: "Completitud por curso",
    description: "Porcentaje de inscripciones que completan, curso por curso.",
    howComputed: "Por curso: inscripciones COMPLETED / total de inscripciones.",
    goodWhen: "Permite detectar cursos con mucho abandono.",
  },
  hardest_lessons: {
    label: "Lecciones más difíciles",
    description: "Lecciones con menor precisión promedio: candidatas a revisar.",
    howComputed: "Precisión por lección (correctos/evaluados) ordenada de menor a mayor.",
    goodWhen: "Ninguna lección con precisión muy por debajo del promedio.",
  },
  vocabulary_growth: {
    label: "Señas aprendidas",
    description: "Señas nuevas que los usuarios incorporan a su vocabulario.",
    howComputed: "Altas de UserLearnedSign (learnedAt) agrupadas por día.",
    goodWhen: "Crece con la actividad de aprendizaje.",
  },

  // ── Gamificación & engagement ────────────────────────────────────────────────────────────────
  xp_daily: {
    label: "XP por día",
    description: "Experiencia (XP) total ganada por los usuarios cada día.",
    howComputed: "Suma de UserDailyXp por día dentro del rango.",
    goodWhen: "Estable o creciente; refleja el esfuerzo de aprendizaje.",
  },
  streak_avg: {
    label: "Racha promedio",
    description: "Promedio de la racha actual de días de los usuarios.",
    howComputed: "Promedio de UserStats.currentStreak sobre los usuarios con actividad.",
    goodWhen: "Cuanto más alta, mayor es el hábito diario.",
  },
  streak_over7: {
    label: "Usuarios con racha > 7",
    description: "Porcentaje de usuarios con una racha activa de más de una semana.",
    howComputed: "Usuarios con currentStreak > 7 / usuarios activos.",
    goodWhen: "Cuanto más alto, mejor retención por hábito.",
    threshold: { dir: "up", warn: 15, danger: 5 },
  },
  achievements_unlocked: {
    label: "Logros desbloqueados",
    description: "Logros que los usuarios desbloquearon en el período.",
    howComputed: "Altas de UserAchievement (unlockedAt) dentro del rango.",
    goodWhen: "Acompaña el engagement general.",
  },
  challenge_claim_rate: {
    label: "Reclamo de desafíos",
    description: "Qué parte de los desafíos completados efectivamente se reclaman.",
    howComputed:
      "UserChallenge CLAIMED / (COMPLETED + CLAIMED), por tipo (diario/semanal/primeros pasos).",
    goodWhen: "Alta: los usuarios vuelven a buscar su recompensa.",
    threshold: { dir: "up", warn: 50, danger: 30 },
  },
  gifts: {
    label: "Regalos entre usuarios",
    description: "Regalos de gemas enviados entre amigos.",
    howComputed: "Registros de Gift enviados en el período (y proporción aceptada).",
    goodWhen: "Señal de comunidad activa.",
  },
  gems_spent: {
    label: "Gemas gastadas",
    description: "Total de gemas gastadas en la tienda en el período.",
    howComputed: "Suma de gemsSpent de las compras (Purchase) en el rango.",
    goodWhen: "Refleja una economía interna activa y balanceada.",
  },
  shop_top: {
    label: "Ítems más comprados",
    description: "Ranking de ítems de la tienda por cantidad de compras.",
    howComputed: "Compras (Purchase) agrupadas por ítem de la tienda en el período.",
    goodWhen: "Diversidad sana; permite ajustar precios y stock.",
  },
  lives_lost: {
    label: "Vidas perdidas",
    description: "Vidas consumidas por respuestas incorrectas (indicador de dificultad).",
    howComputed: "Contador Micrometer signa.lives.lost agregado en el período.",
    goodWhen: "Ni muy alto (frustración) ni cero (demasiado fácil).",
  },

  // ── Infraestructura · Backend (signa-api) ───────────────────────────────────────────────────
  backend_up: {
    label: "Backend",
    description: "Si la API de SignaSource está respondiendo.",
    howComputed: 'Métrica up{job="signa-api"} de Prometheus (1 = operativo, 0 = caído).',
    goodWhen: "Siempre operativo.",
  },
  r2_up: {
    label: "R2 animaciones",
    description: "Disponibilidad del almacenamiento de animaciones de señas (Cloudflare R2).",
    howComputed: "Probe signa_r2_up publicado por el backend.",
    goodWhen: "Siempre operativo; si cae, las animaciones no se descargan.",
  },
  latency_p50: {
    label: "Latencia HTTP p50",
    description: "Tiempo de respuesta mediano de la API.",
    howComputed: "Percentil 50 de http_server_requests_seconds sobre la ventana.",
    goodWhen: "Bajo y estable (decenas de ms).",
  },
  latency_p95: {
    label: "Latencia HTTP p95",
    description: "Tiempo de respuesta del 95% más rápido de las requests.",
    howComputed: "Percentil 95 de http_server_requests_seconds sobre la ventana.",
    goodWhen: "Por debajo de ~500 ms.",
    threshold: { dir: "down", warn: 0.5, danger: 1 },
  },
  latency_p99: {
    label: "Latencia HTTP p99",
    description: "Cola de latencia: el 1% de requests más lentas.",
    howComputed: "Percentil 99 de http_server_requests_seconds sobre la ventana.",
    goodWhen: "Sin picos sostenidos.",
  },
  throughput: {
    label: "Throughput",
    description: "Requests por segundo que atiende la API.",
    howComputed: "rate de http_server_requests_seconds_count sobre la ventana.",
    goodWhen: "Acompaña el uso real sin saturar.",
  },
  error_rate: {
    label: "Tasa de error (5xx)",
    description: "Proporción de requests que terminan en error del servidor.",
    howComputed: "Requests 5xx / total de requests (rate sobre la ventana).",
    goodWhen: "Por debajo del 1%.",
    threshold: { dir: "down", warn: 0.01, danger: 0.05 },
  },
  error_rate_4xx: {
    label: "Tasa de error (4xx)",
    description:
      "Proporción de requests rechazadas por el cliente (validación, auth, no encontrado).",
    howComputed: "Requests 4xx / total de requests (rate sobre la ventana).",
    goodWhen: "Estable; un salto puede indicar un bug de cliente o abuso.",
  },
  slowest_ops: {
    label: "Operaciones más lentas",
    description: "Los endpoints con peor latencia p95.",
    howComputed: "topk(10) del p95 por URI sobre la ventana.",
    goodWhen: "Ningún endpoint domina el tiempo de respuesta.",
  },
  cpu_host: {
    label: "CPU del host",
    description: "Uso de CPU del servidor.",
    howComputed: "100 × (1 − idle) del nodo.",
    goodWhen: "Con margen; sostenido por debajo del 85%.",
    threshold: { dir: "down", warn: 70, danger: 85 },
  },
  mem_host: {
    label: "Memoria del host",
    description: "Uso de memoria del servidor.",
    howComputed: "100 × (1 − disponible/total) del nodo.",
    goodWhen: "Con margen; sostenido por debajo del 85%.",
    threshold: { dir: "down", warn: 75, danger: 85 },
  },
  cpu_containers: {
    label: "CPU por contenedor",
    description: "CPU consumida por cada contenedor Docker.",
    howComputed: "rate de container_cpu_usage_seconds_total por nombre.",
    goodWhen: "Repartida; sin un contenedor acaparando.",
  },
  mem_containers: {
    label: "Memoria por contenedor",
    description: "Memoria usada por cada contenedor Docker.",
    howComputed: "container_memory_usage_bytes por nombre.",
    goodWhen: "Estable; sin crecer indefinidamente (posible fuga).",
  },
  db_connections_active: {
    label: "Conexiones activas a la base",
    description: "Conexiones del pool (HikariCP) en uso.",
    howComputed: "hikaricp_connections_active.",
    goodWhen: "Por debajo del tamaño del pool; sin saturar.",
  },
  db_connections_pending: {
    label: "Conexiones en espera",
    description: "Hilos esperando una conexión libre del pool.",
    howComputed: "hikaricp_connections_pending.",
    goodWhen: "Cero la mayor parte del tiempo.",
  },
  pg_connections: {
    label: "Conexiones PostgreSQL",
    description: "Conexiones abiertas contra la base de datos.",
    howComputed: "sum(pg_stat_database_numbackends).",
    goodWhen: "Dentro del límite configurado en Postgres.",
  },
  r2_presign_latency: {
    label: "Latencia de firma de R2 (p95)",
    description: "Tiempo en generar la URL firmada de una animación.",
    howComputed: "p95 de signa_r2_presign_duration_seconds.",
    goodWhen: "Pocos ms.",
  },
  r2_download_latency: {
    label: "Latencia de descarga de R2 (p95)",
    description: "Tiempo que tarda el backend en operar contra R2 al descargar.",
    howComputed: "p95 de signa_r2_download_duration_seconds.",
    goodWhen: "Bajo y estable.",
  },
  email_sent: {
    label: "Emails enviados",
    description: "Correos transaccionales enviados (verificación, reset, invitaciones).",
    howComputed: "rate del contador signa.email.sent.",
    goodWhen: "Acompaña altas e invitaciones.",
  },
  email_failures: {
    label: "Fallos de email",
    description: "Envíos de correo que fallaron.",
    howComputed: "rate del contador signa.email.failures.",
    goodWhen: "Cero: un fallo impide verificar cuentas o resetear contraseñas.",
    threshold: { dir: "down", warn: 0.001, danger: 0.01 },
  },
  push_sent: {
    label: "Push enviados",
    description: "Notificaciones push enviadas vía Firebase.",
    howComputed: "rate del contador signa.push.sent.",
    goodWhen: "Acompaña logros, desafíos y actividad social.",
  },
  push_failures: {
    label: "Fallos de push",
    description: "Envíos de push que fallaron.",
    howComputed: "rate del contador signa.push.failures.",
    goodWhen: "Bajo; los tokens inválidos se purgan solos.",
  },
  jvm_heap: {
    label: "Heap de la JVM",
    description: "Memoria del heap usada por la aplicación Java.",
    howComputed: 'jvm_memory_used_bytes{area="heap"}.',
    goodWhen: "Con margen frente al máximo; sin crecimiento indefinido.",
  },
  client_errors: {
    label: "Errores de cliente",
    description: "Errores reportados por las apps (web y móvil): red, render, HTTP 4xx/5xx.",
    howComputed: "rate del contador signa_client_errors_total por tipo, vía telemetría de cliente.",
    goodWhen: "Bajo y estable; un salto marca un bug de cliente o una caída de red.",
  },
  jvm_gc_pause: {
    label: "Pausas de GC",
    description: "Tiempo que la JVM pasa en recolección de basura.",
    howComputed: "rate de jvm_gc_pause_seconds_sum.",
    goodWhen: "Bajo; pausas largas afectan la latencia.",
  },

  // ── Infraestructura · Web / Landing ──────────────────────────────────────────────────────────
  web_vitals: {
    label: "Web Vitals",
    description: "Métricas de experiencia percibida en el navegador (LCP, CLS, INP).",
    howComputed: "p75 de signa_client_web_vital_seconds por métrica, reportado por los clientes.",
    goodWhen: "LCP < 2,5 s, INP < 200 ms, CLS bajo.",
  },
  screen_load: {
    label: "Carga de pantallas (p75)",
    description: "Cuánto tardan en quedar listas las pantallas de la app móvil.",
    howComputed:
      "p75 de signa_client_screen_load_seconds por pantalla, reportado por los clientes.",
    goodWhen: "Pocos cientos de ms; sin pantallas lentas sostenidas.",
  },
  animation_latency: {
    label: "Latencia de animaciones (p95)",
    description: "Cuánto tarda en cargar la animación 3D de una seña en el cliente.",
    howComputed: "p95 de signa_client_animation_load_seconds, reportado por los clientes.",
    goodWhen: "Pocos cientos de ms.",
  },

  // ── Infraestructura · ML (reconocimiento de señas) ───────────────────────────────────────────
  recognition_accuracy: {
    label: "Precisión de reconocimiento",
    description:
      "Qué porcentaje de ejercicios con cámara (reconocimiento de señas) se resuelve correctamente.",
    howComputed:
      "Correctos / evaluados de los bloques VISUAL_RECOGNITION, PERFORM_SIGN y SPELL_NAME (lesson_block_attempts).",
    goodWhen: "Alta; una caída puede indicar peor modelo o peores condiciones de cámara.",
    threshold: { dir: "up", warn: 65, danger: 50 },
  },
  recognition_attempts: {
    label: "Ejercicios con cámara",
    description: "Intentos en ejercicios de reconocimiento con cámara dentro del período.",
    howComputed: "Intentos evaluados de los bloques de cámara (lesson_block_attempts).",
    goodWhen: "Refleja el uso real del reconocimiento en el dispositivo.",
  },
  ml_inference_latency: {
    label: "Latencia de inferencia (p95)",
    description: "Tiempo por frame del modelo de reconocimiento de señas en el dispositivo.",
    howComputed: "p95 de signa_client_inference_duration_seconds, reportado por la app móvil.",
    goodWhen: "Suficientemente bajo para mantener buen FPS en cámara.",
  },
  ml_confidence: {
    label: "Confianza del modelo",
    description: "Confianza promedio de las predicciones de señas.",
    howComputed: "Promedio de signa_client_recognition_confidence reportado por la app.",
    goodWhen: "Alta y estable; una caída sugiere degradación del modelo.",
  },
  ml_fps: {
    label: "FPS de cámara",
    description: "Cuadros por segundo procesados durante el reconocimiento en vivo.",
    howComputed: "Promedio de signa_client_recognition_fps reportado por la app.",
    goodWhen: "Fluido (idealmente ≥ 15 FPS).",
  },
} satisfies Record<string, MetricDef>;

export type MetricId = keyof typeof METRICS;
