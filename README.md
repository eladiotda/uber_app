Uber_APP

Proyecto académico: clon de Uber (versión conductor) desarrollado con _Expo / React Native_ (JavaScript).

## Primera entrega — Registro del conductor (pestañas 1 y 2)

- Navegación _Tab_ con las pestañas Datos personales, Vehículo y Documentos (la 3 se implementa en la segunda entrega).
- _Pestaña 1:_ foto de perfil (cámara o galería), nombre (máx. 50, solo letras y espacios), documento (6–10 dígitos), celular (10 dígitos), fecha de nacimiento con selector (mayor de 18), género, correo e idioma.
- _Pestaña 2:_ categoría (Económico, XL, Premium), placa colombiana ABC123 (se pasa a mayúsculas antes de validar), marca y modelo (máx. 30), año (4 dígitos, no mayor al actual), color, capacidad (XL mínimo 6) y foto del vehículo.
- Ningún campo puede quedar vacío; los errores se muestran _debajo de cada campo_, no en un Alert.
- _Guardado en base de datos:_ Firebase Firestore, documento drivers/{uid} en estado draft.
- _Imágenes guardadas:_ también en Firestore. Cada foto se comprime (800 px, JPEG) y se guarda en base64 dentro del campo photoUrl. Todo funciona en el plan _Spark gratuito_, sin tarjeta y sin Firebase Storage.
- Hooks: useState, useEffect (con limpieza), useContext, useMemo y useCallback. AsyncStorage solo para la preferencia de idioma y la sesión.

## Instalación

Requisitos: Node.js 22 LTS o superior y la app _Expo Go_ en el celular.

bash
npm install
npx expo start

Escanea el código QR con Expo Go (celular y computador en la misma red Wi-Fi). Pruebas de validación: npm test.

## Configurar Firebase (una sola vez por equipo)

1. En [console.firebase.google.com](https://console.firebase.google.com) crea un proyecto (plan Spark).
2. _Seguridad > Authentication > Método de acceso > Anónimo > Habilitar_ (sin limpieza automática).
3. _Bases de datos y almacenamiento > Firestore > Crear base de datos_: ID (default), modo producción.
4. _Firestore > Reglas:_ pega el contenido de firestore.rules y publica.
5. _Configuración del proyecto > Tus apps > Web (</>)_: registra la app y copia apiKey, authDomain, projectId y appId.
6. Copia .env.example como .env (PowerShell: Copy-Item .env.example .env) y llena:

env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

Reinicia con npx expo start -c. El .env _no se sube a GitHub_ (está en .gitignore); compártanlo por un canal privado. Usen solo datos ficticios.

## Modelo de datos (drivers/{uid})

| Campo                | Tipo      | Descripción                                                                                |
| -------------------- | --------- | ------------------------------------------------------------------------------------------ |
| uid                  | string    | Id de la sesión anónima del conductor                                                      |
| status               | string    | draft (borrador). En la entrega 2 pasa a pending                                           |
| available            | boolean   | Siempre false hasta que la cuenta sea aprobada                                             |
| personal             | map       | photoUrl (foto en base64), fullName, documentId, phone, birthDate, gender, email, language |
| vehicle              | map       | photoUrl (foto en base64), category, plate, brand, model, year, color, capacity            |
| createdAt, updatedAt | timestamp | Fechas del registro                                                                        |

Las reglas (firestore.rules) solo dejan a cada conductor leer y escribir su propio documento, no le permiten aprobarse ni borrar, y limitan cada foto a menos de 400 KB (el documento admite máximo 1 MiB).

## Estructura

text
App.js Proveedores, carga inicial y navegación
src/config/catalogs.js Opciones de listas y límites
src/utils/validations.js Validaciones (funciones puras con pruebas)
src/components/ Controles de formulario y foto
src/context/RegistrationContext.js Estado del registro (useContext) y guardado
src/context/RegistrationTabs.js Navegación Tab
src/screens/ Pestañas Datos personales, Vehículo y Documentos
src/services/firebase.js Firebase y sesión anónima
src/services/driverRepository.js Lectura y escritura en Firestore
src/services/photos.js Compresión de fotos a base64
src/test/ Pruebas de validación
firestore.rules Reglas de seguridad

## Equipo y forma de trabajo

- Cada integrante trabaja en su propia rama y sube sus cambios a main mediante Pull Request.
- Nunca se suben llaves ni contraseñas: van en .env. Las variables están en .env.example.

## Uso de IA

Todo uso de herramientas de IA en este proyecto queda registrado en la bitácora [docs/AI_LOG.md](docs/AI_LOG.md).


## Paquedes usados
npx expo install expo-image-picker
npx expo install expo-image-manipulator
npx expo install @react-native-community/datetimepicker
npx expo install @react-native-async-storage/async-storage
npx expo install @react-navigation/native
npx expo install @react-navigation/bottom-tabs
npx expo install react-native-screens
npx expo install react-native-safe-area-context
npx expo install react-dom react-native-web
npm install firebase