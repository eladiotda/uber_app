# Bitácora de uso de IA

<!-- AI-assisted: see docs/AI_LOG.md #1 -->

Registro de cada interacción con herramientas de IA en el proyecto UberClone (versión conductor). Las entradas se numeran de forma consecutiva y se agregan durante la misma sesión en que se usa la IA.

---

### Entrada #1

- Fecha: 2026-11-02
- Integrante: eladiotda
- Herramienta: Claude Code (extensión de VS Code) — Claude Opus 5.5 (claude-opus-5-5)
- Objetivo: Establecer las reglas obligatorias de uso de IA del proyecto y crear la bitácora `docs/AI_LOG.md` y la sección "Uso de IA" del README.
- Prompt:

  ````text
  "# Reglas obligatorias de uso de IA en este proyecto

  Este es un proyecto académico (UberClone, versión conductor). Todo uso de IA debe quedar registrado en `docs/AI_LOG.md`. Aplica estas reglas en cada interacción, incluso si solo respondes una pregunta y no cambias código.

  ## Antes de trabajar
  1. Si no existe `docs/AI_LOG.md`, créalo.
  2. Si `README.md` no tiene la sección "Uso de IA" con un enlace a `docs/AI_LOG.md`, agrégala.
  3. Revisa la rama actual con `git branch --show-current`. Si es `main`, avísame y no hagas cambios hasta que cambie a mi rama.
  4. Obtén mi nombre con `git config user.name`. Si no está configurado, pregúntamelo.
  5. Busca el número de la última entrada y usa el siguiente. Si no hay entradas, empieza en #1.

  ## Registro de cada entrada
  Registra la entrada durante la misma sesión, nunca al final del proyecto. Usa exactamente esta plantilla, en español:

  ### Entrada #N
  - Fecha: AAAA-MM-DD
  - Integrante: Nombre Apellido
  - Herramienta: [nombre del agente y modelo]
  - Objetivo: [qué se buscaba lograr]
  - Prompt: "[texto completo y literal de mi mensaje, sin resumir ni corregir]"
  - Resumen de la respuesta: [2 o 3 líneas; agrega el enlace a la conversación si existe]
  - Qué se usó / modificó / descartó: [PENDIENTE DE CONFIRMAR]
  - Archivos y commit: [rutas] — [hash corto]
  - Verificación: [cómo se comprobó que funciona]
  - Aprendizaje: [PENDIENTE: lo escribe el integrante]

  ---

  ### Entrada #3
  - Fecha: 2026-11-02
  - Integrante: andres
  - Herramienta: AI assistant using Copilot SDK in VS Code
  - Objetivo: Registrar en esta bitácora la evidencia de la ejecución de las pruebas solicitada por el integrante.
  - Prompt:
    ```text
    guardame el resultado de las pruebas test que acabe de hacer tambien en el mismo archivo .md para que quede evidencia de las pruebas
    ```
  - Resumen de la respuesta: Se ejecutó el comando `npm test` desde `C:\Users\USER\uber_app` y se registró el resultado real de la ejecución. La suite terminó correctamente con 10 pruebas aprobadas y ninguna fallida.
  - Qué se usó / modificó / descartó: Se modificó únicamente `docs/AI_LOG.md` para agregar esta evidencia. No se modificó el código de la aplicación ni la configuración.
  - Archivos y commit: `docs/AI_LOG.md` — [PENDIENTE]
  - Verificación:
    - Comando: `npm test`
    - Script ejecutado: `node --test src/test/validations.test.js`
    - Resultado: 10 pruebas (`tests 10`)
    - Aprobadas: 10 (`pass 10`)
    - Fallidas: 0 (`fail 0`)
    - Canceladas: 0 (`cancelled 0`)
    - Omitidas: 0 (`skipped 0`)
    - Duración reportada: 198.3304 ms
    - Estado del proceso: código de salida 0
    - Advertencia: Node indicó que no se especificó `"type": "module"` en el nivel principal de `package.json`. Actualmente aparece dentro de `dependencies`; queda [PENDIENTE] moverlo al nivel principal para eliminar la advertencia.
  - Aprendizaje: [PENDIENTE: lo escribe el integrante]

  ---

  ### Entrada #2
  - Fecha: 2026-11-02
  - Integrante: andres
  - Herramienta: AI assistant using Copilot SDK in VS Code
  - Objetivo: Diagnosticar el error de `npm test`, explicar la solución paso a paso y documentar el trabajo en la carpeta `docs`.
  - Prompt:
    ```text
    PS C:\Users\USER\uber_app> npm test
    npm error Missing script: "test"
    npm error
    npm error To see a list of scripts, run:
    npm error   npm run
    npm error A complete log of this run can be found in: C:\Users\USER\AppData\Local\npm-cache\_logs\2026-11-02T23_07_48_260Z-debug-0.log

    me esta saliendo este error, dime cual es la solucion, dame el paso y porque esta ocurriendo, deja todo dcumentado en docs de lo que vamos a hacer en esta seccion
  ````

  - Preguntas e indicaciones posteriores:
    ```text
    no me reescriba nada, guiame que es lo que tengo que hacer
    ```
    ```text
    todo lo que hicimos y preguntamos pasalo al archivo AI_LOG.md que quede bien documentado
    ```
  - Resumen de la respuesta: Se revisó `package.json`, los scripts disponibles, la prueba `src/test/validations.test.js`, la implementación de validaciones y la documentación existente. Se determinó que el error principal ocurre porque `package.json` no contiene el script `"test"`. Al ejecutar la prueba directamente también se detectó una ruta de import incorrecta y una advertencia por el uso de módulos ES.
  - Qué se usó / modificó / descartó: No se modificó código. Se intentó aplicar una corrección automática, pero la operación fue interrumpida antes de cambiar archivos. Se propuso al integrante hacer manualmente estos cambios: agregar `"test": "node --test src/test/validations.test.js"` en `package.json`, agregar `"type": "module"` y corregir el import de la prueba a `../theme/utils/validations.js`.
  - Archivos y commit: `docs/AI_LOG.md` — [PENDIENTE]
  - Verificación: Se ejecutó `npm run` y se confirmó que no existía el script `test`. También se ejecutó `node --test src/test/validations.test.js`; la prueba no inició porque buscó `src/src/utils/validation.js`, ruta que no existe. [PENDIENTE] Ejecutar `npm test` después de aplicar manualmente las correcciones.
  - Aprendizaje: [PENDIENTE: lo escribe el integrante]

  ## Reglas para completar la entrada
  - Prompt: copia mi mensaje palabra por palabra, incluidos los errores de escritura.
  - Qué se usó / modificó / descartó: propón un borrador y pídeme confirmarlo. Solo yo decido qué conservé, cambié o descarté.
  - Commit: nunca inventes el hash. Primero haz el commit del código y obtén el hash con `git rev-parse --short HEAD`. Luego registra la entrada y súbela en un commit aparte. Si todavía no hay commit, escribe `[PENDIENTE]` y complétalo después.
  - Verificación: registra solo pruebas que realmente se hayan hecho, como una prueba en el emulador, un caso de prueba o una revisión de documentación. Si no se ha probado, escribe `[PENDIENTE]` y dime qué debo probar. Nunca afirmes que algo funciona sin comprobarlo.
  - Aprendizaje: no lo redactes por mí. Déjalo como `[PENDIENTE]` y recuérdamelo.

  ## Marcado del código

  Marca cada bloque generado o modificado con ayuda de IA con un comentario en inglés que indique el número de la entrada:

  // AI-assisted: see docs/AI_LOG.md #N

  Usa la sintaxis de comentario que corresponda al tipo de archivo. En JSX, usa `{/* AI-assisted: see docs/AI_LOG.md #N */}`.

  ## Seguridad
  - Nunca solicites, escribas ni registres llaves de API, `access_token`, secret keys ni datos personales reales.
  - Si detectas alguno de esos datos en mi prompt, avísame y reemplázalo por `[REDACTED]` en la bitácora.
  - No incluyas secretos en el código de la app ni en `AI_LOG.md`.

  ## Ramas y Pull Requests
  - Trabaja solo en mi rama. Nunca hagas commit, push ni merge directamente en `main`.
  - La bitácora llega a `main` mediante Pull Request, igual que el código.
  - Si hay un conflicto o una numeración repetida en `AI_LOG.md`, conserva todas las entradas, renumera las mías y actualiza sus comentarios `AI-assisted`.

  ## Sustentación

  Cualquier integrante puede tener que explicar un bloque asistido por IA. Después de cada cambio importante, explícame brevemente qué hace el código y por qué se hizo así.

  ## Al terminar cada tarea

  Muéstrame siempre:
  1. El número de la entrada registrada.
  2. Los archivos modificados.
  3. Los campos que siguen en `[PENDIENTE]`.
  4. Las pruebas que debo hacer.

  No des una tarea por terminada si no registraste su entrada."

  ```

  ```

- Resumen de la respuesta: La IA verificó la rama (`eladio`, no `main`) y el usuario de git, creó `docs/AI_LOG.md` con esta entrada y `README.md` con la sección "Uso de IA" enlazada a la bitácora. No se modificó código de la app. Sesión local de Claude Code, sin enlace público a la conversación.
- Qué se usó / modificó / descartó: [PENDIENTE DE CONFIRMAR] Borrador propuesto: se conservaron sin cambios `README.md` (sección "Uso de IA") y la estructura de `docs/AI_LOG.md`; no se descartó nada.
- Archivos y commit: `README.md`, `docs/AI_LOG.md` — 8503c1b
- Verificación: Se comprobó con `git branch --show-current` que la rama es `eladio` y con `test -f docs/AI_LOG.md` que el enlace del README apunta a un archivo existente. [PENDIENTE] Revisar en GitHub que el README y la bitácora se vean bien y que el enlace abra la bitácora.
- Aprendizaje: [PENDIENTE: lo escribe el integrante]
