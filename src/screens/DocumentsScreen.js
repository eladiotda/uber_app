import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRegistration } from "../context/RegistrationContext";
import { hasErrors, rtmRequired, tomorrow } from "../utils/validations";
import {
  Banner,
  Button,
  DateField,
  SelectField,
  TextField,
} from "../components/FormControls";
import PhotoField from "../components/PhotoField";
import CheckboxField from "../components/CheckboxField";
import { LICENSE_CATEGORIES } from "../config/catalogs";
import { COMMISSION_LABEL } from "../config/pricing";
import { colors, radius, spacing } from "../theme/colors";
const STATUS_LABELS = {
  new: "Sin guardar",
  draft: "Borrador",
  pending: "Pendiente de aprobación",
  approved: "Aprobado",
};
const onlyDigits = (text) => text.replace(/\D/g, "");
function StepRow({ title, errors }) {
  const pending = Object.keys(errors).length;
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text
        style={[
          styles.rowStatus,
          { color: pending ? colors.danger : colors.accent },
        ]}
      >
        {pending ? `${pending} pendiente(s)` : "✓ Completa"}
      </Text>
    </View>
  );
}
// mode = 'register' (pestaña 3 del registro) o 'profile' (editar documentos desde Perfil).
export default function DocumentsScreen({ navigation, mode = "register" }) {
  const {
    documents,
    vehicle,
    errors,
    revealed,
    errorFor,
    updateDocuments,
    revealErrors,
    saveDocuments,
    saving,
    saveError,
    servicesReady,
    status,
  } = useRegistration();
  const error = (field) => errorFor("documents", field);
  const needsRtm = rtmRequired(vehicle.year);
  const allValid =
    !hasErrors(errors.personal) &&
    !hasErrors(errors.vehicle) &&
    !hasErrors(errors.documents);
  const isProfile = mode === "profile";
  const alreadySent = status === "pending" || status === "approved";
  const onSubmit = async () => {
    revealErrors("documents");
    const ok = await saveDocuments({
      submit: !isProfile && status !== "approved",
    });
    if (ok && isProfile) navigation.goBack();
  };
  return (
    // En Android (edge-to-edge, SDK 58) la pantalla no se encoge con el teclado:
    // "padding" en ambas plataformas evita que el teclado tape los campos de abajo.
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {!isProfile ? (
          <>
            <Text style={styles.title}>Avance del registro</Text>
            <View style={styles.card}>
              <StepRow title="1. Datos personales" errors={errors.personal} />
              <StepRow title="2. Vehículo" errors={errors.vehicle} />
              <StepRow
                title="3. Documentos y pagos"
                errors={errors.documents}
              />
              <Text style={styles.detail}>
                Estado: {STATUS_LABELS[status] || status}
              </Text>
            </View>
          </>
        ) : null}
        {revealed.documents && hasErrors(errors.documents) ? (
          <Banner tone="danger">Revisa los campos marcados en rojo.</Banner>
        ) : null}
        <Text style={styles.section}>Licencia de conducción</Text>
        <TextField
          label="Número de licencia"
          value={documents.licenseNumber}
          onChangeText={(text) =>
            updateDocuments("licenseNumber", onlyDigits(text))
          }
          keyboardType="number-pad"
          maxLength={12}
          placeholder="Entre 6 y 12 dígitos"
          error={error("licenseNumber")}
        />
        <SelectField
          label="Categoría"
          value={documents.licenseCategory}
          options={LICENSE_CATEGORIES}
          onChange={(value) => updateDocuments("licenseCategory", value)}
          error={error("licenseCategory")}
        />
        <DateField
          label="Fecha de vencimiento"
          value={documents.licenseExpiry}
          onChange={(date) => updateDocuments("licenseExpiry", date)}
          minimumDate={tomorrow()}
          error={error("licenseExpiry")}
        />
        <PhotoField
          label="Foto de la licencia"
          value={documents.licensePhoto}
          onChange={(uri) => updateDocuments("licensePhoto", uri)}
          error={error("licensePhoto")}
        />
        <Text style={styles.section}>SOAT</Text>
        <DateField
          label="Fecha de vencimiento"
          value={documents.soatExpiry}
          onChange={(date) => updateDocuments("soatExpiry", date)}
          minimumDate={tomorrow()}
          error={error("soatExpiry")}
        />
        <PhotoField
          label="Foto del SOAT"
          value={documents.soatPhoto}
          onChange={(uri) => updateDocuments("soatPhoto", uri)}
          error={error("soatPhoto")}
        />
        <Text style={styles.section}>Revisión técnico-mecánica</Text>
        {needsRtm ? (
          <>
            <DateField
              label="Fecha de vencimiento"
              value={documents.rtmExpiry}
              onChange={(date) => updateDocuments("rtmExpiry", date)}
              minimumDate={tomorrow()}
              error={error("rtmExpiry")}
            />
            <PhotoField
              label="Foto de la revisión"
              value={documents.rtmPhoto}
              onChange={(uri) => updateDocuments("rtmPhoto", uri)}
              error={error("rtmPhoto")}
            />
          </>
        ) : (
          <Banner tone="info">
            Tu vehículo es modelo {vehicle.year || "—"}: todavía no necesita
            revisión técnico-mecánica.
          </Banner>
        )}
        <Text style={styles.section}>Pagos</Text>
        <TextField
          label="Correo de tu cuenta de Mercado Pago"
          value={documents.mercadoPagoEmail}
          onChangeText={(text) =>
            updateDocuments("mercadoPagoEmail", text.trim())
          }
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="pagos@correo.com"
          hint="Aquí recibirías tus pagos. No guardamos números de cuenta ni de tarjeta."
          error={error("mercadoPagoEmail")}
        />
        <CheckboxField
          label={`Acepto los términos y condiciones y la comisión de la plataforma del ${COMMISSION_LABEL} sobre cada viaje.`}
          checked={documents.termsAccepted === true}
          onChange={(value) => updateDocuments("termsAccepted", value)}
          error={error("termsAccepted")}
        />
        {!servicesReady ? (
          <Banner tone="warning">
            Para guardar, configura Firebase en el archivo .env (ver README).
          </Banner>
        ) : null}
        {saveError ? <Banner tone="danger">{saveError}</Banner> : null}
        {!isProfile && status === "pending" ? (
          <Banner tone="success">
            Registro enviado. Tu cuenta está Pendiente de aprobación; no puedes
            ponerte Disponible hasta que la aprueben.
          </Banner>
        ) : null}
        <Button
          title={
            isProfile || alreadySent ? "Guardar cambios" : "Enviar registro"
          }
          onPress={onSubmit}
          loading={saving}
          disabled={!servicesReady || saving || !allValid}
        />
        {!allValid ? (
          <Text style={styles.hint}>
            El botón se habilita cuando las tres pestañas están completas y
            válidas.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { padding: spacing, paddingBottom: spacing * 3 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  section: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    padding: spacing,
    marginBottom: spacing,
    gap: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  rowStatus: { fontSize: 14, fontWeight: "600" },
  detail: { fontSize: 14, color: colors.muted },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
  },
});