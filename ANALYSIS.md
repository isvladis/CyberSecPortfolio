# ANALYSIS.md — Contexto de Proyecto para Desarrollo Consistente

> **Propósito de este documento**: es un "system context" pensado para pasarle a otra
> conversación con Claude (sin acceso al repositorio) para que pueda seguir desarrollando
> este portfolio de forma coherente con el stack, la arquitectura y la temática visual ya
> existentes. Prioriza patrones y decisiones de diseño sobre un volcado literal del código.
>
> Este archivo es adicional a `README.md` y `AGENTS.md` (no los reemplaza).

## 0. Resumen ejecutivo

`DYSLABS_SEC` es un portfolio personal de ciberseguridad construido como una **single-page
app** con Next.js App Router. La estética es un **hacker/terminal cyberpunk estilo Matrix**:
fondo negro, texto verde neón (`#00FF41`), tipografía monoespaciada, lluvia de caracteres en
canvas, terminales interactivas simuladas y una "mini-experiencia" de ataque ransomware que el
usuario puede disparar manualmente. Todo el contenido vive hoy en un único componente grande
(`CyberPortfolio.tsx`) que compone piezas más pequeñas.

**Objetivo del propietario (declarado, no aún completamente implementado en código):**
1. Presentar el CV de forma eficiente e interactiva — **actualmente NO existe una sección de
   CV/experiencia/educación/skills en el código**; solo hay un "Stack Log" decorativo con 3
   líneas fijas (Python, Docker, Nginx) y un comando `whoami`/`status` en la terminal. Ver
   sección 6 (Pendientes).
2. Presentar proyectos personales que se irán agregando con el tiempo — **sí existe** un
   modelo de datos simple y reutilizable (`PROJECTS` en `lib/constants.ts`) renderizado por
   `ProjectCard`.
3. Todo nuevo desarrollo debe respetar la temática visual (Matrix/terminal/neón) y la
   arquitectura ya existente (App Router, componentes funcionales, Tailwind v4 con theme
   tokens, hooks personalizados para lógica compartida).

---

## 1. Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | `^16.2.5` (instalada `16.2.9`) |
| Librería UI | React / React DOM | `19.2.4` |
| Lenguaje | TypeScript (`strict: true`) | `^5` |
| Estilos | Tailwind CSS v4 (config CSS-first, sin `tailwind.config.js`) | `^4.2.4` vía `@tailwindcss/postcss` |
| Animaciones | Framer Motion | `^12.38.0` |
| Iconos | lucide-react | `^1.14.0` |
| Linter | ESLint 9 (flat config) + `eslint-config-next` | `^9` |
| Gestor de paquetes | npm (hay `package-lock.json`) | — |
| Formateador | **No hay Prettier configurado** | — |
| Testing | **No hay ningún framework de testing configurado** | — |

**Nota importante sobre Next.js**: `AGENTS.md` advierte explícitamente que esta versión de
Next.js incluida en el proyecto **tiene cambios respecto a lo que un modelo pueda saber por
entrenamiento** ("This is NOT the Next.js you know") y pide revisar
`node_modules/next/dist/docs/` antes de escribir código nuevo. Evidencia concreta de esto en
el propio código: [`app/error.tsx`](app/error.tsx) usa una prop `unstable_retry` (en vez del
`reset` clásico de Next.js) para reintentar el render tras un error de boundary. **Cualquier
IA que continúe este proyecto debería verificar convenciones de la versión real instalada
antes de asumir APIs de versiones anteriores de Next.js.**

### Desarrollo local

```bash
npm run dev     # levanta en localhost (puerto configurado vía .claude/launch.json en 3001 para el harness de Claude Code; por defecto Next usa 3000)
npm run lint    # ESLint
npm run build   # build de producción
npm run start   # sirve el build de producción
```

Variables de entorno (`.env.example`):
```
NEXT_PUBLIC_SITE_URL=https://dyslabs-sec.local
```
Se usa en [`lib/site.ts`](lib/site.ts) para metadata SEO (Open Graph, sitemap, robots).

### Despliegue

