import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos | Kilo",
  description: "Condiciones de uso de Kilo.",
}

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "Objeto",
    p: [
      "Kilo es una herramienta de registro y organización de finanzas personales. Al usarla aceptas estas condiciones.",
      "El acceso es gratuito y requiere una cuenta. El inicio de sesión se realiza con Google.",
    ],
  },
  {
    h: "Qué es y qué no es",
    p: [
      "Kilo NO es un intermediario financiero, ni una entidad de pago, ni un asesor de inversión. No mueve fondos, no custodia dinero y no emite recomendaciones.",
      "La información de la app de transporte, del vehículo o del mantenimiento del auto que registres es compartida entre las personas que así lo decidan. Cada participante responde de lo que registre.",
    ],
  },
  {
    h: "Exactitud de los cálculos",
    p: [
      "Los saldos, métricas y gráficos que ves los calcula la aplicación a partir de lo que registras. No hay conexión con tu banco ni con la app de transporte: si no registras un movimiento, la aplicación no lo sabe.",
      "Los tipos de cambio provienen de fuentes de terceros y pueden no reflejar el precio al que realmente operaste.",
      "Kilo muestra las cifras con redondeo. Las operaciones de conversión entre monedas pueden producir diferencias de centavos frente a tu banco.",
      "Verifica siempre los saldos antes de tomar una decisión financiera. La aplicación es un registro, no una fuente oficial.",
    ],
  },
  {
    h: "Tu responsabilidad con los datos",
    p: [
      "Eres responsable de la exactitud de lo que registras y de mantener tus credenciales bajo tu control.",
      "Los saldos se calculan a partir de tus registros, no se verifican contra ninguna fuente externa. Un movimiento mal registrado produce un saldo incorrecto.",
    ],
  },
  {
    h: "Tus datos y tu eliminación",
    p: [
      "Tratamos tus datos conforme a la política de privacidad. Puedes exportar tu información y eliminar tu cuenta en cualquier momento desde Ajustes.",
      "La eliminación es inmediata e irreversible. Conserva una copia exportada antes de eliminarla si quieres conservarla.",
    ],
  },
  {
    h: "Disponibilidad",
    p: [
      "El servicio se ofrece tal cual, sin garantía de disponibilidad continua. Podemos modificar o retirar funciones.",
      "No respondemos por pérdidas derivadas del uso de la aplicación, incluidas decisiones tomadas a partir de sus cálculos.",
    ],
  },
  {
    h: "Cambios",
    p: [
      "Podemos actualizar estas condiciones. Los cambios relevantes se indicarán en esta misma página.",
    ],
  },
]

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Términos de uso
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Última actualización: {new Date().toLocaleDateString("es-BO")}
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">
                {s.h}
              </h2>
              <div className="mt-2 space-y-2">
                {s.p.map((p) => (
                  <p key={p} className="text-[14px] leading-relaxed text-zinc-600">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-[13px] text-zinc-400">
          Consulta también nuestra{" "}
          <a href="/privacidad" className="underline underline-offset-2">
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  )
}