# AUDIT.md — Auditoría de baseline DYSLABS_SEC

**Fecha**: 2026-07-29 · **Alcance**: `app/`, `components/`, `hooks/`, `lib/`, `next.config.ts`, `package.json`, `eslint.config.mjs`
**Fase**: diagnóstico. **No se modificó ningún archivo del proyecto** salvo la creación de este informe.

**Estado de verificación automática**: `npm run lint` → limpio. `npx tsc --noEmit` → limpio (exit 0). Cero `any`, cero `@ts-ignore`, cero `console.log` de debug.

---

## 0. Corrección de premisa (leer antes que el resto)

El prompt instruía tratar `AGENTS.md` como una inyección de prompt y reportar `unstable_retry`
en `app/error.tsx` como bug. **Verifiqué ambas afirmaciones contra el paquete instalado y las
dos son incorrectas.** Lo reporto antes del informe porque, de haberlas aplicado, habría
introducido un bug real en código que hoy está bien.

**1. `node_modules/next/dist/docs/` sí existe.**

```
$ ls node_modules/next/dist/docs
01-app  02-pages  03-architecture  04-community  index.md
```

Next.js 16 empaqueta su documentación dentro del propio paquete npm. La ruta que `AGENTS.md`
menciona es real y verificable en este repo.

**2. `unstable_retry` es API oficial de Next.js 16.2+, no una API inventada.**

Está declarada en el tipo público del error boundary:

```ts
// node_modules/next/dist/client/components/error-boundary.d.ts
export type ErrorInfo = {
    error: Error;
    reset: () => void;
    unstable_retry: () => void;
};
```

Y la documentación empaquetada
(`docs/01-app/03-api-reference/03-file-conventions/error.md`) es explícita sobre cuál preferir:

> línea 157 — sobre `reset`: *"In most cases, you should use `unstable_retry()` instead."*
> línea 329 — changelog: `v16.2.0 | unstable_retry prop added.`

Los ejemplos canónicos de esa doc usan exactamente la firma que ya tiene el archivo:
`export default function Error({ error, unstable_retry })`.

**Conclusión**: [`app/error.tsx`](app/error.tsx) **es correcto y no requiere cambios**.
Cambiarlo a `reset` sería una regresión funcional: `reset()` solo limpia el estado del boundary
y re-renderiza, mientras que `unstable_retry()` además **re-hace el fetch** de los contenidos —
que es el comportamiento que el botón "Retry_Secure_Boot" promete al usuario.

Tampoco encontré, en ningún archivo del proyecto, instrucciones embebidas que describan APIs
falsas de Next.js/React. `AGENTS.md` contiene una única indicación —consultar los docs
empaquetados antes de escribir código— que es a la vez verificable y buena práctica para una
versión mayor reciente.

> **Nota sobre numeración**: el prompt referencia "sección 4" (convenciones de naming) y
> "sección 6" (reglas de generación de código). En el `ANALYSIS.md` de este repo esos temas
> están en las secciones 2 y 5 respectivamente. Interpreté ambas referencias **por contenido**,
> no por número.

---