No hay configuración explícita de hosting en el repo (no hay `vercel.json`, `netlify.toml`,
`Dockerfile` ni workflows de CI/CD en `.github/`). Al ser una app Next.js estándar sin
configuración especial, es compatible con despliegue "zero-config" en Vercel, pero esto no
está confirmado/documentado en el repo — **si se agrega un pipeline de despliegue, documentarlo
aquí**.

### Seguridad de la app (ya configurado, respetar al extender)

[`next.config.ts`](next.config.ts) define cabeceras de seguridad estrictas para todas las
rutas: CSP (`default-src 'self'`, con `unsafe-inline`/`unsafe-eval` solo en `script-src` por
Tailwind/Next runtime), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Permissions-Policy` (cámara/micrófono/geolocalización deshabilitados), y
`poweredByHeader: false`. **Cualquier recurso externo nuevo (fuentes, scripts, imágenes,
iframes) debe respetar o actualizar esta CSP.**

---

## 2. Arquitectura

### Estructura de carpetas

```
app/                      # App Router de Next.js
  layout.tsx               # Root layout: <html>/<body>, metadata SEO global (Metadata API)
  page.tsx                 # Única página real: renderiza <CyberPortfolio />
  error.tsx                # Error boundary global (usa unstable_retry, ver nota Next.js)
  loading.tsx               # Loading UI global (fallback de Suspense de App Router)
  robots.ts / sitemap.ts   # SEO generado dinámicamente vía Metadata API de Next
  globals.css              # Import de Tailwind v4 + design tokens (@theme) + estilos globales
  api/cyber-news/route.ts  # Único API route: agregador de RSS de ciberseguridad

components/                # Todos los componentes de UI, planos (sin subcarpetas por feature)
  CyberPortfolio.tsx        # Componente "orquestador" — compone toda la página
  MatrixRain.tsx             # Canvas de fondo con lluvia de caracteres estilo Matrix
  TerminalConsole.tsx        # Terminal interactiva del hero (comandos: help, whoami, status...)
  DecryptionTerminal.tsx     # Mini-juego de "descifrado" dentro del RansomwareScreen
  EncryptionOverlay.tsx      # Overlay de "cifrando datos..." (fase intermedia del ataque simulado)
  RansomwareScreen.tsx       # Pantalla de "sistema comprometido" (fase final del ataque simulado)
  NetworkTraffic.tsx         # Gráfico de barras simulado de tráfico de red
  ProjectCard.tsx            # Tarjeta de proyecto reutilizable
  CyberNewsFeed.tsx          # Feed de noticias con scroll infinito + modal lector

hooks/                     # Lógica reutilizable extraída como custom hooks
  useAttackMachine.ts        # State machine simple: idle -> encrypting -> infected -> idle
  useCyberSound.ts           # Manejo de audio (alarma + beeps) con desbloqueo de autoplay
  useDialogFocusTrap.ts      # Focus trap accesible para modales/dialogs (Tab/Escape)
  useLockBodyScroll.ts       # Bloquea scroll del body mientras un modal está abierto
  useTerminalSession.ts      # Estado compartido de las terminales (historial, input, placeholder animado)

lib/                       # Datos, constantes y utilidades sin estado de React
  constants.ts               # TODA la "configuración de contenido": proyectos, fuentes RSS, timings de animación
  rss.ts                     # Lógica de fetch/parseo/normalización de feeds RSS (server-side)
  site.ts                    # Metadata del sitio (nombre, descripción, URL)

