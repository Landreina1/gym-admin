# Sistema de diseño — Panel "El Cuba" (V3)

> Guía de estilo para reproducir **exactamente** el diseño del panel de administración del gimnasio.
> Estética: **clara, cálida y aireada**, con acento rojo, tipografía grande, mucho aire, tarjetas redondeadas suaves y navegación superior de píldoras.
> Todo lo que sigue son valores literales — no aproximes.

---

## 0. Principios

- **Aireado, no denso.** Padding generoso, gaps amplios, jerarquía por tamaño de fuente.
- **Todo redondeado.** Tarjetas `22px`, controles/píldoras `99px` (totalmente redondeadas), avatares círculo.
- **Fondo crema, no blanco.** El lienzo es `#faf9f7`; las tarjetas son blancas `#ffffff` y "flotan" sobre el crema.
- **Rojo con moderación.** El rojo `#E53935` es solo para acción primaria, acento de marca y estado "en mora". Nunca como fondo de página.
- **Sin gradientes decorativos, sin emojis salvo los definidos, sin sombras duras.** Sombras muy sutiles.
- **Una sola tarjeta oscura por pantalla** como pieza destacada (ej: "Ingresos del mes", plan destacado).

---

## 1. Paleta de color

### Base / neutros (cálidos)
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#faf9f7` | Fondo de página (crema). También fondo de inputs en reposo. |
| `--surface` | `#ffffff` | Tarjetas, tablas, modales, header. |
| `--surface-2` | `#fcfbf9` | Cabecera y footer de tabla, filas en hover. |
| `--ink` | `#1a1a1a` | Texto principal, tarjeta oscura, botón secundario. |
| `--ink-soft` | `#6b6258` | Texto secundario / labels. |
| `--muted` | `#a39a8e` | Texto terciario, placeholders, metadatos. |
| `--muted-2` | `#c4bcb0` | Texto muy tenue (© footer). |
| `--border` | `#eae6e0` | Borde estándar de tarjetas e inputs. |
| `--border-2` | `#e2dcd4` | Borde de botones fantasma / punteados. |
| `--divider` | `#f6f3ef` | Líneas divisorias entre filas de tabla. |
| `--divider-2` | `#f0ece6` | Divisor más marcado / fondo de "pill track" / chips neutros. |

### Acento (rojo marca)
| Token | Hex | Uso |
|---|---|---|
| `--primary` | `#E53935` | Acción primaria, marca, estado "en mora". |
| `--primary-hover` | `#C62828` | Hover de botón primario. |
| `--primary-soft-bg` | `#fdeeed` | Fondo suave rojo (badges mora, avatares mora, chips). |
| `--primary-soft-border` | `#f3ddda` | Borde de superficies rojas suaves. |
| `--primary-soft-ink` | `#c2554f` | Texto sobre fondo rojo suave. |
| `--primary-on-dark` | `#ff8a87` | Rojo claro para texto/acento sobre tarjeta oscura. |

### Semánticos
| Token | Hex | Uso |
|---|---|---|
| `--success` | `#16a34a` | Estado "al día" / éxito. |
| `--success-bg` | `#e9f6ee` | Fondo badge verde. |
| `--success-border` | `#d8eede` | Borde superficie verde. |
| `--success-on-dark` | `#4ade80` | Punto verde sobre oscuro (toast, "sistema operativo"). |

### Sobre superficie oscura (`#1a1a1a`)
- Texto principal: `#ffffff`
- Texto secundario: `rgba(255,255,255,0.55)`
- Texto terciario: `rgba(255,255,255,0.45)`
- Relleno/muted UI: `rgba(255,255,255,0.14)` (barras chart inactivas, chips de vidrio)
- Borde sutil: `rgba(255,255,255,0.22)` / divisor `rgba(255,255,255,0.08)`

---

## 2. Tipografía

