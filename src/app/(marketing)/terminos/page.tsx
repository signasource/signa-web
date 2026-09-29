import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, Todo } from "@/components/legal/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  // Draft pending legal review: keep out of search results until published.
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones">
      <Section title="1. Aceptación">
        <p>
          Al crear una cuenta o usar Signa (aplicación móvil, panel web y sitio) aceptás estos
          términos y nuestra <Link href="/privacidad">Política de privacidad</Link>. Si no estás de
          acuerdo, no uses el servicio.
        </p>
      </Section>

      <Section title="2. Qué es Signa">
        <p>
          Signa es una plataforma para aprender Lengua de Señas Argentina (LSA) con cursos,
          ejercicios y reconocimiento de señas por cámara. Es un {legal.project} de la{" "}
          {legal.institution}, desarrollado por estudiantes:{" "}
          <Todo>COMPLETAR: nombres del equipo</Todo>.
        </p>
        <p>
          <strong>Es un proyecto académico en desarrollo.</strong> El servicio puede tener errores,
          cambiar, interrumpirse o discontinuarse, y se ofrece «tal cual está», sin garantías de
          disponibilidad continua.
        </p>
      </Section>

      <Section title="3. Tu cuenta">
        <ul>
          <li>Debés dar información veraz y mantenerla actualizada.</li>
          <li>Sos responsable de tu contraseña y de lo que ocurra desde tu cuenta.</li>
          <li>Avisanos si sospechás un uso no autorizado.</li>
          <li>
            Debés cumplir la edad mínima indicada en la Política de privacidad, o contar con
            autorización de tu madre, padre o tutor.
          </li>
        </ul>
      </Section>

      <Section title="4. Uso aceptable">
        <p>No está permitido:</p>
        <ul>
          <li>Acceder a cuentas o datos de otras personas, ni intentar vulnerar la seguridad.</li>
          <li>
            Usar bots o automatizaciones para obtener ventajas (XP, gemas, rachas) o sobrecargar el
            servicio.
          </li>
          <li>
            Acosar, discriminar o publicar contenido ofensivo, en especial en las funciones
            sociales.
          </li>
          <li>Copiar, revender o distribuir el contenido educativo sin autorización.</li>
          <li>Usar el servicio para fines ilegales.</li>
        </ul>
      </Section>

      <Section title="5. Alcance del contenido educativo">
        <p>
          Signa es una herramienta de aprendizaje. No reemplaza un curso formal ni a un intérprete
          de LSA certificado, y no debe usarse para interpretación profesional, legal o médica. El
          reconocimiento de señas por cámara es automático y puede equivocarse.
        </p>
      </Section>

      <Section title="6. Gemas y compras">
        <p>
          Las gemas son un elemento virtual de la aplicación, sin valor monetario fuera de ella. Las
          compras se realizan a través de Google Play y se rigen también por sus condiciones. La
          acreditación de gemas depende de que Google confirme el pago.
        </p>
        <p>
          <Todo>
            REVISAR: política de reembolsos y derecho de arrepentimiento (Ley N.º 24.240), y si
            corresponde ofrecer compras con dinero real siendo un proyecto académico (situación
            fiscal y comercial del equipo)
          </Todo>
        </p>
      </Section>

      <Section title="7. Organizaciones">
        <ul>
          <li>
            Una organización puede contratar cursos y sumar participantes con códigos o invitaciones
            por email. Sus administradores ven el progreso de los participantes, como se detalla en
            la Política de privacidad.
          </li>
          <li>
            La organización es responsable de informar a sus participantes y de tener derecho a
            tratar sus datos.
          </li>
          <li>Los administradores solo deben usar esa información para fines de capacitación.</li>
          <li>
            <Todo>COMPLETAR: condiciones comerciales de la contratación (precio, plazo, baja)</Todo>
          </li>
        </ul>
      </Section>

      <Section title="8. Propiedad intelectual">
        <p>
          El software, los cursos, las ilustraciones y animaciones de Signa pertenecen a sus
          autores. Te otorgamos una licencia personal, limitada, no exclusiva e intransferible para
          usar el servicio.{" "}
          <Todo>
            COMPLETAR: licencia del código y de los contenidos (por ejemplo, si el proyecto será de
            código abierto) y créditos de terceros
          </Todo>
        </p>
      </Section>

      <Section title="9. Limitación de responsabilidad">
        <p>
          En la medida que la ley lo permita, el equipo no responde por interrupciones del servicio,
          pérdida de progreso o daños indirectos derivados del uso de Signa. Esto no limita los
          derechos que la ley de defensa del consumidor te reconoce y que no pueden renunciarse.
        </p>
      </Section>

      <Section title="10. Suspensión y baja">
        <p>
          Podés eliminar tu cuenta cuando quieras desde la aplicación. Podemos suspender o dar de
          baja cuentas que incumplan estos términos.
        </p>
      </Section>

      <Section title="11. Cambios en los términos">
        <p>
          Podemos modificar estos términos. Publicaremos la versión vigente aquí con su fecha y, si
          el cambio es importante, te avisaremos en la aplicación. Si seguís usando Signa después
          del cambio, lo aceptás.
        </p>
      </Section>

      <Section title="12. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por las leyes de la República Argentina.{" "}
          <Todo>
            REVISAR: jurisdicción competente (por ejemplo, tribunales ordinarios de la ciudad de
            Córdoba), respetando el derecho del consumidor a demandar en su domicilio
          </Todo>
        </p>
      </Section>

      <Section title="13. Contacto">
        <p>Escribinos a {legal.contactEmail}.</p>
      </Section>
    </LegalPage>
  );
}