public/sounds/              # alarm.mp3, beep.mp3 — efectos de sonido del "ataque" simulado
```

### Patrón de componentes

**No es atomic design ni organización por features/rutas.** Es una carpeta plana de
componentes de "página completa" o "sección", cada uno bastante autocontenido (incluye su
propio estado, estilos y lógica de interacción vía hooks). No hay capa de componentes
"átomo" genéricos (Button, Card, Modal reutilizables entre features) — cada pieza de UI
(`ProjectCard`, `RansomwareScreen`, etc.) se construye ad-hoc con clases Tailwind inline.

Si se agregan más piezas de UI reutilizables (ej. un badge, un botón consistente), **conviene
extraerlas a algo como `components/ui/` en vez de seguir duplicando clases**, pero eso sería
una decisión nueva, no un patrón ya establecido — evaluarlo con el usuario antes de introducir
esa carpeta.

Todos los componentes interactivos llevan la directiva `"use client"` al tope del archivo
(son Client Components; el proyecto no usa Server Components para datos, salvo el propio
`app/api/cyber-news/route.ts`, que corre en el servidor).

### Rutas / navegación

Es efectivamente una **landing de una sola página** (`app/page.tsx` renderiza únicamente
`<CyberPortfolio />`). No hay rutas adicionales, no hay `app/[slug]`, no hay navegación entre
páginas. La "navegación" dentro de la página es scroll vertical entre secciones separadas
visualmente por un componente `SectionTitle` (definido inline en `CyberPortfolio.tsx`).

Si se agrega contenido más extenso (p. ej. detalle de un proyecto, o una sección de CV
grande), **hay que decidir**: ¿sigue siendo todo en una sola página con anclas, o se introducen
rutas nuevas (`app/proyectos/[slug]/page.tsx`, `app/cv/page.tsx`)? Ambas son válidas dentro de
App Router; no hay convención previa que lo determine, así que es una decisión de diseño a
tomar explícitamente.

### Manejo de estado

No hay librería de estado global (sin Redux/Zustand/Context API para estado compartido). El
estado se maneja 100% con hooks locales de React, extraídos a **custom hooks reutilizables**
cuando la lógica se repite entre componentes:

- **State machine explícita**: `useAttackMachine` modela las fases del "ataque simulado"
  (`idle` → `encrypting` → `infected` → vuelta a `idle`) con transiciones controladas
  (`begin`, `complete`, `resolve`). Es el patrón más "arquitectónico" del proyecto — si se
  agregan flujos multi-paso nuevos, replicar este patrón de máquina de estados con un hook
  dedicado.
- **Modo alerta global**: derivado de `isAlertMode = phase !== "idle"`, se propaga hacia abajo
  como prop y también vía el atributo `data-mode="alert"` en el `<main>`, que activa un set de
  CSS custom properties distintas (ver sección 3, temática de "modo alerta" en rojo).
- Estado de UI puramente local (inputs de terminal, modales abiertos, datos de red simulados)
  vive en cada componente con `useState`/`useEffect`.

### Organización de datos (CV / Proyectos)

- **Proyectos**: hardcodeados como array tipado en [`lib/constants.ts`](lib/constants.ts):

  ```ts
  export type Project = {
    title: string;
    desc: string;
    tech: string[];
    repoUrl?: string;
    demoUrl?: string;
  };

  export const PROJECTS: Project[] = [ /* ... */ ];
  ```

  `CyberPortfolio.tsx` mapea este array a `<ProjectCard />`. **Para agregar un proyecto nuevo
  hoy, solo hace falta añadir un objeto a `PROJECTS`** — no hay CMS, no hay JSON externo, no
  hay MDX. `repoUrl`/`demoUrl` son opcionales; si faltan, `ProjectCard` muestra un badge
  "PRIVATE_LAB" con ícono de candado en vez de un link.

- **CV (experiencia, educación, skills)**: **no existe un modelo de datos todavía.** Lo más
  cercano es contenido decorativo hardcodeado directamente en JSX:
  - El bloque "Stack Log" en `CyberPortfolio.tsx` (líneas fijas: `Python`, `Docker`, `Nginx`).
  - El comando `whoami` de `TerminalConsole.tsx` (`COMMANDS.whoami`), texto fijo tipo
    `"USUARIO: Operador_Vladi | ROL: SysAdmin & Fullstack Dev | STATUS: Hardened"`.

  **Si se implementa la sección de CV, se recomienda seguir el mismo patrón que `PROJECTS`**:
  un tipo TypeScript + array/objeto exportado desde `lib/constants.ts` (o un archivo nuevo
  `lib/cv.ts` si crece mucho), consumido por un componente de presentación dedicado — así se
  mantiene la convención de "contenido como datos tipados en `lib/`, sin fetching ni CMS".

- **Noticias**: es el único contenido que **sí** viene de una fuente externa dinámica (RSS),
  vía `app/api/cyber-news/route.ts` + `lib/rss.ts`. No aplica como referencia de modelado de
  CV/Proyectos porque su patrón es fetch + revalidate, no contenido estático.

### Convenciones de nombres

- Componentes: `PascalCase.tsx`, un componente principal exportado como **named export** (no
  `export default`) desde cada archivo, ej. `export const ProjectCard = (...) => {...}`.
  Excepción: los archivos especiales de Next.js (`page.tsx`, `layout.tsx`, `error.tsx`,
  `loading.tsx`) sí usan `export default` porque el framework lo exige.
- Hooks: `camelCase.ts` con prefijo `use`, en `hooks/`, también named export.
- Constantes/tipos compartidos: `lib/constants.ts` en `SCREAMING_SNAKE_CASE` para constantes
  (`SITE_MAX_WIDTH_CLASS`, `NEWS_PAGE_SIZE`, `TERMINAL_SCAN_TICKS`, etc.) y `PascalCase` para
  tipos (`Project`, `NewsItem`).
- Imports: se usa el alias `@/*` (configurado en `tsconfig.json`) para todo import interno,
  nunca rutas relativas largas (`@/lib/constants`, `@/hooks/useAttackMachine`).

---

## 3. Diseño y temática visual

### Descripción del estilo

**Cyberpunk "hacker terminal" / Matrix**, con toques de **glassmorphism** (fondos
`bg-black/60`–`bg-black/95` con `backdrop-blur`) y **neon glow** (sombras `shadow-[0_0_Npx_var(--color-accent)]`
en casi todos los elementos interactivos). No es minimalista ni brutalista: hay mucho detalle
decorativo intencional (scanlines, glitch de cursor, animaciones de "escaneo", esquinas tipo
HUD en los overlays). La referencia visual es una mezcla de "terminal de Matrix" + "pantalla de
ransomware" + "dashboard de SOC/NOC".

### Paleta de colores (tokens reales, definidos en `app/globals.css` vía `@theme` de Tailwind v4)

```css
@theme {
  --color-matrix-green: #00ff41;   /* verde Matrix "clásico" */
  --color-matrix-bright: #b6ffd0;  /* verde claro, casi menta */
  --color-matrix-dim: #063d17;     /* verde oscuro apagado */
  --color-matrix-dark: #000000;    /* negro base */

  --color-accent: #00ff41;         /* color de acento ACTIVO (dinámico) */
  --color-accent-strong: #00ff41;  /* variante "fuerte" del acento */
  --color-page-bg: rgb(0 0 0 / 0.8);

  --shadow-card-hero: 0 0 25px rgb(0 255 65 / 0.08);
  --shadow-card-soft: 0 0 15px rgb(0 255 65 / 0.12);
  --shadow-card-strong: 0 0 30px rgb(0 255 65 / 0.22);
  --shadow-bar: 0 0 8px var(--color-accent);
}
```

**Sistema de "modo alerta" (theming dinámico vía atributo HTML)**: cuando `phase !== "idle"`,
`CyberPortfolio` setea `data-mode="alert"` en el `<main>`, lo que activa un override completo
de la paleta a tonos rojos:

```css
[data-mode="alert"] {
  --color-accent: #ef4444;
  --color-accent-strong: #dc2626;
  --color-page-bg: rgb(127 29 29 / 0.1);
  /* + sombras en rojo */
}
```

Gracias a que **todo el código usa las clases utilitarias `bg-accent`, `text-accent`,
`border-accent`, `shadow-card-*` (mapeadas a estos custom properties) en vez de colores fijos
tipo `green-500`**, el cambio de modo recolorea toda la interfaz automáticamente sin lógica
condicional por componente. **Esta es la convención de color más importante a respetar**: no
hardcodear verdes (`text-green-400`, etc.) en componentes nuevos — usar siempre los tokens
`accent`/`accent-strong` para que participen del theming dinámico. Excepciones ya presentes en
el código (colores que no cambian con el modo): amarillo para advertencias/pendientes
(`yellow-500`), blanco para texto de alto contraste, rojo (`red-*`) para elementos que ya son
semánticamente de peligro incluso en modo normal.

No hay archivo `tailwind.config.js` — Tailwind v4 usa configuración **CSS-first**: los tokens
arriba se definen directamente en `globals.css` con `@theme`, y las rutas de escaneo de clases
se declaran con `@source "../app"`, `@source "../components"`, `@source "../hooks"`.

### Tipografía

Una única familia, monoespaciada, en todo el sitio: `font-family: "Courier New", Courier,
monospace;` aplicada globalmente en `body` (`globals.css`). No hay una segunda tipografía
"de UI" ni fuente variable de Next (`next/font`) — todo el texto, incluidos títulos grandes,
usa la monoespaciada para reforzar la estética de terminal. Jerarquía tipográfica lograda con
`font-black`/`font-bold`, `uppercase`, y `tracking-[0.18em]`–`tracking-[0.24em]` (letter-spacing
amplio, muy usado para labels tipo "SYSTEM STATUS: ACTIVE").

### Espaciado / grid

Sin sistema de espaciado propio: se usa la escala por defecto de Tailwind (`p-4`, `gap-4`,
`gap-7`, `gap-12`, etc.) de forma directa en JSX. El layout principal del hero es un **grid de
bento/dashboard**: `grid-cols-1 md:grid-cols-4 md:grid-rows-3` con `col-span`/`row-span`
variables por tarjeta (el bloque de presentación ocupa 2×2, la terminal 2×1, y el resto celdas
de 1×1). El ancho máximo del contenido está centralizado en una constante:
`SITE_MAX_WIDTH_CLASS = "max-w-[1400px]"` (`lib/constants.ts`), usada tanto en el contenedor
principal como debería usarse en cualquier sección nueva de ancho completo.

### Componentes de UI reutilizables y sus variantes

No hay una librería de componentes UI genéricos (no hay `Button`, `Card`, `Modal` como
primitivas separadas). Lo reutilizable son componentes de sección completos:

- **`ProjectCard`**: tarjeta con hover 3D-ish (`whileHover={{ y: -8, scale: 1.02 }}` de Framer
  Motion), badge de estado (`"Secure" | "Deploying"`), lista de tags de tech, y dos "links"
  (`SOURCE_CODE` / `LIVE_DEMO`) que se renderizan como candado deshabilitado si no hay URL.
- **Patrón de "terminal"**: dos variantes (`TerminalConsole` para el hero, `DecryptionTerminal`
  para el mini-juego) que comparten el hook `useTerminalSession` (historial de líneas, input
  controlado, placeholder animado tipo "escribir a máquina", auto-scroll). Cualquier terminal
  nueva debería reusar este hook en vez de reimplementar el manejo de historial/placeholder.
- **Patrón de "modal/dialog"**: `EncryptionOverlay`, `RansomwareScreen` y el modal lector de
  `CyberNewsFeed` comparten `useDialogFocusTrap` (trampa de foco accesible, cierre con Escape)
  + `useLockBodyScroll` (bloqueo de scroll de fondo). El modal de noticias además usa
  `createPortal` a `document.body`. **Cualquier modal/overlay nuevo debe seguir este mismo par
  de hooks** para mantener accesibilidad consistente (`role="dialog"`, `aria-modal`,
  `aria-labelledby`, foco inicial gestionado, `inert`/`aria-hidden` en el contenido de fondo
  mientras el modal está abierto — ver cómo `CyberPortfolio` aplica `inert`/`blur` al contenido
  principal cuando `hasBlockingOverlay` es true).
- **Badges/pills**: patrón repetido de `border border-accent px-2 py-0.5 font-mono text-[9-10px] uppercase`
  para etiquetas tipo "SECURE", nombres de fuente de noticias, tags de tecnología.

### Animaciones y transiciones

- **Framer Motion** (`motion.div`/`motion.article`) para: aparición de overlays
  (`initial={{opacity:0}} animate={{opacity:1}}`), hover de `ProjectCard`, entrada del terminal
  de descifrado dentro de `RansomwareScreen`.
- **Canvas manual (sin librería)** para `MatrixRain`: loop de `requestAnimationFrame` con
  throttling a ~42ms/frame, pausado cuando `document.hidden`, y `devicePixelRatio` limitado a
  1.5 para rendimiento. Color del rain se pasa por prop y se sincroniza con el modo
  alerta/normal vía un `ref` (evita reiniciar el efecto en cada cambio de color).
- **CSS/Tailwind utilities** para el resto: `animate-pulse`, `animate-ping`, `animate-spin`,
  `animate-bounce` de Tailwind se usan generosamente para dar sensación de "sistema vivo"
  (LEDs parpadeando, iconos girando en modo alerta, etc.), más `transition-colors
  duration-500/700` para las transiciones entre modo normal/alerta.
- **Accesibilidad de movimiento**: hay un bloque global en `globals.css` que respeta
  `prefers-reduced-motion: reduce` (fuerza duraciones casi nulas), y `NetworkTraffic` también
  chequea `window.matchMedia("(prefers-reduced-motion: reduce)")` explícitamente para reducir
  la frecuencia de actualización de sus datos simulados. **Mantener este patrón en features
  nuevas con animación continua.**

### Responsive / breakpoints

Solo se usa el breakpoint `md:` de Tailwind (mobile-first, sin uso notable de `sm:`/`lg:`/`xl:`
salvo puntualmente en tamaños de texto/iconos de `RansomwareScreen`). El grid del hero colapsa
de 4 columnas a 1 columna por debajo de `md`. No hay un sistema de breakpoints custom definido
(se usa la escala default de Tailwind v4: `sm=40rem, md=48rem, lg=64rem, xl=80rem`).

---

## 4. Contenido actual

### Secciones existentes (todas dentro de `CyberPortfolio.tsx`, una sola página)

1. **Hero / Dashboard bento** (grid de 6 tarjetas):
   - Tarjeta de presentación (nombre "DYSLABS_SEC", tagline profesional).
   - Terminal interactiva (`TerminalConsole`) con comandos: `help`, `whoami`, `status`,
     `projects`, `toshiba`, `clear`, y un comando "secreto" `override_lock` /
     `sudo override_lock` que **dispara el flujo de ataque simulado**.
   - "Stack Log" decorativo (3 líneas fijas: Python, Docker, Nginx).
   - "Traffic Monitor" (`NetworkTraffic`, gráfico de barras simulado).
   - Badge "Sec Level" (`HARDENED` / `COMPROMISED` según modo).
2. **"Proyectos Auditados"** (título cambia a "Threat Analysis" en modo alerta): grid de
   `ProjectCard` desde `PROJECTS`.
3. **"Noticias CyberSec"** (título cambia a "News" en modo alerta): `CyberNewsFeed`, feed de
   RSS multi-fuente con scroll infinito (`IntersectionObserver`) y modal lector "safe reader"
   (no navega directo a la fuente externa, sino que muestra el contenido dentro del propio
   sitio, con link opcional a "OPEN_ORIGINAL").
4. **Footer** con copyright/frase de flavor text.

### Flujo especial: "Protocolo de alerta" (easter egg / demo interactiva de seguridad)

Botón flotante (esquina inferior derecha, ícono `AlertTriangle`) que el usuario puede pulsar
manualmente (o disparar escribiendo `override_lock` en la terminal) para simular un ataque:

`idle` → click en botón o comando secreto → **`encrypting`** (`EncryptionOverlay`: barra de
progreso "cifrando datos", con sonido de alarma) → **`infected`** (`RansomwareScreen`: pantalla
falsa de ransomware con dirección BTC falsa y CTA para "recuperar" el sistema) → el usuario
resuelve un mini-puzzle de 3 pasos en `DecryptionTerminal` (autocompletar con Tab, comandos
`brute.sh`, `decrypt.bin`, `restore_all`) → vuelve a **`idle`**.

Es puramente decorativo/demostrativo (no hay backend real involucrado), pensado para mostrar
skills de UX narrativo y manejo de estado complejo en la entrevista de portfolio.

### Modelo de "proyecto" (para agregar proyectos nuevos)

```ts
type Project = {
  title: string;      // Nombre del proyecto
  desc: string;        // Descripción corta (1-2 frases)
  tech: string[];       // Stack tecnológico, se renderiza como badges
  repoUrl?: string;     // Opcional — si falta, se muestra "PRIVATE_LAB" con candado
  demoUrl?: string;     // Opcional — mismo comportamiento
};
```
Ejemplos actuales (`lib/constants.ts`): "Toshiba Pi-hole Node", "Ghost VPN Tunnel", "Matrix
Portfolio" — los tres son proyectos de infraestructura/hardening personal, sin `repoUrl`/`demoUrl`
(labs privados). **Para mantener consistencia narrativa, los proyectos nuevos deberían seguir
el mismo tono "operador/hacker" en `title`/`desc`** (ver estilo de redacción en mayúsculas para
statuses, términos técnicos en inglés, texto descriptivo en español).

### Modelo de "CV" (sección a diseñar)

**No existe todavía un modelo de datos ni componente para CV/experiencia/educación/skills.**
Lo único con contenido tipo CV son strings sueltos hardcodeados en JSX/objetos de comandos (ver
sección 2). Si la próxima conversación va a implementar esto, se recomienda:
- Definir un tipo `Experience`/`SkillCategory`/`EducationEntry` en `lib/constants.ts` (o
  `lib/cv.ts`), siguiendo el mismo espíritu tipado y plano que `Project`.
- Reusar el patrón visual de tarjeta con `border-accent/50 bg-black/60 backdrop-blur` +
  badges monoespaciados en mayúsculas, para que encaje con el resto del hero.
- Considerar si se integra como una tarjeta más del grid bento existente, como una sección
  nueva tipo "Proyectos Auditados", o como una vista/ruta separada — **es una decisión de
  producto pendiente, no una convención ya resuelta por el código**.

---

## 5. Patrones de código

- **100% componentes funcionales + hooks**, sin clases. TypeScript en modo `strict`. Sin uso de
  `any` visible en el código explorado; los tipos de dominio (`Project`, `NewsItem`,
  `AttackPhase`, `AttackMachine`) se definen y exportan junto a donde se usan (`lib/constants.ts`,
  `lib/rss.ts`, `hooks/useAttackMachine.ts`).
- **Lógica extraída a hooks siempre que se repite entre 2+ componentes** (focus trap, lock
  scroll, sesión de terminal, sonido). Si una nueva feature necesita comportamiento similar a
  uno ya existente, **reusar el hook, no reimplementar**.
- **Constantes de timing/magia centralizadas** en `lib/constants.ts` (intervalos de animación,
  tamaños de página, factores de cálculo) en vez de números mágicos inline — patrón a seguir
  para cualquier nueva animación o simulación.
- **Fetching de datos**: solo existe un caso, y es representativo del patrón a seguir para
  datos externos:
  - Client Component (`CyberNewsFeed`) hace `fetch("/api/cyber-news")` a un **Route Handler**
    propio (`app/api/cyber-news/route.ts`), nunca llama directo a APIs externas desde el
    cliente.
  - El Route Handler usa **ISR-style caching** (`export const revalidate = 900`, `Cache-Control:
    s-maxage=...stale-while-revalidate=...`).
  - Resiliencia: por cada fuente RSS intenta primero un proxy (`rss2json`) y si falla cae a
    parseo XML directo (regex-based, sin librería de XML) — usa `Promise.allSettled` para que
    el fallo de una fuente no tumbe las demás, deduplica por `guid`/`link`, y expone
    `degraded`/`failedSources` al cliente para mostrar un aviso de "stream degradado" en vez de
    fallar silenciosamente.
  - **Cualquier integración externa nueva (APIs de terceros) debería replicar este patrón**:
    Route Handler propio + revalidate + manejo de fallos parcial y explícito en la UI, nunca
    exponer claves/URLs de terceros directamente al cliente.
- **SEO / meta tags**: Metadata API nativa de Next.js (`export const metadata` en
  `app/layout.tsx`, más `robots.ts`/`sitemap.ts` como route handlers especiales). Datos
  centralizados en `lib/site.ts` (`SITE_NAME`, `SITE_DESCRIPTION`, `SITE_URL` — este último
  lee `NEXT_PUBLIC_SITE_URL`). No hay metadata por sección/proyecto individual (no aplica aún
  porque no hay rutas por proyecto).
- **Testing**: no hay ningún test, framework de testing, ni CI configurado en el repo.
- **Lint/format**: ESLint 9 flat config (`eslint.config.mjs`) extendiendo
  `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. No hay Prettier; el
  formateo visible en el código (orden de clases Tailwind, comillas dobles, sin punto y coma
  final variable) parece mantenerse manualmente/por convención del autor más que por
  herramienta automática — **no asumir un formatter y romper el estilo existente al generar
  código nuevo** (comillas dobles, `const` arrow functions exportadas, punto y coma consistente).
