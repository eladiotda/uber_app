import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMPTY_DOCUMENTS,
  EMPTY_PERSONAL,
  EMPTY_VEHICLE,
  hasErrors,
  validateDocuments,
  validatePersonal,
  validateVehicle,
} from '../utils/validations';
import { getDriverId, isFirebaseConfigured, signOutDriver } from '../services/firebase';
import { compressImage } from '../services/photos';
import {
  loadDriverFiles,
  saveDriverDocuments,
  saveDriverDraft,
  toForm,
  watchDriver,
} from '../services/driverRepository';
const LANGUAGE_KEY = 'uberclone:language'; // AsyncStorage solo guarda preferencias, nunca datos sensibles.
const AVAILABILITY_KEY = 'uberclone:lastAvailable';
const RegistrationContext = createContext(null);
export function RegistrationProvider({ children }) {
  const [personal, setPersonal] = useState(EMPTY_PERSONAL);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [documents, setDocuments] = useState(EMPTY_DOCUMENTS);
  const [touched, setTouched] = useState({}); // { 'personal.fullName': true, ... }
  const [revealed, setRevealed] = useState({ personal: false, vehicle: false, documents: false });
  // Sesión y guardado
  const [driverId, setDriverId] = useState('');
  const [record, setRecord] = useState(null); // documento guardado en Firestore (se actualiza en tiempo real)
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [sessionKey, setSessionKey] = useState(0); // cambia al cerrar sesión para iniciar una nueva
  const formLoaded = useRef(false);
  const servicesReady = isFirebaseConfigured;
  // Los errores se recalculan solo cuando cambian los datos.
  const personalErrors = useMemo(() => validatePersonal(personal), [personal]);
  const vehicleErrors = useMemo(() => validateVehicle(vehicle), [vehicle]);
  const documentErrors = useMemo(() => validateDocuments(documents, vehicle.year), [documents, vehicle.year]);
  // Carga datos guardados previamente (desde la base de datos).
  const loadSaved = useCallback((saved) => {
    if (saved?.personal) setPersonal({ ...EMPTY_PERSONAL, ...saved.personal });
    if (saved?.vehicle) setVehicle({ ...EMPTY_VEHICLE, ...saved.vehicle });
    if (saved?.documents) setDocuments({ ...EMPTY_DOCUMENTS, ...saved.documents });
  }, []);
  // Idioma preferido (solo una vez).
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((language) => {
        if (language) setPersonal((current) => ({ ...current, language }));
      })
      .catch(() => {});
  }, []);
  // Sesión anónima + registro guardado, escuchado en tiempo real (así se ve cuando lo aprueban).
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    let active = true;
    let unsubscribe = () => {};
    formLoaded.current = false;
    (async () => {
      try {
        const uid = await getDriverId();
        if (!active) return;
        setDriverId(uid);
        unsubscribe = watchDriver(
          uid,
          async (saved) => {
            if (!active) return;
            setRecord(saved);
            // El formulario se llena solo la primera vez, para no borrar lo que el conductor está escribiendo.
            if (saved && !formLoaded.current) {
              formLoaded.current = true;
              const files = await loadDriverFiles(uid).catch(() => ({}));
              if (active) loadSaved(toForm(saved, files));
            }
            if (active) setLoading(false);
          },
          (error) => {
            if (active) {
              setSaveError(`No se pudo cargar el registro: ${error.message}`);
              setLoading(false);
            }
          },
        );
      } catch (error) {
        if (active) {
          setSaveError(`No se pudo iniciar la sesión: ${error.message}`);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false; // limpieza: deja de escuchar Firestore y evita actualizar un componente desmontado
      unsubscribe();
    };
  }, [loadSaved, sessionKey]);
  const updatePersonal = useCallback((field, value) => {
    setPersonal((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [`personal.${field}`]: true }));
    if (field === 'language') AsyncStorage.setItem(LANGUAGE_KEY, value).catch(() => {});
  }, []);
  const updateVehicle = useCallback((field, value) => {
    setVehicle((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [`vehicle.${field}`]: true }));
  }, []);
  const updateDocuments = useCallback((field, value) => {
    setDocuments((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [`documents.${field}`]: true }));
  }, []);
  // Muestra todos los errores de una pestaña (al tocar Continuar o Guardar).
  const revealErrors = useCallback((section) => {
    setRevealed((current) => ({ ...current, [section]: true }));
  }, []);
  // Valida las pestañas 1 y 2, comprime las fotos y guarda todo en Firestore.
  const save = useCallback(async () => {
    setRevealed((current) => ({ ...current, personal: true, vehicle: true }));
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
      setRecord((current) => current || saved);
      formLoaded.current = true;
      return true;
    } catch (error) {
      setSaveError(error.message || 'No se pudo guardar el registro.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [driverId, personal, vehicle, personalErrors, vehicleErrors]);
  // Pestaña 3. submit = true -> "Enviar registro": guarda todo y pasa a Pendiente de aprobación.
  // submit = false -> solo guarda cambios de documentos (desde Perfil).
  const saveDocuments = useCallback(
    async ({ submit = false } = {}) => {
      setRevealed({ personal: true, vehicle: true, documents: true });
      setSaveError('');
      if (hasErrors(personalErrors) || hasErrors(vehicleErrors) || hasErrors(documentErrors)) return false;
      setSaving(true);
      try {
        // Las pestañas 1 y 2 se guardan primero (crea el documento si aún no existe).
        const uid = driverId || (await getDriverId());
        const [profilePhoto, vehiclePhoto, license, soat, rtm] = await Promise.all([
          compressImage(personal.photo),
          compressImage(vehicle.photo),
          compressImage(documents.licensePhoto),
          compressImage(documents.soatPhoto),
          documents.rtmPhoto ? compressImage(documents.rtmPhoto) : Promise.resolve(''),
        ]);
        const savedPersonal = { ...personal, photo: profilePhoto };
        const savedVehicle = { ...vehicle, photo: vehiclePhoto };
        await saveDriverDraft(uid, savedPersonal, savedVehicle);
        await saveDriverDocuments(uid, documents, { license, soat, rtm }, { submit });
        setDriverId(uid);
        setPersonal(savedPersonal);
        setVehicle(savedVehicle);
        setDocuments((current) => ({ ...current, licensePhoto: license, soatPhoto: soat, rtmPhoto: rtm }));
        formLoaded.current = true;
        return true;
      } catch (error) {
        setSaveError(error.message || 'No se pudo guardar el registro.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [driverId, personal, vehicle, documents, personalErrors, vehicleErrors, documentErrors],
  );
  // Cerrar sesión: borra el estado local y crea una sesión anónima nueva.
  const logout = useCallback(async () => {
    await signOutDriver();
    await AsyncStorage.removeItem(AVAILABILITY_KEY).catch(() => {});
    setPersonal(EMPTY_PERSONAL);
    setVehicle(EMPTY_VEHICLE);
    setDocuments(EMPTY_DOCUMENTS);
    setTouched({});
    setRevealed({ personal: false, vehicle: false, documents: false });
    setRecord(null);
    setDriverId('');
    setLoading(true);
    setSessionKey((key) => key + 1);
  }, []);
  const value = useMemo(() => {
    const errors = { personal: personalErrors, vehicle: vehicleErrors, documents: documentErrors };
    // Un error se muestra si el campo ya se tocó o si se pidió revisar toda la pestaña.
    const errorFor = (section, field) =>
      revealed[section] || touched[`${section}.${field}`] ? errors[section][field] : undefined;
    return {
      personal,
      vehicle,
      documents,
      errors,
      revealed,
      errorFor,
      updatePersonal,
      updateVehicle,
      updateDocuments,
      revealErrors,
      loadSaved,
      driverId,
      record,
      status: record?.status || 'new',
      loading,
      saving,
      saveError,
      servicesReady,
      save,
      saveDocuments,
      logout,
    };
  }, [
    personal, vehicle, documents, personalErrors, vehicleErrors, documentErrors, revealed, touched,
    updatePersonal, updateVehicle, updateDocuments, revealErrors, loadSaved, driverId, record, loading,
    saving, saveError, servicesReady, save, saveDocuments, logout,
  ]);
  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}
export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration debe usarse dentro de <RegistrationProvider>.');
  return context;
}
export { AVAILABILITY_KEY };
