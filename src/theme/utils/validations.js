import {
  CATEGORIES,
  GENDERS,
  LANGUAGES,
  LIMITS,
  VEHICLE_COLORS,
} from "../config/catalogs.js";

export const EMPTY_PERSONAL = {
  photo: "",
  fullName: "",
  documentId: "",
  phone: "",
  birthDate: "",
  gender: "",
  email: "",
  language: "es",
};

export const EMPTY_VEHICLE = {
  category: "",
  plate: "",
  brand: "",
  model: "",
  year: "",
  color: "",
  capacity: "",
  photo: "",
};

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PLATE_PATTERN = /^[A-Z]{3}\d{3}$/;

const isOption = (list, value) => list.some((option) => option.value === value);
const isBlank = (value) => String(value ?? "").trim() === "";

// Convierte un Date a texto 'AAAA-MM-DD' usando la fecha local del celular.
export function toISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Convierte 'AAAA-MM-DD' a Date. Devuelve null si el texto no es una fecha real (ej. 2025-02-30).
export function parseISODate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text ?? ""));
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const isReal =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isReal ? date : null;
}

// Fecha máxima de nacimiento permitida: hoy menos 18 años.
export function latestAdultBirthDate(today = new Date()) {
  return new Date(
    today.getFullYear() - LIMITS.minAge,
    today.getMonth(),
    today.getDate(),
  );
}

export function isAdult(birthDate, today = new Date()) {
  const birth = parseISODate(birthDate);
  return !!birth && birth <= latestAdultBirthDate(today);
}

// "Convertir a mayúsculas antes de validar": quita espacios y guiones y pasa a mayúsculas.
export function normalizePlate(plate) {
  return String(plate ?? "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

export function minCapacityFor(category) {
  return category === "xl" ? LIMITS.xlMinCapacity : LIMITS.minCapacity;
}

export function validatePersonal(data, today = new Date()) {
  const errors = {};
  const fullName = String(data.fullName ?? "").trim();

  if (isBlank(data.photo)) errors.photo = "La foto de perfil es obligatoria.";

  if (!fullName) errors.fullName = "El nombre completo es obligatorio.";
  else if (fullName.length > LIMITS.nameMax)
    errors.fullName = `Máximo ${LIMITS.nameMax} caracteres.`;
  else if (!NAME_PATTERN.test(fullName))
    errors.fullName = "Usa solo letras y espacios.";

  if (isBlank(data.documentId))
    errors.documentId = "El documento es obligatorio.";
  else if (!/^\d{6,10}$/.test(data.documentId))
    errors.documentId = "Solo números, entre 6 y 10 dígitos.";

  if (isBlank(data.phone)) errors.phone = "El celular es obligatorio.";
  else if (!/^\d{10}$/.test(data.phone))
    errors.phone = "Solo números, exactamente 10 dígitos.";

  if (isBlank(data.birthDate))
    errors.birthDate = "La fecha de nacimiento es obligatoria.";
  else if (!parseISODate(data.birthDate))
    errors.birthDate = "Usa una fecha válida (AAAA-MM-DD).";
  else if (!isAdult(data.birthDate, today))
    errors.birthDate = `Debes ser mayor de ${LIMITS.minAge} años.`;

  if (!isOption(GENDERS, data.gender)) errors.gender = "Selecciona tu género.";

  if (isBlank(data.email)) errors.email = "El correo es obligatorio.";
  else if (!EMAIL_PATTERN.test(String(data.email).trim()))
    errors.email =
      "Correo inválido: debe tener @ y un dominio (ej. nombre@correo.com).";

  if (!isOption(LANGUAGES, data.language))
    errors.language = "Selecciona un idioma.";

  return errors;
}

export function validateVehicle(data, today = new Date()) {
  const errors = {};
  const plate = normalizePlate(data.plate);
  const brand = String(data.brand ?? "").trim();
  const model = String(data.model ?? "").trim();
  const currentYear = today.getFullYear();

  if (!isOption(CATEGORIES, data.category))
    errors.category = "Selecciona una categoría.";

  if (!plate) errors.plate = "La placa es obligatoria.";
  else if (!PLATE_PATTERN.test(plate))
    errors.plate = "Formato colombiano: 3 letras y 3 números (ABC123).";

  if (!brand) errors.brand = "La marca es obligatoria.";
  else if (brand.length > LIMITS.brandMax)
    errors.brand = `Máximo ${LIMITS.brandMax} caracteres.`;

  if (!model) errors.model = "El modelo es obligatorio.";
  else if (model.length > LIMITS.modelMax)
    errors.model = `Máximo ${LIMITS.modelMax} caracteres.`;

  if (isBlank(data.year)) errors.year = "El año es obligatorio.";
  else if (!/^\d{4}$/.test(data.year))
    errors.year = "Escribe el año con 4 dígitos.";
  else if (Number(data.year) > currentYear)
    errors.year = `No puede ser mayor a ${currentYear}.`;
  else if (Number(data.year) < LIMITS.minYear)
    errors.year = `No puede ser menor a ${LIMITS.minYear}.`;

  if (!isOption(VEHICLE_COLORS, data.color))
    errors.color = "Selecciona el color.";

  const minimum = minCapacityFor(data.category);
  if (isBlank(data.capacity)) errors.capacity = "La capacidad es obligatoria.";
  else if (!/^\d{1,2}$/.test(data.capacity)) errors.capacity = "Solo números.";
  else if (Number(data.capacity) < minimum)
    errors.capacity =
      data.category === "xl"
        ? `La categoría XL exige mínimo ${LIMITS.xlMinCapacity} pasajeros.`
        : `Mínimo ${minimum} pasajero.`;
  else if (Number(data.capacity) > LIMITS.maxCapacity)
    errors.capacity = `Máximo ${LIMITS.maxCapacity} pasajeros.`;

  if (isBlank(data.photo))
    errors.photo =
      "La foto del vehículo (con la placa visible) es obligatoria.";

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
