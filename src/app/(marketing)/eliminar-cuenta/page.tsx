import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Eliminar cuenta",
  description:
    "Cómo eliminar tu cuenta de Signa y los datos asociados, qué se borra y qué se conserva.",
};

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Eliminar tu cuenta de Signa">
      <Section title="Desde la aplicación">
        <ol className="flex flex-col gap-1 [&_li]:ml-5 [&_li]:list-decimal">
          <li>Abrí Signa e iniciá sesión.</li>
          <li>
            Entrá a <strong>Configuración</strong>.
          </li>
          <li>
            Tocá <strong>Eliminar cuenta</strong> y confirmá.
          </li>
        </ol>
        <p>La cuenta se elimina de inmediato y no se puede deshacer.</p>
      </Section>

      <Section title="Si no tenés la aplicación o no podés iniciar sesión">
        <p>
          Escribinos a <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> desde el
          email con el que te registraste, con el asunto «Eliminar cuenta». Procesamos el pedido en
          un máximo de 30 días.
        </p>
      </Section>

      <Section title="Qué datos se eliminan">
        <ul>
          <li>Tu email, nombre, apellido y nombre de usuario.</li>
          <li>Tu progreso en cursos, lecciones y ejercicios, y tus intentos.</li>
          <li>Tus estadísticas, racha, XP, logros y desafíos.</li>
          <li>Tus amistades, solicitudes y «me gusta».</li>
          <li>Tus notificaciones, configuraciones y los datos de tus dispositivos.</li>
          <li>Tu pertenencia a organizaciones y las invitaciones enviadas a tu email.</li>
        </ul>
      </Section>

      <Section title="Qué datos se conservan">
        <ul>
          <li>
            El historial de compras y de regalos de gemas, por obligaciones contables y fiscales.
            Queda sin ningún dato que te identifique.
          </li>
        </ul>
      </Section>

      <Section title="Más información">
        <p>
          Podés leer cómo tratamos tus datos en nuestra{" "}
          <a href="/privacidad">política de privacidad</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
