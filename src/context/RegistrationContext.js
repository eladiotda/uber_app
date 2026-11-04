import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMPTY_PERSONAL,
  EMPTY_VEHICLE,
  hasErrors,
  validatePersonal,
  validateVehicle,
} from '../utils/validations';
import { getDriverId, isFirebaseConfigured } from '../services/firebase';
import { compressImage } from '../services/photos';
import { loadDriver, saveDriverDraft, toForm } from '../services/driverRepository';

const LANGUAGE_KEY = 'uberclone:language'; // AsyncStorage solo guarda preferencias, nunca datos sensibles.
const RegistrationContext = createContext(null);

export function RegistrationProvider({ children }) {
  const [personal, setPersonal] = useState(EMPTY_PERSONAL);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [touched, setTouched] = useState({}); // { 'personal.fullName': true, ... }
  const [revealed, setRevealed] = useState({ personal: false, vehicle: false });

  // Sesión y guardado
  const [driverId, setDriverId] = useState('');
  const [record, setRecord] = useState(null); // documento guardado en Firestore
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const servicesReady = isFirebaseConfigured;

  // Los errores se recalculan solo cuando cambian los datos.
  const personalErrors = useMemo(() => validatePersonal(personal), [personal]);
  const vehicleErrors = useMemo(() => validateVehicle(vehicle), [vehicle]);

  // Carga datos guardados previamente (desde la base de datos).
  const loadSaved = useCallback((saved) => {
    if (saved?.personal) setPersonal({ ...EMPTY_PERSONAL, ...saved.personal });
    if (saved?.vehicle) setVehicle({ ...EMPTY_VEHICLE, ...saved.vehicle });
  }, []);

  // Al abrir la app: idioma preferido + sesión anónima + registro guardado (si existe).
  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((language) => {
        if (active && language) setPersonal((current) => ({ ...current, language }));
      })
      .catch(() => { });

    if (isFirebaseConfigured) {
      (async () => {
        try {
          const uid = await getDriverId();
          const saved = await loadDriver(uid);
          if (!active) return;
          setDriverId(uid);
          if (saved) {
            loadSaved(toForm(saved));
            setRecord(saved);
          }
        } catch (error) {
          if (active) setSaveError(`No se pudo cargar el registro: ${error.message}`);
        } finally {
          if (active) setLoading(false);
        }
      })();
    }

    return () => {
      active = false; // limpieza: evita actualizar el estado si el componente ya no existe
    };
  }, [loadSaved]);

  const updatePersonal = useCallback((field, value) => {
    setPersonal((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [`personal.${field}`]: true }));
    if (field === 'language') AsyncStorage.setItem(LANGUAGE_KEY, value).catch(() => { });
  }, []);

  const updateVehicle = useCallback((field, value) => {
    setVehicle((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [`vehicle.${field}`]: true }));
  }, []);

  // Muestra todos los errores de una pestaña (al tocar Continuar o Guardar).
  const revealErrors = useCallback((section) => {
    setRevealed((current) => ({ ...current, [section]: true }));
  }, []);

  // Valida las dos pestañas, comprime las fotos y guarda todo en Firestore.
  const save = useCallback(async () => {
    setRevealed({ personal: true, vehicle: true });
    setSaveError('');
    if (hasErrors(personalErrors) || hasErrors(vehicleErrors)) return false;

    setSaving(true);
    try {
      const uid = driverId || (await getDriverId());
      const [profilePhoto, vehiclePhoto] = await Promise.all([
        compressImage(personal.photo),
        compressImage(vehicle.photo),
      ]);
      const savedPersonal = { ...personal, photo: profilePhoto };
      const savedVehicle = { ...vehicle, photo: vehiclePhoto };
      const saved = await saveDriverDraft(uid, savedPersonal, savedVehicle);

      setDriverId(uid);
      setPersonal(savedPersonal); // la foto ahora es la versión comprimida guardada
      setVehicle(savedVehicle);
      setRecord(saved);
      return true;
    } catch (error) {
      setSaveError(error.message || 'No se pudo guardar el registro.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [driverId, personal, vehicle, personalErrors, vehicleErrors]);

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
      driverId,
      record,
      loading,
      saving,
      saveError,
      servicesReady,
      save,
    };
  }, [
    personal, vehicle, personalErrors, vehicleErrors, revealed, touched, updatePersonal, updateVehicle,
    revealErrors, loadSaved, driverId, record, loading, saving, saveError, servicesReady, save,
  ]);

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration debe usarse dentro de <RegistrationProvider>.');
  return context;
}