- **Accesibilidad**: tratada como first-class en los componentes interactivos existentes —
  `aria-label`, `aria-hidden`, `role="dialog"`/`aria-modal`/`aria-labelledby`, `inert` en
  contenido de fondo bloqueado, soporte de `Escape`/`Tab` en modales, respeto de
  `prefers-reduced-motion`. **Mantener este nivel de cuidado en componentes nuevos con
  interactividad o overlays.**

---

## 6. Pendientes / limitaciones conocidas

No se encontraron comentarios `TODO`/`FIXME`/`HACK` en el código — la lista siguiente es una
observación derivada de comparar el código actual contra los objetivos declarados del
proyecto, no deuda técnica marcada explícitamente por el autor:

1. **No existe sección de CV** (experiencia laboral, educación, skills estructuradas): es el
   objetivo #1 del proyecto y hoy solo hay placeholders decorativos ("Stack Log" con 3 líneas
   fijas, respuesta fija del comando `whoami`). Es el gap más importante a resolver.
2. **Contenido de proyectos muy limitado** (solo 3, dos de ellos sin `repoUrl`/`demoUrl` —
   "PRIVATE_LAB"): funcional pero con poco para mostrar en una entrevista real; el modelo de
   datos ya soporta crecer sin cambios de arquitectura.
