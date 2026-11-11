export const GENDERS = [
  { value: "female", label: "Femenino" },
  { value: "male", label: "Masculino" },
  { value: "non_binary", label: "No binario" },
  { value: "not_say", label: "Prefiero no decirlo" },
];
// Mismo selector de idioma que la app del pasajero.
export const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];
// Mismas categorías que elige el pasajero.
export const CATEGORIES = [
  { value: "economy", label: "Económico" },
  { value: "xl", label: "XL" },
  { value: "premium", label: "Premium" },
];
export const VEHICLE_COLORS = [
  { value: "white", label: "Blanco" },
  { value: "black", label: "Negro" },
  { value: "gray", label: "Gris" },
  { value: "silver", label: "Plata" },
  { value: "blue", label: "Azul" },
  { value: "red", label: "Rojo" },
  { value: "green", label: "Verde" },
  { value: "yellow", label: "Amarillo" },
  { value: "other", label: "Otro" },
];
export const LIMITS = {
  nameMax: 50,
  brandMax: 30,
  modelMax: 30,
  minAge: 18,
  minYear: 1950,
  minCapacity: 1,
  xlMinCapacity: 6,
  maxCapacity: 16,
};
// Categorías de licencia de conducción en Colombia (B = servicio particular, C = servicio público).
export const LICENSE_CATEGORIES = [
  { value: "B1", label: "B1 — Automóvil particular" },
  { value: "B2", label: "B2 — Camioneta / microbús particular" },
  { value: "B3", label: "B3 — Vehículo pesado particular" },
  { value: "C1", label: "C1 — Automóvil servicio público" },
  { value: "C2", label: "C2 — Camioneta / microbús servicio público" },
  { value: "C3", label: "C3 — Vehículo pesado servicio público" },
];
// Métodos de pago de un viaje (PDF sección 6).
export const PAYMENT_METHODS = [
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "cash", label: "Efectivo" },
];
