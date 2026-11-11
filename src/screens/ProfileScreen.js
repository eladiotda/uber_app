// Perfil y configuración (PDF sección 3): datos editables, vehículo, documentos, idioma y cierre de sesión.
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRegistration } from "../context/RegistrationContext";
import { useTrip } from "../context/TripContext";
import { Banner, Button, SelectField } from "../components/FormControls";
import { CATEGORIES, LANGUAGES } from "../config/catalogs";
import { colors, radius, spacing } from "../theme/colors";
const labelOf = (list, value) =>
  list.find((option) => option.value === value)?.label || value;
function MenuItem({ title, detail, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {detail ? <Text style={styles.itemDetail}>{detail}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
export default function ProfileScreen({ navigation }) {
  const { personal, vehicle, documents, record, updatePersonal, logout } =
    useRegistration();
  const { activeTrip } = useTrip();
  const [error, setError] = useState("");
  // El cierre de sesión se confirma con un Alert (es una confirmación, no un error de formulario).
  const confirmLogout = () => {
    if (activeTrip) {
      setError("Termina el viaje en curso antes de cerrar sesión.");
      return;
    }
    Alert.alert(
      "Cerrar sesión",
      "Con la sesión de prueba (anónima), al volver a entrar se creará un registro nuevo. ¿Quieres continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => logout().catch((e) => setError(e.message)),
        },
      ],
    );
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {personal.photo ? (
          <Image source={{ uri: personal.photo }} style={styles.avatar} />
        ) : null}
        <Text style={styles.name}>{personal.fullName}</Text>
        <Text style={styles.itemDetail}>
          {labelOf(CATEGORIES, vehicle.category)} · {vehicle.plate} · Cuenta{" "}
          {record?.status === "approved" ? "aprobada" : record?.status}
        </Text>
      </View>
      <View style={styles.card}>
        <MenuItem
          title="Datos personales"
          detail={`${personal.email} · ${personal.phone}`}
          onPress={() => navigation.navigate("EditPersonal")}
        />
        <MenuItem
          title="Vehículo"
          detail={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          onPress={() => navigation.navigate("EditVehicle")}
        />
        <MenuItem
          title="Documentos y pagos"
          detail={`Licencia vence ${documents.licenseExpiry || "—"} · SOAT vence ${documents.soatExpiry || "—"}`}
          onPress={() => navigation.navigate("EditDocuments")}
        />
      </View>
      <View style={styles.card}>
        {/* El idioma se guarda en AsyncStorage (preferencia) desde updatePersonal. */}
        <SelectField
          label="Idioma"
          value={personal.language}
          options={LANGUAGES}
          onChange={(value) => updatePersonal("language", value)}
        />
      </View>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Button title="Cerrar sesión" kind="secondary" onPress={confirmLogout} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: spacing, gap: spacing },
  header: { alignItems: "center", gap: 6 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.border,
  },
  name: { fontSize: 22, fontWeight: "700", color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    paddingHorizontal: spacing,
    paddingVertical: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  itemTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  itemDetail: { fontSize: 13, color: colors.muted },
  chevron: { fontSize: 24, color: colors.muted },
});