- **Familia única:** `Inter` (Google Fonts), fallback `system-ui, sans-serif`.
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  ```
- Pesos usados: **400, 500, 600, 700, 800, 900** (los títulos grandes son 800).

### Escala (valores literales usados)
| Rol | size / weight / tracking | Notas |
|---|---|---|
| Título de página (H1) | `40px` / `800` / `-0.035em` / `line-height 1.05` | "Alumnos", "Pagos"… |
| Subtítulo bajo H1 | `13.5px` / `500` / color `--muted` | eyebrow encima o debajo |
| Número hero (tarjeta oscura) | `52px` / `800` / `-0.04em` | ingresos del mes |
| Precio de plan | `46px` / `800` / `-0.04em` | |
| Número de stat | `38px` / `800` / `-0.03em` | tarjetas de KPI |
| Título de sección / card | `16–20px` / `700–800` / `-0.02em` | |
| Título de fila / nombre | `14px` / `700` | |
| Body | `13.5–14px` / `500–600` | |
| Label de formulario | `12.5px` / `600` / color `--ink-soft`, con `padding-left: 18px` | |
| Encabezado de columna de tabla | `11px` / `700` / `letter-spacing 0.08em` / color `--muted` / MAYÚSCULAS | |
| Badge / pill | `12px` / `600` | |
| Micro / meta | `10–12px` / `500–600` | |

**En móvil (≤880px)** el H1 baja a `30px` (y a `25px` ≤560px en el Resumen).

---

## 3. Tokens de forma

| Token | Valor |
|---|---|
| Radio tarjeta / tabla / modal | `22px` |
| Radio bloque interno (sub-card, textarea grande) | `16–18px` |
| Radio píldora (botón, input, badge, chip, select) | `99px` |
| Radio ícono-cuadrado (mini) | `11–12px` |
| Avatar / botón circular | `50%` |
| Borde estándar | `1px solid #eae6e0` |
| Borde punteado (crear) | `2px dashed #e2dcd4` |

### Sombras
- Tarjeta en reposo: `0 2px 10px rgba(26,26,26,0.03)` (muy sutil).
- Botón primario: `0 6px 18px rgba(229,57,53,0.25)`.
- Modal: `0 24px 60px rgba(26,26,26,0.25)`.
- Toast: `0 12px 32px rgba(26,26,26,0.3)`.

### Transiciones
- Estándar: `0.15s` (`background`, `border-color`, `color`, `transform`, `box-shadow`).
- Hover de fila de tabla: `0.12s`.
- Barras / progreso: `0.4s`.

---

## 4. Layout

- **Contenedor central:** `max-width: 1240px; margin: 0 auto; width: 100%`.
- **Padding de página (`<main>`):** `44px 40px 64px` (desktop) → `28px 16px 48px` (≤880px).
- **Gap vertical entre secciones:** `24–28px`.
- **Header (nav superior):** alto `68px`, `padding: 0 40px`, `border-bottom: 1px solid #eae6e0`, `position: sticky; top: 0; z-index: 10`, fondo `--bg` (crema, no blanco).

### Breakpoints (media queries)
- **≤880px** (tablet/móvil): grids multi-columna → 1 columna; padding de página se reduce; nav se vuelve scroll horizontal; tablas hacen scroll horizontal; H1 → `30px`.
- **≤560px** (móvil chico): stat-grids y grids de 3 → 1 columna; H1 → `25px`.
- **≤820px** (login split): los dos paneles se **apilan**; el panel imagen pasa a banner `min-height: 240px`.

> Implementación responsive usada: los estilos son inline, así que el responsive va en un bloque `@media` con overrides `!important` sobre atributos `data-r="..."` (`head`, `nav`, `page`, `title`, `statgrid`, `grid2`, `grid3`, `tbl`, `split`, `splitimg`, `splitform`). En un proyecto React con clases/Tailwind, esto es simplemente `md:grid-cols-1`, `overflow-x-auto`, etc.

---

