import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useRegistration } from "../context/RegistrationContext";
import {
  Banner,
  Button,
  DateField,
  SelectField,
  TextField,
} from "../components/FormControls";
import PhotoField from "../components/PhotoField";
import { GENDERS, LANGUAGES, LIMITS } from "../config/catalogs";
import { hasErrors, latestAdultBirthDate } from "../utils/validations";
import { colors, spacing } from "../theme/colors";

const onlyDigits = (text) => text.replace(/\D/g, "");

export default function PersonalScreen({ navigation }) {
  const { personal, errors, revealed, errorFor, updatePersonal, revealErrors } =
    useRegistration();
  const error = (field) => errorFor("personal", field);

  // "Continuar" siempre deja avanzar, pero antes muestra los errores pendientes de esta pestaña.
  const goNext = () => {
    revealErrors("personal");
    navigation.navigate("Vehicle");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Cuéntanos quién eres</Text>
        <Text style={styles.subtitle}>Todos los campos son obligatorios.</Text>

        {revealed.personal && hasErrors(errors.personal) ? (
          <Banner tone="danger">Revisa los campos marcados en rojo.</Banner>
        ) : null}

        <PhotoField
          label="Foto de perfil"
          shape="round"
          value={personal.photo}
          onChange={(uri) => updatePersonal("photo", uri)}
          error={error("photo")}
        />

        <TextField
          label="Nombre completo"
          value={personal.fullName}
          onChangeText={(text) => updatePersonal("fullName", text)}
          maxLength={LIMITS.nameMax}
          autoCapitalize="words"
          placeholder="Ej. María José Pérez"
          hint={`${personal.fullName.length}/${LIMITS.nameMax} · solo letras y espacios`}
          error={error("fullName")}
        />

        <TextField
          label="Documento de identidad"
          value={personal.documentId}
          onChangeText={(text) =>
            updatePersonal("documentId", onlyDigits(text))
          }
          keyboardType="number-pad"
          maxLength={10}
          placeholder="Entre 6 y 10 dígitos"
          error={error("documentId")}
        />

        <TextField
          label="Número de celular"
          value={personal.phone}
          onChangeText={(text) => updatePersonal("phone", onlyDigits(text))}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="3001234567"
          error={error("phone")}
        />

        <DateField
          label="Fecha de nacimiento"
          value={personal.birthDate}
          onChange={(date) => updatePersonal("birthDate", date)}
          maximumDate={latestAdultBirthDate()}
          error={error("birthDate")}
        />

        <SelectField
          label="Género"
          value={personal.gender}
          options={GENDERS}
          onChange={(value) => updatePersonal("gender", value)}
          error={error("gender")}
        />

        <TextField
          label="Correo electrónico"
          value={personal.email}
          onChangeText={(text) => updatePersonal("email", text.trim())}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="nombre@correo.com"
          error={error("email")}
        />

        <SelectField
          label="Idioma"
          value={personal.language}
          options={LANGUAGES}
          onChange={(value) => updatePersonal("language", value)}
          error={error("language")}
        />

        <Button title="Continuar a Vehículo" onPress={goNext} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing, paddingBottom: spacing * 3 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing },
});
