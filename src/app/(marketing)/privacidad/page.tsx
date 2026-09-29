import type { Metadata } from "next";
import { LegalPage, Section, Todo } from "@/components/legal/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  // Draft pending legal review: keep out of search results until published.
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <Section title="1. Quiénes somos">
        <p>
          Signa es una aplicación para aprender Lengua de Señas Argentina (LSA). Es un{" "}
          {legal.project} de la {legal.institution}, desarrollado por un equipo de estudiantes:{" "}
          <Todo>COMPLETAR: nombres del equipo</Todo>. No somos una empresa constituida.
        </p>
        <p>
          Esta política explica qué datos personales tratamos, para qué, con quién los compartimos y
          qué derechos tenés. Aplica a la aplicación móvil, al panel web para organizaciones y a
          este sitio.
        </p>
      </Section>

      <Section title="2. Qué datos recopilamos">
        <ul>
          <li>
            <strong>Cuenta:</strong> nombre, apellido, email, nombre de usuario y contraseña. La
            contraseña se guarda cifrada (hash); nunca la almacenamos ni la vemos en texto plano. Si
            ingresás con Google, recibimos de Google los datos básicos de tu cuenta.
          </li>
          <li>
            <strong>Aprendizaje:</strong> cursos y lecciones, intentos y resultados de los
            ejercicios, señas aprendidas, puntos de experiencia (XP), racha, logros, minutos de
            estudio por día, meta diaria, vidas y gemas.
          </li>
          <li>
            <strong>Social:</strong> solicitudes de amistad, amistades, actividad que compartís con
            tus amigos y los «me gusta». Lo que otras personas ven de tu perfil depende de la
            visibilidad que configures (público o solo amigos).
          </li>
          <li>
            <strong>Notificaciones:</strong> un identificador de tu dispositivo (token de Firebase
            Cloud Messaging) para enviarte avisos, y el historial de esas notificaciones.
          </li>
          <li>
            <strong>Compras:</strong> si comprás gemas, recibimos un comprobante de Google Play que
            verificamos con Google. No recibimos ni guardamos los datos de tu tarjeta.
          </li>
          <li>
            <strong>Organización:</strong> si te unís a una organización con un código o invitación,
            registramos tu pertenencia y tu progreso en los cursos que esa organización contrató.
          </li>
          <li>
            <strong>Datos técnicos:</strong> registros del servidor necesarios para la seguridad y
            el funcionamiento (por ejemplo, para limitar abusos).
          </li>
        </ul>
        <p>
          <strong>Cámara:</strong> los ejercicios de reconocimiento de señas usan la cámara de tu
          dispositivo. El análisis se realiza <strong>íntegramente en tu teléfono</strong>: no se
          envían ni se guardan imágenes ni video en nuestros servidores.
        </p>
      </Section>

      <Section title="3. Para qué usamos tus datos">
        <ul>
          <li>Crear y administrar tu cuenta, e iniciar tu sesión.</li>
          <li>
            Darte el servicio de aprendizaje: guardar tu avance y calcular XP, rachas y logros.
          </li>
          <li>Habilitar las funciones sociales que vos elegís usar.</li>
          <li>Enviarte notificaciones sobre tu actividad y recordatorios.</li>
          <li>Acreditar las compras de gemas y prevenir fraudes.</li>
          <li>Mostrar el progreso a la organización a la que pertenecés (ver sección 4).</li>
          <li>Mantener la seguridad del sistema y corregir errores.</li>
          <li>
            Fines académicos del proyecto, siempre con estadísticas agregadas que no te identifican.
          </li>
        </ul>
        <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>
      </Section>

      <Section title="4. Organizaciones y sus administradores">
        <p>
          Si usás Signa por una empresa o institución, los administradores de esa organización
          pueden ver en el panel web: tu nombre, apellido y email, tu estado de membresía, tu
          progreso en los cursos contratados, tu última actividad, el módulo que estás cursando, tus
          aciertos en los ejercicios, las señas que aprendiste, tu racha, tus minutos de aprendizaje
          y tus días activos.
        </p>
        <p>
          No ven tus amistades ni tus compras, y los resultados de los ejercicios solo incluyen los
          cursos contratados por la organización (los minutos de estudio y días activos no
          distinguen entre cursos de la organización y personales). Solo los administradores de{" "}
          <em>tu</em> organización acceden a esta información.
        </p>
        <p>
          La organización es responsable de informar a sus participantes sobre este uso y de contar
          con el fundamento adecuado para tratar esos datos.{" "}
          <Todo>
            REVISAR: definir con asesoría legal el rol de cada parte (responsable/encargado) y si se
            firma un acuerdo con las organizaciones
          </Todo>
        </p>
      </Section>

      <Section title="5. Con quién compartimos datos">
        <p>Usamos proveedores que tratan datos por nuestra cuenta para que el servicio funcione:</p>
        <ul>
          <li>
            <strong>Google:</strong> inicio de sesión con Google y facturación de Google Play.
          </li>
          <li>
            <strong>Firebase (Google):</strong> envío de notificaciones push.
          </li>
          <li>
            <strong>Cloudflare:</strong> almacenamiento y entrega de contenido educativo
            (animaciones de señas). No contiene datos personales.
          </li>
          <li>
            <strong>Proveedor de correo:</strong> envío de emails de verificación, recuperación de
            contraseña e invitaciones. <Todo>COMPLETAR: proveedor</Todo>
          </li>
          <li>
            <strong>Hosting:</strong> <Todo>COMPLETAR: proveedor y región del servidor</Todo>
          </li>
        </ul>
        <p>
          Algunos de estos proveedores pueden almacenar datos en servidores fuera de Argentina.
          También podríamos divulgar datos si una autoridad competente lo exige legalmente.
        </p>
      </Section>

      <Section title="6. Cuánto tiempo conservamos tus datos">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta, se desactiva
          de inmediato: no podrás iniciar sesión, tu perfil deja de mostrarse a otras personas y
          dejás de aparecer en las búsquedas. Tu email se reemplaza por un valor anónimo y borramos
          tus sesiones y los tokens de tus dispositivos.
        </p>
        <p>
          <Todo>
            COMPLETAR: hoy la baja NO borra el nombre, apellido, usuario ni el progreso. Definir si
            se eliminan o anonimizan definitivamente, en qué plazo, y ajustar este texto o el
            sistema en consecuencia
          </Todo>
        </p>
      </Section>

      <Section title="7. Seguridad">
        <p>
          Aplicamos medidas razonables: conexiones cifradas (HTTPS), contraseñas almacenadas con
          hash, sesiones con tokens que se renuevan, permisos por rol (cada administrador solo
          accede a su organización) y cabeceras de seguridad en el sitio web. Ningún sistema es
          infalible; si detectamos un incidente que afecte tus datos, te lo informaremos.
        </p>
      </Section>

      <Section title="8. Tus derechos">
        <p>
          Conforme a la Ley N.º 25.326 de Protección de los Datos Personales, podés acceder a tus
          datos, y solicitar su rectificación, actualización o supresión. Podés ejercer estos
          derechos desde la aplicación (por ejemplo, editando tu perfil o eliminando tu cuenta) o
          escribiéndonos a {legal.contactEmail}.
        </p>
        <p>
          La Agencia de Acceso a la Información Pública (AAIP), en su carácter de órgano de control
          de la Ley N.º 25.326, tiene la atribución de atender las denuncias y reclamos de quienes
          resulten afectados en sus derechos por incumplimiento de las normas de protección de datos
          personales.
        </p>
        <p>
          <Todo>
            REVISAR: evaluar con asesoría si corresponde inscribir la base de datos en el registro
            de la AAIP
          </Todo>
        </p>
      </Section>

      <Section title="9. Menores de edad">
        <p>
          Signa está pensada para el público general. Las personas menores de{" "}
          <Todo>COMPLETAR: edad mínima</Todo> años deben usar la aplicación con autorización de su
          madre, padre o tutor.
        </p>
      </Section>

      <Section title="10. Cambios en esta política">
        <p>
          Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su
          fecha de actualización y, si el cambio es importante, te avisaremos dentro de la
          aplicación.
        </p>
      </Section>

      <Section title="11. Contacto">
        <p>Para consultas sobre privacidad, escribinos a {legal.contactEmail}.</p>
      </Section>
    </LegalPage>
  );
}