## 5. Componentes

### 5.1 Navegación superior
- Izquierda: **logo** = punto rojo `9px` círculo + "El Cuba" (`15px/800`, `-0.02em`), con `gap: 40px` hasta la nav.
- **Nav de píldoras:** links `padding: 8px 16px; border-radius: 99px; font-size: 13.5px`.
  - Activo: `background: #1a1a1a; color: #fff; font-weight: 600`.
  - Inactivo: `color: #6b6258; font-weight: 500`; hover `background: #f0ece6; color: #1a1a1a`.
- Derecha: **campana** (botón circular `38px`, blanca, borde `--border`, con punto rojo `7px` de notificación) + **avatar** `38px` círculo rojo con iniciales (`AP`, `12px/800`, texto blanco).
- Móvil: la nav se vuelve `overflow-x: auto` (scroll horizontal, scrollbar oculta).

### 5.2 Encabezado de página
```
[ eyebrow 13.5px muted ]
[ H1 40px/800 ]                         [ acción(es) a la derecha ]
```
Contenedor `display:flex; justify-content:space-between; align-items:flex-end; gap:24px; flex-wrap:wrap`.

### 5.3 Botones
| Variante | Estilo |
|---|---|
| **Primario** | `height: 46px` (o `52px` en formularios); `padding: 0 22px`; `background: #E53935`; `color: #fff`; `border: none`; `border-radius: 99px`; `font: 13.5–14.5px/700`; sombra `0 6px 18px rgba(229,57,53,0.25)`. Hover: `background:#C62828; transform: translateY(-1px)`. |
| **Secundario (fantasma)** | `background:#fff`; `border:1px solid #e2dcd4`; `color:#1a1a1a`; `border-radius:99px`. Hover: `border-color:#1a1a1a`. |
| **Oscuro** | `background:#1a1a1a; color:#fff`. Hover: `background:#E53935`. (Ej: "Cobrar ahora"). |
| **Deshabilitado (primario)** | `background:#e8b5b3`; sin sombra; `cursor:default`. Se usa hasta que el form es válido. |
| **Ícono circular** | `width/height: 32–38px; border-radius:50%`. Menú "⋮" o acciones; hover `background:#f0ece6`. |

### 5.4 Inputs / formularios
- **Campo de texto/select (píldora):** `height: 50px` (48px en toolbars); `padding: 0 20px`; `background:#faf9f7`; `border:1px solid #eae6e0`; `border-radius:99px`; `font-size:14px`; `outline:none`.
  - **Focus:** `border-color:#E53935; background:#fff; box-shadow: 0 0 0 3px rgba(229,57,53,0.08)`.
- **Label:** `12.5px/600; color:#6b6258; padding-left:18px` (alineado al radio de la píldora). Obligatorio: sufijo `<span style="color:#E53935">*</span>`.
- **Textarea:** igual pero `border-radius:16–18px`, `padding:14px 20px`, `resize:vertical`.
- **Checkbox:** `accent-color:#E53935`, `15px`.
- **Buscador:** input píldora con ícono lupa (SVG, stroke `#a39a8e`) absoluto a `left:18px`.

### 5.5 Tarjetas
- **Tarjeta estándar:** `background:#fff; border:1px solid #eae6e0; border-radius:22px; padding:24–30px; box-shadow:0 2px 10px rgba(26,26,26,0.03)`.
- **Tarjeta oscura (destacada):** `background:#1a1a1a; color:#fff; border-radius:22px; padding:26–30px`. Una por pantalla.
- **Tarjeta roja suave (alerta/mora):** `background:#fdeeed; border:1px solid #f3ddda`.
- **Tarjeta verde suave (positiva):** `border:1px solid #d8eede`.
- **Card "crear" punteada:** `border:2px dashed #e2dcd4; border-radius:22px`; centro con círculo `52px` `#f0ece6` y símbolo `＋`. Hover: `border-color:#E53935; background:#fdfbfa`.

