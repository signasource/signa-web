/**
 * Central catalog of metric definitions for the usage dashboard. Every widget references an entry by
 * id so the dashboard is self-explanatory: the `InfoPopover` shows `description` (what it is),
 * `howComputed` (how the number is worked out, in plain language — no code, table or column names) and
 * `goodWhen` (what "healthy" looks like). Golden tiles use the optional `threshold` to colour
 * themselves. Copy is user-facing and must be understandable by anyone → Spanish (voseo, Argentina).
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
    description: "Cuentas de usuario activas en toda la plataforma (con y sin organización).",
    howComputed: "Contamos todas las cuentas que siguen activas. No cambia con el período elegido.",
    goodWhen: "Crece de forma sostenida en el tiempo.",
  },
  users_active: {
    label: "Usuarios activos",
    description: "Personas que hicieron al menos un ejercicio dentro del período elegido.",
    howComputed:
      "Contamos cuántas personas distintas practicaron al menos una vez dentro del período.",
    goodWhen: "Es una fracción alta de los usuarios totales.",
  },
  dau: {
    label: "Usuarios activos por día",
    description: "Cuántas personas distintas usan la app cada día.",
    howComputed: "Para cada día, contamos las personas distintas que practicaron ese día.",
    goodWhen: "Se mantiene estable o crece; sin caídas bruscas.",
  },
  wau: {
    label: "Usuarios activos por semana",
    description: "Cuántas personas distintas usan la app en una semana.",
    howComputed:
      "Contamos las personas distintas que practicaron al menos una vez en la última semana.",
    goodWhen: "Crece o se mantiene estable.",
  },
  mau: {
    label: "Usuarios activos por mes",
    description: "Cuántas personas distintas usan la app en un mes.",
    howComputed:
      "Contamos las personas distintas que practicaron al menos una vez en los últimos 30 días.",
    goodWhen: "Crece mes a mes.",
  },
  stickiness: {
    label: "Recurrencia diaria",
    description: "Qué parte de las personas que usan la app en el mes la usan en un día típico.",
    howComputed:
      "Dividimos los usuarios activos de un día por los del mes. Más alto = más hábito diario.",
    goodWhen: "Más alto es mejor; por encima del 20% es fuerte.",
    threshold: { dir: "up", warn: 20, danger: 10 },
  },
  engagement_rate: {
    label: "Tasa de actividad",
    description: "Qué parte de todos los usuarios estuvo activa en el período elegido.",
    howComputed:
      "Dividimos los usuarios activos del período por el total de usuarios, expresado como porcentaje.",
    goodWhen: "Cuanto más alta, más gente usando la app en ese período.",
    threshold: { dir: "up", warn: 20, danger: 10 },
  },
  xp_per_user: {
    label: "Experiencia por usuario activo",
    description: "Cuánta experiencia (puntos de aprendizaje) gana en promedio cada usuario activo.",
    howComputed:
      "Dividimos toda la experiencia ganada en el período por la cantidad de usuarios activos.",
    goodWhen: "Alto: cada usuario activo avanza bastante.",
  },
  new_users: {
    label: "Nuevos usuarios",
    description: "Cuentas nuevas creadas dentro del período.",
    howComputed: "Contamos las cuentas cuya fecha de registro cae dentro del período elegido.",
    goodWhen: "Acompaña o supera a la gente que deja de usar la app.",
  },
  sessions_per_user: {
    label: "Sesiones por usuario",
    description: "Con qué frecuencia abre la app cada persona en el período (uso recurrente).",
    howComputed:
      "Dividimos la cantidad de veces que se abrió la app por la cantidad de personas que la abrieron.",
    goodWhen: "Más alto = la gente vuelve más seguido.",
  },
  session_duration: {
    label: "Duración promedio de sesión",
    description: "Cuánto dura en promedio cada vez que alguien usa la app (tiempo dedicado).",
    howComputed:
      "Promediamos cuánto tiempo estuvo abierta la app en cada uso. Un uso va desde que se abre hasta que se deja.",
    goodWhen: "Suficiente para progresar, sin señales de frustración.",
  },
  activation_rate: {
    label: "Tasa de activación",
    description: "Qué parte de los usuarios nuevos del período realmente empieza a aprender.",
    howComputed:
      "De los usuarios que se registraron en el período, qué porcentaje hizo al menos un ejercicio.",
    goodWhen: "Alta: la mayoría de las altas pasan del registro a la primera lección.",
    threshold: { dir: "up", warn: 40, danger: 20 },
  },
  cohort_retention: {
    label: "Retención por grupo de registro",
    description:
      "Qué porcentaje de usuarios vuelve a usar la app 1, 7 y 30 días después de registrarse, según la semana en que se anotaron.",
    howComputed:
      "Agrupamos a la gente por la semana en que se registró y vemos cuántos volvieron a estar activos pasado 1, 7 y 30 días. '—' = la semana todavía es muy reciente para saberlo.",
    goodWhen: "Las columnas no caen a pico; a 7 y 30 días se sostiene una buena parte.",
  },
  retention_w1: {
    label: "Retención a la semana",
    description: "Qué porcentaje de los usuarios nuevos vuelve a usar la app la semana siguiente.",
    howComputed:
      "De la gente que se registró una semana, qué porcentaje volvió a estar activa la semana siguiente.",
    goodWhen: "Cuanto más alta, mejor; por encima del 40% es saludable.",
    threshold: { dir: "up", warn: 40, danger: 20 },
  },
  enrollments_active: {
    label: "Inscripciones en curso",
    description: "Inscripciones a cursos que están activas (no completadas ni abandonadas).",
    howComputed: "Contamos las inscripciones que siguen en curso al final del período.",
    goodWhen: "Alta y creciente respecto de las abandonadas.",
  },
  enrollment_completion: {
    label: "Completitud de inscripciones",
    description: "Qué parte de las inscripciones llega a completar el curso.",
    howComputed:
      "Dividimos las inscripciones completadas por el total de inscripciones, al final del período.",
    goodWhen: "Cuanto más alta, mejor.",
    threshold: { dir: "up", warn: 30, danger: 15 },
  },
  income: {
    label: "Ingresos",
    description:
      "Todo el dinero que entra: por un lado las organizaciones (compra de cupos) y por otro los usuarios finales (gemas y cursos).",
    howComputed:
      "Sumamos el dinero de las compras con pago confirmado dentro del período, separado entre organizaciones y usuarios finales.",
    goodWhen: "Crece y supera a los reembolsos.",
  },
  refunds: {
    label: "Reembolsos",
    description:
      "Dinero devuelto por reembolsos o contracargos, separado entre organizaciones y usuarios finales.",
    howComputed:
      "Sumamos el dinero que se devolvió dentro del período, separado entre organizaciones y usuarios finales.",
    goodWhen: "Lo más bajo posible frente a los ingresos.",
  },
  revenue: {
    label: "Ingresos de organizaciones",
    description: "Dinero de las compras de cupos de organizaciones dentro del período.",
    howComputed:
      "Sumamos el total de las compras de cupos de organizaciones con pago confirmado dentro del período.",
    goodWhen: "Crece y supera a los reembolsos.",
  },
  refund_rate: {
    label: "Tasa de reembolso",
    description: "Qué parte de los ingresos de organizaciones se termina devolviendo.",
    howComputed:
      "Dividimos el dinero devuelto a organizaciones por lo que ingresaron, como porcentaje.",
    goodWhen: "Lo más baja posible.",
    threshold: { dir: "down", warn: 5, danger: 10 },
  },
  seat_utilization: {
    label: "Uso de cupos",
    description: "Cupos comprados por organizaciones que efectivamente usa un participante.",
    howComputed:
      "Dividimos los cupos que ya tienen un participante activo por el total de cupos vendidos.",
    goodWhen: "Cuanto más alta, mejor aprovechamiento.",
    threshold: { dir: "up", warn: 60, danger: 40 },
  },
  gems_revenue: {
    label: "Compras de gemas",
    description: "Dinero de las compras de packs de gemas con dinero real por usuarios finales.",
    howComputed:
      "Sumamos el dinero de las compras de gemas confirmadas dentro del período; abajo, las gemas entregadas.",
    goodWhen: "Crece a medida que la economía interna madura.",
  },
  course_sales: {
    label: "Compras de cursos pagos",
    description:
      "Dinero de los cursos pagos que compran directamente los usuarios finales (fuera de una organización).",
    howComputed:
      "Sumamos el dinero de las compras de cursos pagos confirmadas dentro del período; abajo, la cantidad de cursos vendidos.",
    goodWhen: "Crece: refleja interés en el contenido pago.",
  },
  waitlist: {
    label: "Lista de espera",
    description: "Emails anotados en la lista de espera desde la web.",
    howComputed: "Contamos los emails que se anotaron en la lista de espera dentro del período.",
    goodWhen: "Crece antes y durante campañas.",
  },
  paid_course_users: {
    label: "Usuarios en cursos pagos",
    description: "Personas inscriptas en al menos un curso que no es gratis.",
    howComputed:
      "Contamos las personas distintas inscriptas en algún curso pago, al final del período.",
    goodWhen: "Crece: refleja que el contenido gratis convierte al pago.",
  },
  orgs_active: {
    label: "Organizaciones activas",
    description: "Empresas e instituciones con la cuenta aprobada y operativa.",
    howComputed: "Contamos las organizaciones aprobadas y operativas al final del período.",
    goodWhen: "Crece; pocas quedan esperando aprobación.",
  },
  orgs_pending: {
    label: "Organizaciones pendientes",
    description: "Organizaciones registradas que esperan la aprobación de SIGNA.",
    howComputed: "Contamos las organizaciones que todavía esperan aprobación al final del período.",
    goodWhen: "Cerca de cero: se aprueban rápido para que puedan comprar.",
    threshold: { dir: "down", warn: 3, danger: 8 },
  },
  orgs_new: {
    label: "Organizaciones nuevas",
    description: "Organizaciones que se registraron dentro del período.",
    howComputed: "Contamos las organizaciones cuya fecha de registro cae dentro del período.",
    goodWhen: "Crece: refleja la llegada de nuevos clientes.",
  },
  avg_users_per_org: {
    label: "Usuarios promedio por organización",
    description: "Cuántos participantes activos tiene en promedio cada organización.",
    howComputed:
      "Dividimos el total de participantes activos por la cantidad de organizaciones que tienen al menos uno.",
    goodWhen: "Alto: las organizaciones aprovechan la plataforma con muchos participantes.",
  },
  avg_revenue_per_org: {
    label: "Ingreso promedio por organización",
    description: "Cuánto gastó en promedio cada organización que compró.",
    howComputed:
      "Dividimos todo el dinero ingresado por organizaciones entre las que hicieron al menos una compra.",
    goodWhen: "Alto y creciente.",
  },
  purchases_count: {
    label: "Compras de organizaciones",
    description: "Compras de cupos confirmadas en el período.",
    howComputed:
      "Contamos las compras de cupos de organizaciones con pago confirmado en el período.",
    goodWhen: "Acompaña el crecimiento comercial.",
  },
  free_to_premium: {
    label: "Conversión de gratis a pago",
    description: "Qué proporción de los usuarios de cursos gratuitos llega a un curso pago.",
    howComputed:
      "Dividimos la gente en cursos pagos por la gente en cursos gratuitos, al final del período.",
    goodWhen: "Cuanto más alta, mejor conversión del contenido gratis al pago.",
  },
  org_utilization: {
    label: "Uso de cupos por organización",
    description:
      "Cupos contratados frente a los que realmente se usan, organización por organización. Que una contrate 100 y use 5 es una señal comercial importante.",
    howComputed:
      "Para cada organización mostramos los cupos con participante activo sobre los cupos comprados, junto con sus participantes e ingresos.",
    goodWhen: "Ocupación alta: las licencias compradas se usan.",
  },

  // ── Aprendizaje & contenido ──────────────────────────────────────────────────────────────────
  courses_total: {
    label: "Cursos",
    description: "Cursos disponibles en el catálogo de la plataforma.",
    howComputed: "Contamos todos los cursos del catálogo. No cambia con el período.",
    goodWhen: "Crece con la oferta de contenido.",
  },
  versions_published: {
    label: "Versiones publicadas",
    description: "Versiones de curso publicadas (las únicas que la gente puede cursar).",
    howComputed: "Contamos las versiones de curso que están publicadas.",
    goodWhen: "Cada curso activo tiene al menos una versión publicada.",
  },
  lessons_completed: {
    label: "Lecciones completadas",
    description: "Lecciones terminadas por los usuarios en el período.",
    howComputed: "Contamos las lecciones que se terminaron dentro del período.",
    goodWhen: "Acompaña a la cantidad de usuarios activos.",
  },
  lessons_started: {
    label: "Lecciones iniciadas",
    description: "Lecciones comenzadas por los usuarios en el período.",
    howComputed: "Contamos las lecciones que alguien empezó dentro del período.",
    goodWhen: "Alta y acompañada por una buena tasa de finalización.",
  },
  lesson_completion_rate: {
    label: "Tasa de finalización de lecciones",
    description: "Qué parte de las lecciones que se empiezan se terminan.",
    howComputed: "Dividimos las lecciones completadas por las lecciones iniciadas en el período.",
    goodWhen: "Cuanto más alta, mejor; una tasa baja marca lecciones que se abandonan.",
    threshold: { dir: "up", warn: 50, danger: 30 },
  },
  exercises_attempted: {
    label: "Ejercicios realizados",
    description: "Ejercicios resueltos dentro del período.",
    howComputed: "Contamos todos los ejercicios que se respondieron dentro del período.",
    goodWhen: "Refleja volumen de práctica real.",
  },
  exercise_success_rate: {
    label: "Tasa de éxito",
    description: "Qué parte de los ejercicios se responde correctamente.",
    howComputed:
      "Dividimos los ejercicios respondidos bien por el total de ejercicios respondidos.",
    goodWhen: "Alta pero no del 100% (si es muy alta, el contenido es demasiado fácil).",
    threshold: { dir: "up", warn: 70, danger: 55 },
  },
  avg_attempts: {
    label: "Intentos promedio",
    description: "Cuántos intentos necesita en promedio una persona para resolver un ejercicio.",
    howComputed:
      "Dividimos el total de intentos por la cantidad de ejercicios distintos que intentó la gente.",
    goodWhen: "Cercano a 1 o 2; muy alto indica ejercicios demasiado difíciles.",
    threshold: { dir: "down", warn: 2.5, danger: 4 },
  },
  learning_funnel: {
    label: "Embudo de aprendizaje",
    description:
      "Dónde se pierde la gente en el recorrido: registro, primera lección, primer ejercicio y completar lecciones.",
    howComputed:
      "Contamos cuántas personas distintas llegaron a cada paso: registrarse, empezar una lección, hacer un ejercicio, completar una lección y completar dos o más.",
    goodWhen: "Las caídas entre pasos son chicas; pocos se pierden al principio.",
  },
  lesson_abandonment: {
    label: "Lecciones con mayor abandono",
    description: "Lecciones que se empiezan pero no se terminan.",
    howComputed:
      "Para cada lección con suficiente muestra, qué parte de quienes la empiezan no la terminan, de mayor a menor.",
    goodWhen: "Ninguna lección con abandono muy por encima del resto.",
  },
  exercise_error_rate: {
    label: "Ejercicios con más errores",
    description: "Los ejercicios que más se responden mal.",
    howComputed:
      "Para cada ejercicio con suficiente muestra, qué parte de las respuestas son incorrectas, de mayor a menor.",
    goodWhen: "Permite detectar ejercicios confusos o mal calibrados.",
  },
  exercise_retries: {
    label: "Ejercicios con más reintentos",
    description: "Los ejercicios que requieren más intentos por persona.",
    howComputed:
      "Para cada ejercicio, cuántos intentos hace en promedio cada persona, de mayor a menor.",
    goodWhen: "Reintentos moderados; muchos reintentos marcan fricción.",
  },
  accuracy_evolution: {
    label: "Evolución de respuestas correctas",
    description: "Cómo evoluciona el porcentaje de aciertos día a día.",
    howComputed: "Para cada día, qué parte de los ejercicios se respondió correctamente.",
    goodWhen: "Estable o creciente; una caída marca contenido nuevo difícil o un problema.",
  },
  topics_completed: {
    label: "Temas completados",
    description: "Temas (capítulos) terminados en el período.",
    howComputed: "Contamos los temas que se terminaron dentro del período.",
    goodWhen: "Crece junto con las lecciones completadas.",
  },
  accuracy_global: {
    label: "Precisión global",
    description: "Qué porcentaje de los ejercicios se responde correctamente.",
    howComputed:
      "Dividimos los ejercicios respondidos bien por el total de ejercicios respondidos en el período.",
    goodWhen: "Alta pero no del 100% (si es muy alta, el contenido puede ser demasiado fácil).",
    threshold: { dir: "up", warn: 70, danger: 55 },
  },
  accuracy_by_type: {
    label: "Precisión por tipo de ejercicio",
    description:
      "Qué tan bien se responde cada tipo de ejercicio (elegir significado, elegir seña, emparejar, con cámara, etc.).",
    howComputed:
      "Para cada tipo de ejercicio, qué parte se respondió correctamente dentro del período.",
    goodWhen: "Pareja entre tipos; un tipo muy bajo marca contenido o experiencia a revisar.",
  },
  sign_reports_pending: {
    label: "Reportes de señas pendientes",
    description: "Reportes de usuarios sobre señas incorrectas o de baja calidad, sin resolver.",
    howComputed: "Contamos los reportes de señas que todavía no se resolvieron.",
    goodWhen: "Cerca de cero; se resuelven rápido.",
    threshold: { dir: "down", warn: 10, danger: 25 },
  },
  sign_report_resolution: {
    label: "Tiempo de resolución de reportes",
    description: "Cuánto tarda en promedio en resolverse un reporte de seña.",
    howComputed: "Promediamos el tiempo entre que se abre un reporte y se resuelve, en el período.",
    goodWhen: "Lo más bajo posible.",
  },
  imports_failed: {
    label: "Actualizaciones de contenido fallidas",
    description: "Veces que la actualización del contenido de los cursos falló.",
    howComputed: "Contamos las actualizaciones de contenido que fallaron dentro del período.",
    goodWhen: "Cero: una falla significa contenido que no se actualizó.",
    threshold: { dir: "down", warn: 1, danger: 3 },
  },
  daily_activity: {
    label: "Actividad diaria",
    description: "Ejercicios resueltos y lecciones completadas por día.",
    howComputed:
      "Para cada día, cuántos ejercicios se resolvieron y cuántas lecciones se completaron.",
    goodWhen: "Constante, sin huecos inesperados.",
  },
  course_completion: {
    label: "Completitud por curso",
    description: "Qué porcentaje de inscripciones completa el curso, curso por curso.",
    howComputed: "Para cada curso, qué parte de sus inscripciones llegó a completarlo.",
    goodWhen: "Permite detectar cursos con mucho abandono.",
  },
  hardest_lessons: {
    label: "Lecciones más difíciles",
    description: "Las lecciones con menor porcentaje de aciertos: candidatas a revisar.",
    howComputed: "Ordenamos las lecciones por su porcentaje de aciertos, de menor a mayor.",
    goodWhen: "Ninguna lección con aciertos muy por debajo del promedio.",
  },
  vocabulary_growth: {
    label: "Señas aprendidas",
    description: "Señas nuevas que la gente incorpora a su vocabulario.",
    howComputed: "Para cada día, cuántas señas nuevas aprendió la gente.",
    goodWhen: "Crece con la actividad de aprendizaje.",
  },

  // ── Gamificación & engagement ────────────────────────────────────────────────────────────────
  xp_daily: {
    label: "Experiencia por día",
    description: "Cuántos puntos de experiencia gana la gente cada día.",
    howComputed: "Sumamos la experiencia ganada por toda la gente cada día del período.",
    goodWhen: "Estable o creciente; refleja el esfuerzo de aprendizaje.",
  },
  streak_avg: {
    label: "Racha promedio",
    description: "Promedio de días seguidos de práctica que llevan los usuarios.",
    howComputed: "Promediamos la racha actual de días de la gente que estuvo activa en el período.",
    goodWhen: "Cuanto más alta, mayor es el hábito diario.",
  },
  streak_over7: {
    label: "Usuarios con racha mayor a 7 días",
    description: "Qué parte de los usuarios lleva una racha de práctica de más de una semana.",
    howComputed: "Qué porcentaje de los usuarios activos lleva más de 7 días seguidos practicando.",
    goodWhen: "Cuanto más alto, mejor retención por hábito.",
    threshold: { dir: "up", warn: 15, danger: 5 },
  },
  achievements_unlocked: {
    label: "Logros desbloqueados",
    description: "Logros que la gente desbloqueó en el período.",
    howComputed: "Contamos los logros que se desbloquearon dentro del período.",
    goodWhen: "Acompaña el interés general.",
  },
  max_streak: {
    label: "Racha máxima",
    description: "La mayor cantidad de días seguidos alcanzada por cualquier usuario.",
    howComputed: "Tomamos la racha más larga que logró cualquier persona.",
    goodWhen: "Alta: muestra que algunos usuarios sostienen un hábito fuerte.",
  },
  xp_per_active_user: {
    label: "Experiencia por usuario activo",
    description:
      "Cuánta experiencia gana en promedio cada usuario activo (no se infla con más gente).",
    howComputed: "Dividimos toda la experiencia del período por la cantidad de usuarios activos.",
    goodWhen: "Estable o creciente: cada usuario activo avanza, más allá del total.",
  },
  achievement_unlock_rate: {
    label: "Tasa de desbloqueo de logros",
    description: "Qué parte de las oportunidades de logro se desbloquearon.",
    howComputed:
      "Comparamos los logros que la gente desbloqueó con todos los que podría desbloquear.",
    goodWhen: "Ni muy baja (logros inalcanzables) ni del 100% (demasiado fáciles).",
  },
  gem_redemption_rate: {
    label: "Tasa de canje de gemas",
    description: "Qué parte de las gemas que la gente gana se gasta en la tienda.",
    howComputed:
      "Dividimos las gemas gastadas por las gemas que la gente ganó (desafíos, logros y compras) en el período.",
    goodWhen:
      "Equilibrada: cerca del 100% indica una economía sana; muy baja = gemas acumuladas sin usar.",
  },
  xp_distribution: {
    label: "Distribución de experiencia",
    description: "Cuántos usuarios hay en cada nivel de experiencia acumulada.",
    howComputed: "Agrupamos a los usuarios por su experiencia total acumulada.",
    goodWhen: "Una base sana con usuarios avanzando hacia los niveles altos.",
  },
  achievements_least: {
    label: "Logros menos desbloqueados",
    description: "Los logros que casi nadie consigue (incluye los que nadie desbloqueó).",
    howComputed: "Ordenamos los logros por cantidad de desbloqueos, de menor a mayor.",
    goodWhen: "Permite detectar logros inalcanzables o mal calibrados.",
  },
  challenge_claim_rate: {
    label: "Reclamo de desafíos",
    description: "Qué parte de los desafíos completados se reclama efectivamente.",
    howComputed:
      "Dividimos los desafíos reclamados por los desafíos completados, por tipo (diario, semanal, primeros pasos).",
    goodWhen: "Alta: la gente vuelve a buscar su recompensa.",
    threshold: { dir: "up", warn: 50, danger: 30 },
  },
  gifts: {
    label: "Regalos entre usuarios",
    description: "Regalos de gemas enviados entre amigos.",
    howComputed: "Contamos los regalos enviados en el período y qué parte se aceptó.",
    goodWhen: "Señal de comunidad activa.",
  },
  gems_spent: {
    label: "Gemas gastadas",
    description: "Total de gemas gastadas en la tienda en el período.",
    howComputed: "Sumamos todas las gemas que la gente gastó en la tienda dentro del período.",
    goodWhen: "Refleja una economía interna activa y balanceada.",
  },
  shop_top: {
    label: "Ítems más comprados",
    description: "Ranking de ítems de la tienda por cantidad de compras.",
    howComputed: "Contamos las compras de cada ítem de la tienda dentro del período.",
    goodWhen: "Diversidad sana; permite ajustar precios y stock.",
  },
  lives_lost: {
    label: "Vidas perdidas",
    description: "Vidas consumidas por respuestas incorrectas (indicador de dificultad).",
    howComputed: "Contamos las vidas que la gente perdió por responder mal dentro del período.",
    goodWhen: "Ni muy alto (frustración) ni cero (demasiado fácil).",
  },

  // ── Infraestructura · Backend ──────────────────────────────────────────────────────────────────
  backend_up: {
    label: "Servidor",
    description: "Si el servidor de SignaSource está respondiendo.",
    howComputed: "Revisamos si el servidor contesta (operativo o caído).",
    goodWhen: "Siempre operativo.",
  },
  r2_up: {
    label: "Almacenamiento de animaciones",
    description: "Disponibilidad del almacenamiento de las animaciones de señas.",
    howComputed: "Revisamos si el almacenamiento de animaciones responde.",
    goodWhen: "Siempre operativo; si cae, las animaciones no se descargan.",
  },
  latency_p50: {
    label: "Tiempo de respuesta típico",
    description: "Cuánto tarda en responder el servidor en un caso típico.",
    howComputed: "Tomamos el tiempo de respuesta que supera a la mitad de las consultas.",
    goodWhen: "Bajo y estable (decenas de milisegundos).",
  },
  latency_p95: {
    label: "Tiempo de respuesta en casos lentos",
    description: "Cuánto tarda el servidor en el 95% más rápido de las consultas.",
    howComputed:
      "Tomamos el tiempo que supera al 95% de las consultas (deja afuera el 5% más lento).",
    goodWhen: "Por debajo de medio segundo.",
    threshold: { dir: "down", warn: 0.5, danger: 1 },
  },
  latency_p99: {
    label: "Tiempo de respuesta en el peor 1%",
    description: "Cuánto tarda el 1% de consultas más lentas.",
    howComputed: "Tomamos el tiempo que supera al 99% de las consultas.",
    goodWhen: "Sin picos sostenidos.",
  },
  throughput: {
    label: "Consultas por segundo",
    description: "Cuántas consultas por segundo atiende el servidor.",
    howComputed: "Contamos cuántas consultas por segundo recibe el servidor en promedio.",
    goodWhen: "Acompaña el uso real sin saturar.",
  },
  error_rate: {
    label: "Errores del servidor",
    description: "Qué parte de las consultas termina en un error del servidor.",
    howComputed:
      "Dividimos las consultas que fallan por culpa del servidor por el total de consultas.",
    goodWhen: "Por debajo del 1%.",
    threshold: { dir: "down", warn: 0.01, danger: 0.05 },
  },
  error_rate_4xx: {
    label: "Consultas rechazadas",
    description:
      "Qué parte de las consultas se rechaza (datos inválidos, sin permiso, no encontrado).",
    howComputed: "Dividimos las consultas rechazadas por el total de consultas.",
    goodWhen: "Estable; un salto puede indicar un error en la app o un uso abusivo.",
  },
  slowest_ops: {
    label: "Operaciones más lentas",
    description: "Las partes de la app que más tardan en responder.",
    howComputed: "Ordenamos las operaciones por su tiempo de respuesta en los casos lentos.",
    goodWhen: "Ninguna operación domina el tiempo de respuesta.",
  },
  cpu_host: {
    label: "Uso de CPU del servidor",
    description: "Cuánta capacidad de cálculo del servidor se está usando.",
    howComputed: "Medimos el porcentaje de la CPU del servidor que está en uso.",
    goodWhen: "Con margen; sostenido por debajo del 85%.",
    threshold: { dir: "down", warn: 70, danger: 85 },
  },
  mem_host: {
    label: "Uso de memoria del servidor",
    description: "Cuánta memoria del servidor se está usando.",
    howComputed: "Medimos el porcentaje de la memoria del servidor que está en uso.",
    goodWhen: "Con margen; sostenido por debajo del 85%.",
    threshold: { dir: "down", warn: 75, danger: 85 },
  },
  cpu_containers: {
    label: "CPU por servicio",
    description: "Cuánta CPU consume cada servicio del sistema.",
    howComputed: "Medimos el uso de CPU de cada servicio por separado.",
    goodWhen: "Repartida; sin un servicio acaparando.",
  },
  mem_containers: {
    label: "Memoria por servicio",
    description: "Cuánta memoria usa cada servicio del sistema.",
    howComputed: "Medimos la memoria usada por cada servicio por separado.",
    goodWhen: "Estable; sin crecer indefinidamente (posible fuga).",
  },
  db_connections_active: {
    label: "Conexiones a la base en uso",
    description: "Cuántas conexiones a la base de datos se están usando en este momento.",
    howComputed: "Contamos las conexiones a la base de datos que están ocupadas.",
    goodWhen: "Por debajo del máximo disponible; sin saturar.",
  },
  db_connections_pending: {
    label: "Conexiones a la base en espera",
    description: "Cuántas tareas están esperando una conexión libre a la base.",
    howComputed: "Contamos las tareas que esperan una conexión libre a la base de datos.",
    goodWhen: "Cero la mayor parte del tiempo.",
  },
  pg_connections: {
    label: "Conexiones a la base de datos",
    description: "Cuántas conexiones hay abiertas contra la base de datos.",
    howComputed: "Contamos las conexiones abiertas contra la base de datos.",
    goodWhen: "Dentro del límite configurado.",
  },
  r2_presign_latency: {
    label: "Tiempo de preparación de animaciones",
    description: "Cuánto tarda en prepararse el acceso a una animación.",
    howComputed: "Medimos el tiempo de preparación en los casos lentos.",
    goodWhen: "Pocos milisegundos.",
  },
  r2_download_latency: {
    label: "Tiempo de acceso a las animaciones",
    description: "Cuánto tarda el servidor en traer una animación del almacenamiento.",
    howComputed: "Medimos el tiempo de acceso al almacenamiento en los casos lentos.",
    goodWhen: "Bajo y estable.",
  },
  email_sent: {
    label: "Emails enviados",
    description: "Correos enviados (verificación, recuperación de contraseña, invitaciones).",
    howComputed: "Contamos los correos enviados por segundo en promedio.",
    goodWhen: "Acompaña altas e invitaciones.",
  },
  email_failures: {
    label: "Fallos de email",
    description: "Correos que no se pudieron enviar.",
    howComputed: "Contamos los correos que fallaron por segundo en promedio.",
    goodWhen: "Cero: un fallo impide verificar cuentas o recuperar contraseñas.",
    threshold: { dir: "down", warn: 0.001, danger: 0.01 },
  },
  push_sent: {
    label: "Notificaciones enviadas",
    description: "Notificaciones push enviadas a los celulares.",
    howComputed: "Contamos las notificaciones enviadas por segundo en promedio.",
    goodWhen: "Acompaña logros, desafíos y actividad social.",
  },
  push_failures: {
    label: "Fallos de notificaciones",
    description: "Notificaciones push que no se pudieron enviar.",
    howComputed: "Contamos las notificaciones que fallaron por segundo en promedio.",
    goodWhen: "Bajo; los destinos inválidos se limpian solos.",
  },
  jvm_heap: {
    label: "Memoria de la aplicación",
    description: "Cuánta memoria está usando la aplicación del servidor.",
    howComputed: "Medimos la memoria que usa la aplicación del servidor.",
    goodWhen: "Con margen frente al máximo; sin crecimiento indefinido.",
  },
  client_errors: {
    label: "Errores en las apps",
    description:
      "Errores que reportan las apps (web y celular): red, pantallas, fallos de conexión.",
    howComputed: "Contamos los errores que reportan las apps por segundo, por tipo.",
    goodWhen: "Bajo y estable; un salto marca un error en la app o una caída de red.",
  },
  jvm_gc_pause: {
    label: "Pausas de mantenimiento",
    description: "Tiempo que la aplicación pasa liberando memoria.",
    howComputed: "Medimos el tiempo que la aplicación dedica a liberar memoria.",
    goodWhen: "Bajo; pausas largas afectan el tiempo de respuesta.",
  },

  // ── Infraestructura · Web / Landing ──────────────────────────────────────────────────────────
  web_vitals: {
    label: "Experiencia en el navegador",
    description: "Qué tan rápida y estable se siente la web (carga, estabilidad, respuesta).",
    howComputed: "Medimos la experiencia percibida que reportan los navegadores de la gente.",
    goodWhen: "Carga en menos de 2,5 s, responde en menos de 200 ms y es estable.",
  },
  screen_load: {
    label: "Carga de pantallas",
    description: "Cuánto tardan en quedar listas las pantallas de la app del celular.",
    howComputed: "Medimos el tiempo de carga de cada pantalla que reportan los celulares.",
    goodWhen: "Pocos cientos de milisegundos; sin pantallas lentas sostenidas.",
  },
  animation_latency: {
    label: "Carga de animaciones",
    description: "Cuánto tarda en cargar la animación 3D de una seña.",
    howComputed: "Medimos el tiempo de carga de las animaciones en los casos lentos.",
    goodWhen: "Pocos cientos de milisegundos.",
  },

  // ── Infraestructura · Reconocimiento de señas ──────────────────────────────────────────────────
  recognition_accuracy: {
    label: "Precisión del reconocimiento",
    description: "Qué parte de los ejercicios con cámara se resuelve correctamente.",
    howComputed:
      "Dividimos los ejercicios con cámara respondidos bien por el total de ejercicios con cámara.",
    goodWhen: "Alta; una caída puede indicar peor reconocimiento o peores condiciones de cámara.",
    threshold: { dir: "up", warn: 65, danger: 50 },
  },
  recognition_attempts: {
    label: "Ejercicios con cámara",
    description: "Ejercicios de reconocimiento con cámara realizados en el período.",
    howComputed: "Contamos los ejercicios con cámara que se respondieron dentro del período.",
    goodWhen: "Refleja el uso real del reconocimiento en el celular.",
  },
  ml_inference_latency: {
    label: "Tiempo de reconocimiento",
    description: "Cuánto tarda el celular en reconocer cada imagen de una seña.",
    howComputed: "Medimos el tiempo de reconocimiento en el celular en los casos lentos.",
    goodWhen: "Suficientemente bajo para mantener la cámara fluida.",
  },
  ml_confidence: {
    label: "Confianza del reconocimiento",
    description: "Qué tan seguro está el reconocimiento de sus predicciones.",
    howComputed: "Promediamos la seguridad de las predicciones que reportan los celulares.",
    goodWhen: "Alta y estable; una caída sugiere que el reconocimiento empeora.",
  },
  ml_fps: {
    label: "Fluidez de la cámara",
    description: "Cuántas imágenes por segundo procesa la cámara durante el reconocimiento.",
    howComputed: "Promediamos las imágenes por segundo que reportan los celulares.",
    goodWhen: "Fluido (idealmente 15 o más por segundo).",
  },
  ml_inference_rate: {
    label: "Volumen de reconocimiento",
    description:
      "Cuántos reconocimientos de señas se procesan por segundo. El reconocimiento corre en el celular, así que no tiene costo de servidor.",
    howComputed: "Contamos los reconocimientos por segundo que reportan los celulares.",
    goodWhen: "Acompaña el uso de ejercicios con cámara; cae a cero si el reconocimiento se cae.",
  },
} satisfies Record<string, MetricDef>;

export type MetricId = keyof typeof METRICS;
