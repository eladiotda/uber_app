import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_PERSONAL, EMPTY_VEHICLE, validatePersonal, validateVehicle } from '../utils/validations';

const LANGUAGE_KEY = 'uberclone:language'; // AsyncStorage solo guarda preferencias, nunca datos sensibles.
const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  const [personal, setPersonal] = useState(EMPTY_PERSONAL);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [touched, setTouched] = useState({}); // { 'personal.fullName': true, ... }
  const [revealed, setRevealed] = useState({ personal: false, vehicle: false });

  // Los errores se recalculan solo cuando cambian los datos.
  const personalErrors = useMemo(() => validatePersonal(personal), [personal]);
  const vehicleErrors = useMemo(() => validateVehicle(vehicle), [vehicle]);

  // Recupera el idioma preferido al abrir la app.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((language) => {
        if (active && language) setPersonal((current) => ({ ...current, language }));
      })
      .catch(() => {});
    return () => {
      active = false; // limpieza: evita actualizar el estado si el componente ya no existe
    };
  }, []);

  const updatePersonal = useCallback((field, value) => {
    setPersonal((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [`personal.${field}`]: true }));
    if (field === 'language') AsyncStorage.setItem(LANGUAGE_KEY, value).catch(() => {});
  }, []);

  const updateVehicle = useCallback((field, value) => {
    setVehicle((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [`vehicle.${field}`]: true }));
  }, []);

  // Muestra todos los errores de una pestaña (al tocar Continuar o Guardar).
  const revealErrors = useCallback((section) => {
    setRevealed((current) => ({ ...current, [section]: true }));
  }, []);

  // Carga datos guardados previamente (por ejemplo, desde la base de datos).
  const loadSaved = useCallback((saved) => {
    if (saved?.personal) setPersonal({ ...EMPTY_PERSONAL, ...saved.personal });
    if (saved?.vehicle) setVehicle({ ...EMPTY_VEHICLE, ...saved.vehicle });
  }, []);

  const value = useMemo(() => {
    const errors = { personal: personalErrors, vehicle: vehicleErrors };
    // Un error se muestra si el campo ya se tocó o si se pidió revisar toda la pestaña.
    const errorFor = (section, field) =>
      revealed[section] || touched[`${section}.${field}`] ? errors[section][field] : undefined;

    return {
      personal,
      vehicle,
      errors,
      revealed,
      errorFor,
      updatePersonal,
      updateVehicle,
      revealErrors,
      loadSaved,
    };
  }, [personal, vehicle, personalErrors, vehicleErrors, revealed, touched, updatePersonal, updateVehicle, revealErrors, loadSaved]);

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration debe usarse dentro de <RegistrationProvider>.');
  return context;
}