### 5.6 Badges / pills de estado
Formato: `display:inline-flex; align-items:center; gap:7px; padding:5px 12px; border-radius:99px; font-size:12px/600` + punto `6px` del color.
| Estado | bg | texto/punto |
|---|---|---|
| Activo / Al día | `#e9f6ee` | `#16a34a` |
| En mora | `#fdeeed` | `#E53935` |
| Neutro (método, plan) | `#f0ece6` | `#6b6258` |

### 5.7 Chips de vidrio (sobre imagen)
`padding:8px 16px; border-radius:99px; background:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.22); backdrop-filter:blur(8px); color:#fff; font-size:13px/600`.

### 5.8 Tablas
- Contenedor: tarjeta `border-radius:22px; overflow:hidden`.
- **Fila = CSS grid** con `grid-template-columns` de fracciones (no `<table>`). Ej Alumnos: `2fr 1.6fr 0.9fr 0.9fr 0.9fr 1fr 1fr 1.1fr 48px`. `gap:12px; align-items:center; padding:15–16px 26px`.
- Header de tabla: fondo `#fcfbf9`, labels `11px/700` MAYÚSCULAS `letter-spacing:0.08em` color `--muted`, `border-bottom:1px solid #f0ece6`.
- Filas: `border-bottom:1px solid #f6f3ef`; hover `background:#fcfbf9`.
- Primera celda: avatar `34px` círculo con iniciales + nombre `14px/700`. Avatar neutro `#f0ece6/#6b6258`; en mora `#fdeeed/#E53935`.
- Números: `font-variant-numeric: tabular-nums`.
- Footer: fondo `#fcfbf9`, conteo a la izquierda + paginación (botones píldora `36px`).
- **Móvil:** el contenedor pasa a `overflow-x:auto` y las filas conservan `min-width` (~680–780px) → scroll horizontal.

### 5.9 Modales
- Overlay: `position:fixed; inset:0; background:rgba(26,26,26,0.45); display:flex; align-items:center; justify-content:center; padding:24px`. Click en overlay cierra; click en el panel hace `stopPropagation`.
- Panel: `background:#fff; border-radius:22px; box-shadow:0 24px 60px rgba(26,26,26,0.25); padding:32px; max-width:440–560px; gap:20px`. Si es alto: `max-height:calc(100vh - 48px); overflow-y:auto`.
- Cabecera: título `20px/800` + subtítulo `13.5px muted`; botón cerrar `✕` circular `34px` `#f0ece6`.
- Footer de acciones: `Cancelar` (fantasma) + acción primaria, con `flex: 1` y `1.4` respectivamente.

### 5.10 Toast
`position:fixed; bottom:28px; right:28px; background:#1a1a1a; color:#fff; border-radius:99px; padding:14px 22px; font-size:13.5px/600` + punto `#4ade80`. Auto-oculta a los ~3.5s.

### 5.11 Mini-gráfico de barras (tarjeta oscura)
Barras `flex:1; border-radius:6px`. Mes actual: `#E53935` con label rojo `#ff8a87`; meses previos: `rgba(255,255,255,0.14)` con label `rgba(255,255,255,0.4)`. Valor arriba (`$20.3k`) y mes abajo (`Jun`), `10px/600`.

### 5.12 Selector de opción tipo tarjeta (radio visual)
Usado para elegir plan en el alta. Botón `padding:16px 18px; border-radius:18px; border:1.5px solid`. Seleccionado: `background:#fdeeed; border-color:#E53935; texto #E53935`. No seleccionado: `background:#faf9f7; border-color:#eae6e0`.

---

