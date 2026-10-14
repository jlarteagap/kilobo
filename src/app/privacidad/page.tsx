import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacidad | Kilo",
  description: "Qué datos tratamos, dónde se guardan y cómo se ejercen tus derechos.",
}

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "Responsable",
    p: [
      "Kilo es una aplicación de finanzas personales. El responsable del tratamiento de tus datos es quien opera este servicio y puede contactarse a través de la propia aplicación.",
    ],
  },
  {
    h: "Qué datos tratamos",
    p: [
      "Datos de cuenta: identificador de usuario, correo electrónico y proveedor de autenticación (inicio de sesión con Google).",
      "Datos financieros que tú registras: cuentas y saldos, transacciones con su fecha, importe, moneda, categoría, etiqueta y descripción, presupuestos, deudas, créditos, inversiones, objetivos de ahorro, turnos de conductor, depósitos y gastos de vehículo.",
      "Datos de uso: qué páginas visitas dentro de la aplicación.",
    ],
  },
  {
    h: "Para qué los usamos",
    p: [
      "Solo para prestarte el servicio: calcular tus balances, mostrarte tus métricas y generar los cálculos que tú solicitas.",
      "No vendemos tus datos. No los usamos para publicidad ni perfiles.",
      "No utilizamos modelos de IA de terceros sobre tus movimientos: todos los cálculos se ejecutan en nuestros servidores.",
    ],
  },
  {
    h: "Dónde se almacenan y quién accede a ellos",
    p: [
      "Tus datos se almacenan en Google Firebase (Firestore), un servicio de Google Cloud con centros de datos en los Estados Unidos de América.",
      "Esto implica que la información se transfiere fuera del territorio en el que te encuentras. Es un tratamiento deliberado y necesario para darte el servicio, y te lo declaramos de forma expresa.",
      "El acceso a la base de datos no está abierto: todas las consultas pasan por nuestros servidores, que verifican que cada petición corresponda a tu cuenta. No existe acceso directo a la base de datos desde el navegador.",
    ],
  },
  {
    h: "Cuánto tiempo conservamos los datos",
    p: [
      "Mientras tu cuenta esté activa. No fijamos un plazo automático de conservación distinto, porque los datos financieros pierden sentido si se archivan sin contexto.",
      "Puedes eliminarlos cuando quieras desde Ajustes; la eliminación es inmediata e irreversible.",
    ],
  },
  {
    h: "Tus derechos",
    p: [
      "Acceso y portabilidad: exportas toda tu información desde Ajustes, en un archivo legible.",
      "Supresión: eliminas tu cuenta y con ella todos tus datos, desde Ajustes.",
      "Rectificación: editas o eliminas cualquier registro desde la propia aplicación, sin intervención de un operador.",
    ],
  },
  {
    h: "Cookies",
    p: [
      "Solo se usan dos, y ninguna de ellas es de seguimiento ni publicitaria.",
      "session: cookie técnica, obligatoria, que mantiene tu sesión iniciada durante 7 días. No es accesible desde JavaScript.",
      "sidebar_state: recuerda si el menú lateral está plegado. Es funcional y no identifica a nadie.",
      "car_access: solo en /gasolina, cuando alguien introduce el token del vehículo compartido. No contiene el token en sí, sino su huella criptográfica.",
    ],
  },
  {
    h: "Seguridad",
    p: [
      "Las sesiones usan cookies HttpOnly y SameSite estricto.",
      "Las peticiones que modifican datos verifican que provienen de esta misma aplicación.",
      "Las operaciones más costosas y las que dan acceso a datos están limitadas por número de peticiones para impedir su uso automatizado.",
    ],
  },
  {
    h: "Menores de edad",
    p: [
      "El servicio es para mayores de 18 años. No recopilamos datos de menores de manera intencionada.",
    ],
  },
]

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Política de privacidad
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
          Kilo es una herramienta de registro personal. No es un intermediario
          financiero ni ofrece asesoramiento de inversión.
        </p>
      </div>
    </div>
  )
}