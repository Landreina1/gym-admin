Actúa como un Software Architect Senior, Product Engineer y Full Stack Developer experto en productos SaaS escalables.

Quiero que me ayudes a construir el MVP de un sistema para gimnasio, comenzando SOLO con la parte administrativa (backoffice). Este primer paso debe quedar bien estructurado, profesional y escalable, para luego poder agregar una app para clientes, notificaciones avanzadas, métricas y más módulos sin reescribir la base del sistema.

## CONTEXTO DEL NEGOCIO
El sistema es para administrar un gimnasio. En esta primera versión solo trabajaremos con el panel del administrador.

El administrador debe poder gestionar alumnos y visualizar información clave de cada uno.

## OBJETIVO DEL MVP
Construir un MVP funcional del backoffice para gimnasio con enfoque en:
- gestión de alumnos
- control de pagos
- control de peso y progreso
- dashboard administrativo
- estructura escalable para futuras funcionalidades

## FUNCIONALIDADES MVP OBLIGATORIAS

### 1. Dashboard principal
Quiero un dashboard administrativo que muestre:
- cantidad total de alumnos
- alumnos activos
- alumnos con pagos al día
- alumnos con mora
- próximos vencimientos
- resumen rápido de cambios de peso recientes
- acceso rápido para registrar pago o peso

### 2. Módulo de alumnos
Cada alumno debe tener los siguientes datos:
- nombre
- apellido
- fecha de entrada
- día de cobro
- plan
- altura
- peso inicial
- meta del cliente (ejemplo: bajar de peso / subir de peso / mantener)
- meta personal mensual (ejemplo: llegar a 50 kg este mes)
- estado del alumno (activo / inactivo)

También debe existir:
- listado de alumnos
- búsqueda por nombre y apellido
- filtro por estado
- filtro por plan
- detalle individual del alumno

### 3. Registro de peso
Desde el listado o desde el detalle del alumno debe existir un botón para:
- registrar nuevo peso
- guardar fecha del registro
- ver historial de pesos por alumno
- mostrar evolución de peso

### 4. Gestión de pagos
Cada alumno debe tener:
- día de cobro
- estado de pago
- fecha de último pago
- próxima fecha de vencimiento
- mora sí/no

El administrador debe poder:
- registrar pago manualmente
- marcar alumno con mora
- visualizar quiénes vencen pronto
- visualizar quiénes están atrasados

### 5. Notificaciones administrativas (MVP simple)
En esta etapa no necesito envío real por WhatsApp ni push notifications.
Solo quiero una base preparada para eso.

Necesito que el sistema contemple:
- notificaciones por pagos próximos (2 días antes)
- notificaciones por mora
- avisos por feriados o días no laborables
- avisos administrativos creados manualmente

En el MVP, esto puede verse como:
- un módulo de “notificaciones”
- configuración de tipos de aviso
- registros/listado de notificaciones generadas
- estado: pendiente / programada / enviada / cancelada
- aunque por ahora solo sea simulación interna y no envío real

## REQUISITOS IMPORTANTES DE ARQUITECTURA
Quiero que este MVP esté preparado para crecer. Por eso debes diseñarlo con estas condiciones:

- arquitectura limpia y escalable
- módulos desacoplados
- base lista para agregar una app mobile o web para clientes en el futuro
- base lista para agregar autenticación por roles
- base lista para agregar sistema real de notificaciones
- base lista para agregar rutinas, progreso físico y más métricas
- base lista para auditoría o historial de cambios

## REQUISITOS TÉCNICOS
Quiero que propongas y uses una stack moderna, simple y escalable.

### Preferencias:
- Frontend admin moderno y limpio
- Backend robusto
- Base de datos relacional
- ORM
- API bien organizada
- validaciones
- estructura profesional de carpetas
- código mantenible

Si lo consideras adecuado, puedes usar:
- Next.js para frontend
- NestJS o backend modular similar
- PostgreSQL
- Prisma
- Tailwind
- shadcn/ui o componentes modernos
- Docker opcional

Pero antes de generar código, evalúa la mejor estructura para este MVP.

## LO QUE QUIERO QUE HAGAS AHORA
Quiero que me entregues la PRIMERA BASE DEL PROYECTO, no explicaciones genéricas.

### Necesito que generes:
1. propuesta de arquitectura del proyecto
2. estructura de carpetas recomendada
3. definición de entidades principales del MVP
4. relaciones entre entidades
5. flujo funcional principal del administrador
6. roadmap por fases para construir el MVP
7. decisiones técnicas justificadas
8. primer set de código base para iniciar el proyecto
9. esquema inicial de base de datos
10. endpoints o acciones principales del sistema
11. componentes principales del frontend admin
12. sugerencia de diseño UI limpio, moderno y profesional

## ENTIDADES MÍNIMAS DEL MVP
Debes contemplar como mínimo estas entidades:
- AdminUser
- Student
- Plan
- WeightRecord
- Payment
- Notification
- Holiday o NonWorkingDay (si aplica)
- AuditLog (aunque sea básico o preparado para futuro)

## REGLAS DE NEGOCIO IMPORTANTES
Debes respetar estas reglas:
- un alumno puede tener muchos registros de peso
- un alumno puede tener muchos pagos
- el sistema debe calcular si está en mora según la fecha de cobro y último pago
- el sistema debe poder mostrar próximos vencimientos
- la meta del cliente y la meta mensual deben guardarse por alumno
- el historial de peso debe mantenerse, no sobrescribirse
- los módulos deben quedar preparados para agregar app de clientes en una segunda etapa

## FORMA DE RESPONDER
Quiero que respondas en este orden exacto:

### Fase 1: Arquitectura propuesta
- stack recomendada
- por qué
- cómo escalará a futuro

### Fase 2: Modelo funcional MVP
- módulos
- flujos
- reglas de negocio

### Fase 3: Modelo de datos
- entidades
- atributos
- relaciones

### Fase 4: Estructura del proyecto
- carpetas frontend
- carpetas backend
- convenciones

### Fase 5: Primer seteo técnico
- comandos de creación
- instalación inicial
- configuración base
- variables de entorno necesarias

### Fase 6: Código inicial
Genera el código base inicial del proyecto, empezando por:
- estructura backend
- modelo de base de datos
- endpoints iniciales
- frontend admin base
- dashboard base
- tabla de alumnos base

### Fase 7: Próximos pasos
- orden recomendado de implementación
- qué construir primero
- qué dejar preparado para la v2

## RESTRICCIONES
- No me des una respuesta superficial
- No me des solo teoría
- Quiero base real para desarrollo
- No simplifiques demasiado la estructura, porque quiero que quede lista para escalar
- Prioriza claridad, mantenibilidad y crecimiento futuro
- Si detectas algo mejor para el MVP, proponlo y justifícalo
- Si hay algo que conviene simular en esta etapa en lugar de implementarlo completo, hazlo, pero deja la base preparada

Empieza ahora con la solución completa.