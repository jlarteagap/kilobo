# Kilo - Gestión de Finanzas Personales

Kilo es una aplicación moderna de gestión de finanzas personales y seguimiento de patrimonio neto, diseñada para ofrecer una visión clara y detallada de la salud financiera del usuario.

## 🚀 Tecnologías Principales

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Gestión de Estado y Datos:** [TanStack Query (React Query) v5](https://tanstack.com/query/latest)
- **Base de Datos y Autenticación:** [Firebase](https://firebase.google.com/) / [Supabase](https://supabase.com/) (Preparado para integración)
- **Componentes UI:** [Radix UI](https://www.radix-ui.com/) y [Lucide React](https://lucide.dev/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Formularios:** [React Hook Form](https://react-hook-form.com/) con validación [Zod](https://zod.dev/)

## ✨ Características Principales

- **Dashboard General:** Resumen visual del patrimonio neto total, distribuido por moneda (BOB/USD).
- **Gestión de Cuentas:** Registro y seguimiento de diferentes tipos de cuentas (Efectivo, Banco, Inversiones, Deudas).
- **Control de Transacciones:** Historial detallado de ingresos y gastos con categorización y etiquetas.
- **Gráficos Estadísticos:** Visualización dinámica de flujos de caja, distribución de activos y tendencias mensuales.
- **Multimoneda:** Soporte completo para transacciones y balances en Bolivianos (BOB) y Dólares (USD).

## 📁 Estructura del Proyecto

```text
src/
├── app/            # Rutas y páginas de Next.js
├── components/     # Componentes de UI compartidos
├── features/       # Módulos específicos (accounts, transactions, dashboard)
├── hooks/          # Hooks personalizados de React
├── lib/            # Utilidades y configuraciones externas
├── repositories/   # Capa de acceso a datos
├── services/       # Lógica de negocio
└── types/          # Definiciones de tipos TypeScript
```

## 🛠️ Configuración de Desarrollo

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar variables de entorno:**
    Crea un archivo `.env` basado en las necesidades de Firebase/Supabase.

3.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

4.  **Abrir en el navegador:**
    [http://localhost:3000](http://localhost:3000)