## 6. Iconografía
- **SVG stroke**, `stroke-width:1.8–2`, `stroke-linecap/linejoin:round`, `currentColor`. Estilo Lucide/Feather.
- Tamaños: `11–16px` en línea, `14–15px` en botones.
- **Sin librería de íconos pesada**; SVG inline.
- Emojis solo donde el dominio lo pide (tipos de comida en Dietas: 🍳 Desayuno, 🍗 Almuerzo, 🍎 Merienda, 🥗 Cena, ⚡ Pre-entreno, 🥤 Post-entreno). En ningún otro lado.

---

## 7. Pantallas (inventario)

| Pantalla | Contenido clave |
|---|---|
| **Login** (centrado) | Header mínimo, saludo con fecha, card blanca con inputs pill, "Ver/Ocultar" contraseña, estados carga/error/éxito, botón rojo. |
| **Login split** | Panel imagen izq. (foto con overlay `linear-gradient(180deg, rgba(12,12,12,.42) → rgba(12,12,12,.78))`, marca arriba, headline `42px` blanco + chips de vidrio abajo) + panel formulario der. Apila en ≤820px. |
| **Resumen** | Saludo + acciones; banda de alerta de mora; grid de stats con tarjeta oscura de ingresos (span 2 filas) + KPIs; barra de "estado de alumnos"; accesos rápidos. Modales de alumno y pago. |
| **Alumnos** | Toolbar (buscador + filtros pago/plan); tabla; modal "Nuevo alumno" (avatar en vivo por iniciales, selector de plan tipo tarjeta, toggle "primer pago hoy"). |
| **Pagos** | 3 tarjetas resumen (ingresos oscura, al día verde, mora rojo); tabs segmentadas (Pagos recibidos / En mora); tablas; modal registrar pago; flujo cobrar. |
| **Planes** | Grid `repeat(auto-fill, minmax(330px,1fr))` de tarjetas de plan (una oscura destacada), precio grande, features con check, card punteada de crear; modal crear con chips en vivo. |
| **Dietas** | Grid de tarjetas de dieta con bloques de comida (emoji+tipo, hora pill, kcal verde, alimentos con viñetas, nota itálica); modal constructor comida-por-comida (agregar/quitar, suma de kcal en vivo). |

### Patrones de interacción a respetar
- Botón primario de formulario **deshabilitado** (rosa `#e8b5b3`, sin sombra) hasta que el form es válido.
- **Previews en vivo**: avatar por iniciales al tipear el nombre; suma de kcal; chips de features.
- Feedback siempre por **toast oscuro** tras crear/cobrar.
- Cambios reflejados en los KPIs (crear alumno sube total; cobrar baja mora / sube al día).

---

## 8. Segmented control (tabs)
Contenedor `background:#f0ece6; border-radius:99px; padding:4px`. Botón activo: `background:#fff; color:#1a1a1a; box-shadow:0 1px 4px rgba(26,26,26,0.08)`. Inactivo: `transparent; color:#6b6258`. Alto `38px`, `padding:0 18px`, `13px/600`.

---

## 9. Reglas rápidas (cheatsheet para implementar)
- Fondo página `#faf9f7`; tarjetas `#fff`; nunca invertir.
- Radios: `22px` cards, `99px` todo lo interactivo, `50%` avatares.
- Solo **una** superficie `#1a1a1a` destacada por vista.
- Acción primaria = rojo `#E53935`, hover `#C62828`, sombra roja suave.
- Texto: `#1a1a1a` › `#6b6258` › `#a39a8e` (jerarquía de 3 niveles).
- Fuente Inter, títulos `800`, mucho tamaño y `letter-spacing` negativo en headings.
- Sombras casi imperceptibles (`0 2px 10px rgba(26,26,26,0.03)`).
- Espaciado con `gap` en flex/grid, nunca márgenes sueltos.
- Tablas = CSS grid con fracciones + `tabular-nums`, no `<table>`.
- Estados: verde `#16a34a` al día, rojo `#E53935` mora, punto de color siempre acompaña al texto del badge.
- Responsive: 1 columna en móvil, tablas con scroll horizontal, nav con scroll horizontal, login split apilado.
