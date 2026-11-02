import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAdult,
  normalizePlate,
  parseISODate,
  validatePersonal,
  validateVehicle,
} from "../theme/utils/validations.js";

const TODAY = new Date(2026, 10, 2); // 2 de noviembre de 2026

const validPersonal = {
  photo: "file:///foto-perfil.jpg",
  fullName: "María José Pérez",
  documentId: "1020304050",
  phone: "3001234567",
  birthDate: "1995-06-15",
  gender: "female",
  email: "maria@correo.com",
  language: "es",
};

const validVehicle = {
  category: "economy",
  plate: "abc123",
  brand: "Renault",
  model: "Logan",
  year: "2020",
  color: "white",
  capacity: "4",
  photo: "file:///foto-carro.jpg",
};

test("datos personales válidos no tienen errores", () => {
  assert.deepEqual(validatePersonal(validPersonal, TODAY), {});
});

test("ningún campo puede quedar vacío", () => {
  const errors = validatePersonal(
    {
      photo: "",
      fullName: "",
      documentId: "",
      phone: "",
      birthDate: "",
      gender: "",
      email: "",
      language: "",
    },
    TODAY,
  );
  assert.deepEqual(Object.keys(errors).sort(), [
    "birthDate",
    "documentId",
    "email",
    "fullName",
    "gender",
    "language",
    "phone",
    "photo",
  ]);
});

test("nombre: solo letras y espacios, máximo 50", () => {
  assert.ok(
    validatePersonal({ ...validPersonal, fullName: "Juan123" }, TODAY).fullName,
  );
  assert.ok(
    validatePersonal({ ...validPersonal, fullName: "a".repeat(51) }, TODAY)
      .fullName,
  );
  assert.equal(
    validatePersonal({ ...validPersonal, fullName: "Ñoño Úrsula" }, TODAY)
      .fullName,
    undefined,
  );
});

test("documento de 6 a 10 dígitos y celular de 10", () => {
  assert.ok(
    validatePersonal({ ...validPersonal, documentId: "12345" }, TODAY)
      .documentId,
  );
  assert.ok(
    validatePersonal({ ...validPersonal, documentId: "12345678901" }, TODAY)
      .documentId,
  );
  assert.ok(
    validatePersonal({ ...validPersonal, phone: "300123456" }, TODAY).phone,
  );
  assert.ok(
    validatePersonal({ ...validPersonal, phone: "30012345ab" }, TODAY).phone,
  );
});

test("mayor de 18 años y fechas reales", () => {
  assert.equal(isAdult("2008-11-02", TODAY), true); // cumple 18 hoy
  assert.equal(isAdult("2008-11-03", TODAY), false); // cumple 18 mañana
  assert.equal(parseISODate("2025-02-30"), null);
});

test("correo con @ y dominio", () => {
  assert.ok(
    validatePersonal({ ...validPersonal, email: "maria.correo.com" }, TODAY)
      .email,
  );
  assert.ok(
    validatePersonal({ ...validPersonal, email: "maria@correo" }, TODAY).email,
  );
});

test("vehículo válido; la placa se pasa a mayúsculas antes de validar", () => {
  assert.equal(normalizePlate(" abc-123 "), "ABC123");
  assert.deepEqual(validateVehicle(validVehicle, TODAY), {});
  assert.ok(validateVehicle({ ...validVehicle, plate: "AB1234" }, TODAY).plate);
});

test("año de 4 dígitos y no mayor al actual", () => {
  assert.ok(validateVehicle({ ...validVehicle, year: "2027" }, TODAY).year);
  assert.ok(validateVehicle({ ...validVehicle, year: "20" }, TODAY).year);
});

test("XL exige mínimo 6 pasajeros", () => {
  assert.ok(
    validateVehicle({ ...validVehicle, category: "xl", capacity: "5" }, TODAY)
      .capacity,
  );
  assert.equal(
    validateVehicle({ ...validVehicle, category: "xl", capacity: "6" }, TODAY)
      .capacity,
    undefined,
  );
});

test("marca y modelo máximo 30 y foto obligatoria", () => {
  assert.ok(
    validateVehicle({ ...validVehicle, brand: "x".repeat(31) }, TODAY).brand,
  );
  assert.ok(validateVehicle({ ...validVehicle, photo: "" }, TODAY).photo);
});