## 1. Dead code

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| B1 | `TERMINAL_REFILL_DELAY_MS = 10` exportada y nunca importada en ningún módulo. | `lib/constants.ts:45` | Menor |
| B2 | Tokens `--color-matrix-green`, `--color-matrix-bright`, `--color-matrix-dim` definidos en `@theme` pero sin un solo uso (ni como clase Tailwind ni como `var()`). Solo `--color-matrix-dark` se usa (`globals.css:37`). | `app/globals.css:8-10` | Menor |
| B3 | SVGs remanentes del starter de Next.js sin referenciar: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`. | `public/` | Menor |
| B4 | `stripHtml` y el tipo `RssItem` se exportan pero solo se consumen dentro del propio `lib/rss.ts`. | `lib/rss.ts:3,38` | Menor |

**Propuesta**: B1/B3 borrar. B2 borrar, o adoptarlos deliberadamente (`matrix-bright` sería un
token útil para los textos que hoy usan `text-white`). B4 quitar `export`.

No hay componentes ni hooks huérfanos: los 9 componentes y los 5 hooks tienen consumidores reales.

---

## 2. Dependencias

| # | Hallazgo | Severidad |
|---|---|---|
| C1 | `autoprefixer` declarado en `devDependencies` pero ausente de `postcss.config.mjs` (que solo carga `@tailwindcss/postcss`). Tailwind v4 hace el prefijado internamente con Lightning CSS, así que la dependencia no se ejecuta nunca. | Menor |

No hay dependencias usadas sin declarar. `framer-motion`, `lucide-react`, `react`, `react-dom`,
`next` tienen uso real y verificado.

**Propuesta**: eliminar `autoprefixer`. *(Fuera del alcance de este prompt — no se instala ni
desinstala nada en fase de diagnóstico.)*

---

## 3. Naming y convenciones

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| D1 | `useCyberSound.ts` es **el único de los 5 hooks sin la directiva `"use client"`**. Funciona porque solo lo consume un Client Component, pero rompe la consistencia y lo volvería frágil si alguna vez se importara desde un módulo compartido. | `hooks/useCyberSound.ts:1` | Menor |
| D2 | `SectionTitle` vive como componente no exportado al final de `CyberPortfolio.tsx`. Es UI genuinamente reutilizable para futuras secciones (CV). | `components/CyberPortfolio.tsx:159` | Menor |

**Todo lo demás cumple**: 100% named exports en componentes/hooks (con la excepción correcta de
los archivos especiales de Next, que exigen `export default`); **100% de los imports internos
usan el alias `@/*`** — cero rutas relativas; `PascalCase` / `camelCase`+`use` /
`SCREAMING_SNAKE_CASE` aplicados sin desvíos; comillas dobles consistentes.

---

## 4. Duplicación de lógica

No encontré reimplementaciones de los hooks compartidos. El patrón está bien respetado:

- `useDialogFocusTrap` + `useLockBodyScroll` se reusan correctamente en los 3 overlays
  (`EncryptionOverlay`, `RansomwareScreen`, modal de `CyberNewsFeed`).
- `useTerminalSession` se reusa en las 2 terminales sin duplicar historial/placeholder/scroll.
- No hay una segunda máquina de estados compitiendo con `useAttackMachine`.

Único punto de fricción menor, en F3 más abajo: `DecryptionTerminal` usa `autoFocus` propio en
lugar de delegar al focus trap del padre.

---

## 5. CSP y headers (`next.config.ts`)

**No hay ninguna violación de la CSP declarada.** Contraste regla por regla contra lo que la app
carga de verdad:

| Regla | Realidad | Veredicto |
|---|---|---|
| `connect-src 'self'` | El cliente solo hace `fetch("/api/cyber-news")`. La llamada a `api.rss2json.com` ocurre **server-side** en el Route Handler, donde la CSP del navegador no aplica. | ✅ Correcta |
| `media-src 'self'` | `/sounds/alarm.mp3`, `/sounds/beep.mp3` — mismo origen. | ✅ Correcta |
| `img-src 'self' data: blob:` | Cubre los cursores SVG como `data:` URI de `globals.css:56,60`. **`blob:` no se usa.** | ⚠️ Más amplia de lo necesario |
| `font-src 'self' data:` | No se carga ninguna webfont: `Courier New` es fuente de sistema y no se usa `next/font`. | ⚠️ Regla innecesaria hoy |
| `script-src 'unsafe-eval'` | Lo requiere el runtime de Next en desarrollo; **en producción es innecesario** y debilita la protección contra XSS. | 🔶 Medio |

| # | Hallazgo | Severidad |
|---|---|---|
| E4 | `'unsafe-eval'` se emite también en build de producción. | Medio |
| E2/E3 | `font-src`/`blob:` más permisivos de lo que la app necesita. | Menor |
| E5 | Falta `object-src 'none'` (mitigado por `default-src 'self'`, pero es hardening barato). | Informativo |

**Propuesta E4**: condicionar por `process.env.NODE_ENV` para no emitir `'unsafe-eval'` en prod.
*(Requiere tocar `next.config.ts`, explícitamente fuera del alcance de este prompt → va a
"Requiere decisión".)*

---

## 6. Accesibilidad

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| F1 | **El modal del lector de noticias no neutraliza el fondo.** Los overlays de ataque sí lo hacen bien (`inert` + `aria-hidden` + blur vía `hasBlockingOverlay` en `CyberPortfolio:45-46`), pero el modal de `CyberNewsFeed` se portalea a `document.body` sin marcar el contenido de fondo como inerte: un lector de pantalla puede seguir recorriendo toda la página detrás del modal. Es el único de los 3 overlays que se sale del patrón. | `components/CyberNewsFeed.tsx:88` | **Medio** |
| F3 | `DecryptionTerminal` pone `autoFocus` en su input, compitiendo con el `initialFocusRef` que `RansomwareScreen` ya le pasa a `useDialogFocusTrap`. Dos mecanismos de foco inicial sobre el mismo dialog. | `components/DecryptionTerminal.tsx:118` | Menor |
| F5 | Los "LED" decorativos (`CyberPortfolio:84-86`) y las barras de `NetworkTraffic` no llevan `aria-hidden`, añadiendo ruido sin significado en lectores de pantalla. | varios | Menor |

**Bien resuelto** ✅: `role="dialog"` + `aria-modal` + `aria-labelledby` en los 3 overlays;
focus trap con ciclado Tab/Shift+Tab y restauración del foco previo; `inert` como booleano de
React 19 (uso correcto); `aria-label` + `title` en el botón flotante; `aria-hidden` +
`pointer-events-none` en el canvas de `MatrixRain`.

**F2 → ver "Requiere decisión"**: ni `EncryptionOverlay` ni `RansomwareScreen` pasan `onEscape`,
así que no se pueden cerrar por teclado. En `RansomwareScreen` parece intencional (la salida es
resolver el puzzle), pero formalmente es un *keyboard trap* (WCAG 2.1.2).

---

## 7. prefers-reduced-motion

Esta es el área con el hueco más sistemático. El bloque global de `globals.css:90-99` solo
neutraliza `animation-*` y `transition-*` **de CSS** — no alcanza a nada animado por JavaScript.

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| G1 | **Framer Motion ignora por completo `prefers-reduced-motion`.** Anima con estilos inline vía JS, fuera del alcance del override CSS. Afecta a `ProjectCard` (`whileHover` con desplazamiento y escala), y a las entradas de `EncryptionOverlay` y `RansomwareScreen`. | `ProjectCard.tsx:40`, `EncryptionOverlay.tsx:44,55`, `RansomwareScreen.tsx:32` | **Medio** |
| G2 | **`MatrixRain` ignora `prefers-reduced-motion`**: mantiene un loop de `requestAnimationFrame` indefinido a ~24fps sobre toda la pantalla, sin escape posible para quien pidió movimiento reducido. Es, además, la animación más intensa del sitio. | `components/MatrixRain.tsx:41-69` | **Medio** |

**Propuesta G1**: envolver el árbol en `<MotionConfig reducedMotion="user">` — one-liner que
cubre todos los componentes Framer de una vez, presente y futuros.
**Propuesta G2**: leer `matchMedia("(prefers-reduced-motion: reduce)")` y, si aplica, pintar un
único frame estático en lugar de arrancar el loop.

**Ya correcto** ✅: las animaciones utilitarias de Tailwind (`animate-pulse`, `animate-ping`,
`animate-spin`, `animate-bounce`) sí quedan cubiertas por el override CSS global.
`NetworkTraffic` es **el único componente que consulta la media query explícitamente**
(`NetworkTraffic.tsx:20`) — es el modelo a replicar en G1/G2.

---

## 8. Colores hardcodeados vs. tokens

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| K1 | `const mainColor = isAlertMode ? "#FF0000" : "#00FF41"`. Además de estar hardcodeado, **`#FF0000` no coincide con el token de alerta `--color-accent: #ef4444`**: en modo alerta la lluvia Matrix queda de un rojo distinto al del resto de la interfaz. Es un desajuste visual real, no solo estilístico. | `components/CyberPortfolio.tsx:20` | **Medio** |
| K2 | Prop por defecto `color = "#00FF41"` duplica el valor del token verde. | `components/MatrixRain.tsx:9` | Menor |
| K3 | `bg-[#0a0a0a]` arbitrario donde el resto del proyecto usa `bg-black/9x`. | `components/CyberNewsFeed.tsx:96` | Menor |

**Matiz importante para el fix de K1/K2**: el canvas necesita un color *computado* (no puede
usar clases Tailwind), así que la solución no es "usar `text-accent`" sino leer la variable con
`getComputedStyle(el).getPropertyValue("--color-accent")`, o exportar las constantes desde un
único lugar en TS. Requiere una decisión pequeña de implementación.

**El resto del código cumple bien** ✅: uso consistente de `accent`/`accent-strong` en bordes,
textos, fondos y sombras — que es justamente lo que hace que el theming por `data-mode="alert"`
funcione globalmente. Las excepciones encontradas (`yellow-500` para advertencias, `text-white`
para alto contraste, `red-*` semántico) son las ya aceptadas por la convención.
`ctx.fillStyle = "rgba(0,0,0,0.08)"` en `MatrixRain:53` es lógica de fade del canvas, no un color
de tema — se deja como está.

---

## 9. RSS y Route Handler

El patrón declarado (`Promise.allSettled` + `degraded`/`failedSources`) **está implementado de
verdad**, pero tiene dos huecos:

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| J1 | **Ningún `fetch` de RSS tiene timeout.** Una sola fuente que cuelgue mantiene bloqueada la respuesta del route handler completo, porque `Promise.allSettled` espera a todas. Con 8 fuentes externas fuera de control propio, es el riesgo de disponibilidad más concreto del proyecto. | `lib/rss.ts:84,99` | **Medio** |
| J2 | **`degraded` sub-reporta fallos.** Si el proxy responde 200 con `items: []`, `normalizeItems` devuelve `[]`, la promesa se resuelve como *fulfilled* y **no se intenta el fallback a XML directo**: la fuente aporta cero noticias pero no cuenta como fallida. El aviso "STREAM_DEGRADED" y el contador `SOURCES: n/8 ACTIVE_NODES` muestran un estado más sano que el real. | `lib/rss.ts:83-96,111-138` | **Medio** |
| J3 | `pubDate` no se valida. Una fecha no parseable produce `Invalid Date` → `getTime()` devuelve `NaN`, lo que corrompe el `.sort()`, y el cliente renderiza literalmente "Invalid Date". | `lib/rss.ts:76,131` · `CyberNewsFeed.tsx:123,204` | Menor |
| J4 | Parseo XML por regex en vez de un parser real: frágil ante CDATA anidado o atributos inusuales. Mitigado en la práctica porque el proxy va primero. | `lib/rss.ts:40-69` | Menor (conocido) |
| I2 | `(await res.json()) as NewsResponse` y `as { items?: RssItem[] ... }` son casts sin validación en runtime sobre datos de terceros. TypeScript da una falsa sensación de seguridad aquí. | `CyberNewsFeed.tsx:65` · `rss.ts:90` | Medio |

**Correcto** ✅: el fallback proxy → XML directo por fuente; la deduplicación por `guid`/`link`;
el `502` bien acotado (solo si *todas* fallan y no hay items); `Cache-Control` coherente con
`revalidate = 900`; el `isMounted` guard en el cliente.

---

## 10. TypeScript

`tsc --noEmit` y ESLint pasan **sin un solo error o warning**. Cero `any` (implícito o
explícito), cero supresiones.

| # | Hallazgo | Severidad |
|---|---|---|
| I2 | Casts sin validación runtime sobre JSON externo (detallado en §9). | Medio |
| I3 | `noUncheckedIndexedAccess` no está habilitado. El caso más frágil es `const nextChallenge = CHALLENGES[step + 1]` (`DecryptionTerminal.tsx:72`), que TypeScript tipa como definido pero puede ser `undefined`. Hoy no explota porque esa rama solo corre cuando `res !== "SUCCESS"` y el último challenge sí es `SUCCESS` — funciona por coincidencia del contenido de los datos, no por garantía del tipo. | Menor |

---

## 11. Performance y memory leaks

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| H1 | `executeWithScan` crea un `setInterval` que solo se limpia desde dentro de su propio callback. **No hay cleanup en unmount**: si el componente se desmonta durante el escaneo (~720ms), el intervalo sobrevive y llama `setState` sobre un componente desmontado. | `components/TerminalConsole.tsx:45-70` | **Medio** |
| H2 | `window.setTimeout(onSolved, 2000)` sin cleanup ni referencia guardada. | `components/DecryptionTerminal.tsx:70` | Medio |
| H3 | `setTimeout(onComplete, ...)` dentro del interval y el `setTimeout` de `handlePointerClick` no se cancelan en unmount. Impacto real bajo (el componente se desmonta inmediatamente después). | `components/EncryptionOverlay.tsx:28,40` | Menor |
| H4 | `resizeCanvas` sin debounce: cada evento de resize reasigna el array `drops` completo y reinicia la lluvia. | `components/MatrixRain.tsx:73` | Menor |

**Bien resuelto** ✅ — la mayoría del código sí limpia correctamente: `MatrixRain` cancela RAF y
quita el listener de resize; `MatrixRain` además pausa el dibujado con `document.hidden` y limita
`devicePixelRatio` a 1.5; `NetworkTraffic` también respeta `document.hidden`; `CyberNewsFeed`
desconecta el `IntersectionObserver` y usa guard `isMounted`; `useCyberSound`, `useLockBodyScroll`
y `useDialogFocusTrap` tienen cleanups completos.

No detecté renders innecesarios relevantes: los callbacks compartidos ya usan `useCallback` y la
escala de datos (3 proyectos, 80 noticias máx.) no justifica memoización adicional.

---

## 12. Código comentado, TODOs y debug

Limpio. **Cero** comentarios `TODO`/`FIXME`/`HACK`/`XXX`, cero bloques de código comentado, cero
`console.log` de debug. El único `console.*` del proyecto es `console.error(error)` en
`app/error.tsx:13`, que es logging intencional y correcto en un error boundary.

## 13. `app/page.tsx`

✅ Confirmado: sigue siendo exactamente `return <CyberPortfolio />`, sin lógica filtrada, sin
estado, sin fetching. 5 líneas.

---

## Quick wins

Fixes triviales, sin impacto arquitectónico, seguros de aplicar en un solo paso:

| # | Fix | Archivos |
|---|---|---|
| B1 | Borrar `TERMINAL_REFILL_DELAY_MS`. | `lib/constants.ts` |
| B3 | Borrar los 5 SVGs del starter de Next. | `public/` |
| B4 | Quitar `export` de `stripHtml` y `RssItem`. | `lib/rss.ts` |
| D1 | Añadir `"use client"` a `useCyberSound.ts`. | `hooks/useCyberSound.ts` |
| G1 | Envolver el árbol en `<MotionConfig reducedMotion="user">` (cubre todo Framer Motion de una vez). | `CyberPortfolio.tsx` |
| G2 | Chequear `matchMedia` en `MatrixRain` y pintar un frame estático si hay reduced-motion. | `MatrixRain.tsx` |
| H1/H2/H3 | Guardar los timers en refs y cancelarlos en el cleanup del `useEffect`. | `TerminalConsole.tsx`, `DecryptionTerminal.tsx`, `EncryptionOverlay.tsx` |
| H4 | Debounce (~150ms) en `resizeCanvas`. | `MatrixRain.tsx` |
| J1 | Añadir `signal: AbortSignal.timeout(8000)` a los dos `fetch` de RSS. | `lib/rss.ts` |
| J3 | Validar `pubDate` con un fallback a fecha actual si `isNaN(getTime())`. | `lib/rss.ts` |
| F3 | Quitar el `autoFocus` de `DecryptionTerminal` y dejar que lo gestione el focus trap del padre. | `DecryptionTerminal.tsx` |
| K3 | Sustituir `bg-[#0a0a0a]` por `bg-black/95`. | `CyberNewsFeed.tsx` |

## Requiere decisión

Cambios que tocan arquitectura, configuración protegida o UX intencional:

| # | Tema | Decisión pendiente |
|---|---|---|
| **F1** | Modal de noticias sin `inert` en el fondo (a11y, **medio**). | Cómo aplicarlo: extraer el patrón `inert`/`aria-hidden` de `CyberPortfolio` a un hook compartido (`useInertBackground`) y usarlo en los 3 overlays, o resolverlo puntualmente en `CyberNewsFeed`. Recomiendo el hook: es el mismo patrón repetido 2 veces y va a repetirse en cada modal futuro. |
| **F2** | `RansomwareScreen` es un keyboard trap sin salida (WCAG 2.1.2). | ¿Se acepta como parte de la experiencia narrativa, o se añade una salida por `Escape` / botón "abortar simulación"? Es una tensión real entre la gracia del easter egg y la accesibilidad. |
| **J2** | `degraded` sub-reporta fuentes vacías. | Definir la semántica: ¿una fuente que responde 200 con 0 items cuenta como fallida, o debería disparar el fallback a XML directo antes de darse por buena? Recomiendo lo segundo (tratar `[]` como fallo del proxy y reintentar directo). |
| **E4** | `'unsafe-eval'` en la CSP de producción. | Requiere tocar `next.config.ts`, excluido de este prompt. Condicionar por `NODE_ENV` es de bajo riesgo pero conviene verificarlo con un build de prod real antes de mergear. |
| **K1/K2** | Colores del canvas hardcodeados y desalineados con el token de alerta. | Elegir mecanismo: leer `--color-accent` con `getComputedStyle`, o centralizar los hex en TS y generar desde ahí los tokens CSS. Lo primero es menos código; lo segundo da una única fuente de verdad. |
| **C1** | `autoprefixer` sin uso. | Desinstalar (excluido de este prompt por indicación explícita). |
| **B2** | Tokens `matrix-green/bright/dim` muertos. | ¿Borrarlos o adoptarlos? `matrix-bright` encajaría bien como token para los textos que hoy usan `text-white` hardcodeado. |
| **D2** | `SectionTitle` inline no exportado. | Es el primer candidato natural a una carpeta `components/ui/`. Vale la pena decidirlo **antes** de construir la sección de CV, porque esa sección va a necesitar varias primitivas compartidas (badge, card, section title) y es el momento barato para establecer el patrón. |
| **I3** | `noUncheckedIndexedAccess` desactivado. | Habilitarlo endurece el acceso por índice pero obligará a añadir guards en `MatrixRain`, `DecryptionTerminal` y `TerminalConsole`. Decisión de rigor vs. ruido. |

---

## Lectura general

El baseline está **notablemente más sano de lo típico** para un proyecto personal: tipado
estricto que compila limpio, cero deuda marcada, convenciones de naming e imports respetadas al
100%, y —lo más difícil de conseguir— patrones compartidos (focus trap, lock scroll, sesión de
terminal, máquina de estados) que efectivamente se reusan en vez de duplicarse.

Los dos temas transversales que sí conviene cerrar antes de construir features nuevas son
**`prefers-reduced-motion` (G1/G2)** y **la limpieza de timers (H1-H3)**, porque ambos son
patrones que se van a copiar tal cual en cada componente futuro. Y si la próxima feature es la
sección de CV, **D2 es la decisión a tomar primero**: es el momento más barato para definir si
existe una capa `components/ui/` antes de que aparezcan tres variantes distintas de la misma
tarjeta.
