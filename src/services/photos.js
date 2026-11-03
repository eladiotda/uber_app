import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_CHARS = 350000; // ~260 KB por foto

// Si la foto sigue pesada, se intenta otra vez más pequeña y con más compresión.
const ATTEMPTS = [
  { width: 800, compress: 0.6 },
  { width: 640, compress: 0.5 },
  { width: 480, compress: 0.4 },
  { width: 360, compress: 0.3 },
];

export async function compressImage(uri) {
  if (!uri) throw new Error('Falta una foto.');
  // Ya estaba comprimida (por ejemplo, la foto que se cargó desde Firestore): no se repite.
  if (uri.startsWith('data:image/jpeg') && uri.length <= MAX_CHARS) return uri;

  for (const { width, compress } of ATTEMPTS) {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width, height: null }); // el alto se calcula solo y mantiene la proporción
    const image = await context.renderAsync();
    const result = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
    const dataUri = `data:image/jpeg;base64,${result.base64}`;
    if (dataUri.length <= MAX_CHARS) return dataUri;
  }
  throw new Error('La foto es demasiado pesada. Elige otra.');
}