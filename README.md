<div align="center">

# 🏋️ Gym Admin

**Sistema de gestión para gimnasios — Panel administrativo SaaS**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?style=flat-square&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=flat-square&logo=prisma)](https://prisma.io)

[Demo en vivo](#) · [Reportar bug](#) · [Solicitar función](#)

</div>

---

## 📌 Descripción

**Gym Admin** es un sistema de gestión integral para gimnasios, diseñado con estética SaaS moderna. Permite administrar alumnos, controlar cobros, visualizar métricas financieras y llevar seguimiento nutricional y de progreso físico — todo desde un panel centralizado y responsivo.

Pensado para dueños o administradores de gimnasios que necesitan una herramienta profesional, rápida y fácil de usar desde cualquier dispositivo.

---

## ✨ Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 🔐 **Autenticación** | Login seguro con JWT, sesión persistente, protección de rutas |
| 📊 **Dashboard** | KPIs en tiempo real, gráficas de ingresos, estado de alumnos |
| 👥 **Alumnos** | Alta, edición, historial de pagos, progreso físico y medidas corporales |
| 💳 **Pagos** | Registro de cobros, control de mora, métodos de pago, reportes mensuales |
| 🥗 **Dietas** | Creación de planes nutricionales con comidas, horarios y alimentos |
| 📦 **Planes** | Gestión de planes de membresía con precios y duraciones |
| 🔔 **Notificaciones** | Alertas programadas de vencimientos y avisos a alumnos |
| ⚙️ **Configuración** | Ajustes del sistema y perfil de administrador |

---

## 🖼️ Capturas

> *(Reemplazá con capturas reales de tu instancia)*

| Pantalla | Vista |
|----------|-------|
| Login | Panel de acceso con diseño split premium |
| Dashboard | KPIs + gráficas de ingresos y estado de alumnos |
| Alumnos | Tabla enriquecida con filtros y búsqueda |
| Pagos | Módulo financiero con charts y control de mora |

---

## 🛠️ Stack tecnológico

### Frontend — `apps/admin`
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 14 | Framework principal, App Router |
| React | 18 | UI |
| TypeScript | 5.3 | Tipado estático |
| Tailwind CSS | 3.4 | Estilos |
| Recharts | 2 | Gráficas |
| TanStack Query | 5 | Data fetching y caché |
| React Hook Form | 7 | Formularios |
| Zod | 3 | Validación de esquemas |
| Lucide React | — | Iconografía |
| date-fns | 3 | Manejo de fechas |

### Backend — `apps/api`
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| NestJS | 10 | Framework backend |
| TypeScript | 5.3 | Tipado estático |
| Prisma | 5 | ORM |
| PostgreSQL | 16 | Base de datos |
| JWT + Passport | — | Autenticación |
| bcryptjs | — | Hashing de contraseñas |
| Swagger | 7 | Documentación API |
| class-validator | — | Validación de DTOs |

---

## 📂 Estructura del proyecto

```
gym-admin/
├── apps/
│   ├── admin/                  # Frontend Next.js
│   │   └── src/
│   │       ├── app/            # App Router (páginas y layouts)
│   │       │   ├── (dashboard)/
│   │       │   │   ├── dashboard/
│   │       │   │   ├── students/
│   │       │   │   ├── payments/
│   │       │   │   ├── dietas/
│   │       │   │   ├── planes/
│   │       │   │   ├── notifications/
│   │       │   │   ├── perfil/
│   │       │   │   └── settings/
│   │       │   └── login/
│   │       ├── components/
│   │       │   ├── ui/         # Design system (ds.tsx, Modal, Toast)
│   │       │   ├── layout/     # Sidebar, Header
│   │       │   ├── students/   # StudentForm, StudentTable
│   │       │   └── diets/      # DietForm
│   │       ├── services/       # API clients por módulo
│   │       ├── types/          # Interfaces TypeScript
│   │       ├── lib/            # utils, api client
│   │       └── context/        # SidebarContext
│   │
│   └── api/                    # Backend NestJS
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── students/
│           │   ├── payments/
│           │   ├── diet/
│           │   ├── plans/
│           │   ├── notifications/
│           │   ├── dashboard/
│           │   └── weight/
│           ├── common/         # Guards, decorators, pipes
│           └── main.ts
│
├── prisma/
│   ├── schema.prisma           # Modelos de base de datos
│   └── seed.ts                 # Datos iniciales
│
├── docker-compose.yml          # PostgreSQL local
├── .env.example
└── package.json                # Monorepo root
```

---

## ⚙️ Instalación y ejecución

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+ (o Docker)
- npm / yarn

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/gym-admin.git
cd gym-admin
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Editá `.env` con tus valores:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/gym_db"

# API
API_PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Levantar la base de datos

**Con Docker (recomendado):**
```bash
docker-compose up -d
```

**Sin Docker:** asegurate de tener PostgreSQL corriendo y la base de datos creada.

### 4. Instalar dependencias

```bash
# Raíz del monorepo
npm install

# Backend
cd apps/api && npm install

# Frontend
cd apps/admin && npm install
```

### 5. Migraciones y seed

```bash
cd apps/api

# Ejecutar migraciones
npx prisma migrate dev

# Crear usuario admin
npx ts-node src/scripts/setup-admin.ts

# (Opcional) Datos de ejemplo
npx ts-node prisma/seed.ts
```

### 6. Ejecutar el proyecto

**Terminal 1 — API:**
```bash
cd apps/api
npm run dev
# → http://localhost:3001/api/v1
# → Swagger: http://localhost:3001/api/docs
```

**Terminal 2 — Admin:**
```bash
cd apps/admin
npm run dev
# → http://localhost:3000
```

### 7. Acceso inicial

```
URL:         http://localhost:3000
Email:       admin@gym.com
Contraseña:  admin123
```

> ⚠️ Cambiá la contraseña después del primer inicio de sesión.

---

## 🚀 Deploy

### Vercel (Frontend)

1. Conectá tu repositorio en [vercel.com](https://vercel.com)
2. Configurá el directorio raíz: `apps/admin`
3. Agregá las variables de entorno en el dashboard de Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://tu-api.railway.app/api/v1
   ```
4. Build command: `npm run build`
5. Output directory: `.next`

### Railway / Render (Backend)

1. Creá un nuevo servicio apuntando a `apps/api`
2. Configurá las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, etc.)
3. Start command: `npm run start`
4. Asegurate de correr `npx prisma migrate deploy` como release command

### Base de datos en producción

Opciones recomendadas:
- [Neon](https://neon.tech) — PostgreSQL serverless gratuito
- [Supabase](https://supabase.com) — PostgreSQL + extras
- [Railway](https://railway.app) — Simple y rápido

---

## 📈 Roadmap

- [ ] App móvil (React Native / Expo)
- [ ] Notificaciones push en tiempo real (WebSockets)
- [ ] Exportación de reportes en PDF/Excel
- [ ] Portal de autogestión para alumnos
- [ ] Módulo de asistencia con QR
- [ ] Integración con pasarelas de pago
- [ ] Multi-gimnasio (SaaS multi-tenant)
- [ ] Modo oscuro

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abrí un issue antes de enviar un pull request.

1. Fork del proyecto
2. Creá tu rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrí un Pull Request

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---

<div align="center">
Hecho con ❤️ · <strong>Gym Admin</strong>
</div>
