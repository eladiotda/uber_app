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
