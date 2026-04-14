# Guía de contribución — Gym Admin

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: refactorización sin cambio funcional
style:    cambios de estilo/formato
docs:     documentación
chore:    tareas de mantenimiento
```

Ejemplos:
```bash
git commit -m "feat: agregar filtro por plan en listado de alumnos"
git commit -m "fix: corregir cálculo de mora en pagos"
git commit -m "docs: actualizar guía de instalación"
```

## Ramas

- `main` — producción, solo merge via PR
- `develop` — rama de desarrollo principal
- `feature/nombre` — nuevas funcionalidades
- `fix/nombre` — correcciones

## Pull Requests

1. Abrí un issue describiendo el cambio
2. Creá una rama desde `develop`
3. Asegurate que el proyecto compila sin errores
4. Abrí el PR con descripción clara

## Estructura de nuevos módulos

### Frontend (Next.js)
```
src/app/(dashboard)/nuevo-modulo/
├── page.tsx          # Página principal
├── [id]/
│   └── page.tsx      # Vista de detalle
└── _components/      # Componentes locales del módulo
```

### Backend (NestJS)
```
src/modules/nuevo-modulo/
├── nuevo-modulo.module.ts
├── nuevo-modulo.controller.ts
├── nuevo-modulo.service.ts
└── dto/
    └── nuevo-modulo.dto.ts
```