3. **Dependencia de un proxy RSS de terceros gratuito** (`api.rss2json.com`) como primera
   opción para las noticias, con fallback a parseo XML manual por regex (no una librería XML
   robusta) — funciona pero es fragil ante cambios de formato de las fuentes; no es bloqueante
   pero vale la pena tenerlo presente si el feed empieza a fallar.
4. **Sin tests automatizados ni CI**: cualquier regresión (visual o funcional) depende de
   verificación manual en el navegador.
5. **Sin capa de componentes UI genéricos reutilizables** (`Button`, `Badge`, `Card` como
   primitivas): a medida que se agreguen más secciones (como CV), el copy-paste de clases
   Tailwind entre componentes puede volverse difícil de mantener; evaluar extraer primitivas
   compartidas si el proyecto crece.
6. **Todo vive en una sola página**: si el CV o los proyectos crecen mucho, puede valer la pena
   introducir rutas dedicadas (`/proyectos/[slug]`, `/cv`) en vez de seguir todo en
   `app/page.tsx` — no resuelto, es una decisión de producto abierta.
7. **Sin configuración de despliegue documentada** (no hay `vercel.json` ni CI/CD): si ya se
   despliega en algún hosting, documentarlo aquí para que futuras conversaciones sepan el flujo
   de release real.

---

## 7. Cómo usar este documento en una conversación futura

Si estás retomando este proyecto sin acceso al repositorio, trátalo como la fuente de verdad
de:
- **Qué stack y versiones usar** (sección 1) — en particular, no asumas APIs de Next.js
  "clásicas" sin verificar, dado el aviso sobre la versión custom de Next.js.
- **Qué convenciones de carpetas/nombres seguir** (sección 2) al crear archivos nuevos.
- **Qué tokens de color y clases usar** (sección 3) — siempre `accent`/`accent-strong`, nunca
  colores fijos, para que el modo alerta siga funcionando en todo el sitio.
- **Qué patrones de hook/estado reusar** (sección 5) antes de reimplementar algo (modal, focus
  trap, terminal, fetching resiliente).
- **Qué falta** (sección 6), especialmente la sección de CV, como próximo bloque de trabajo
  prioritario según el objetivo declarado del propietario del proyecto.
