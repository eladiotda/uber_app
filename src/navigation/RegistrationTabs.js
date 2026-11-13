import { Pressable, StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import PersonalScreen from "../screens/PersonalScreen";
import VehicleScreen from "../screens/VehicleScreen";
import DocumentsScreen from "../screens/DocumentsScreen";
import { useRegistration } from "../context/RegistrationContext";
import { hasErrors } from "../utils/validations";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

// Ícono de la pestaña: número del paso o ícono de check cuando la sección está completa y válida.
function StepIcon({ step, done, color }) {
  return (
    <View
      style={[
        styles.icon,
        { borderColor: done ? colors.accent : color },
        done && styles.iconDone,
      ]}
    >
      {done ? (
        <Ionicons name="checkmark" size={14} color="#fff" />
      ) : (
        <Text style={[styles.iconText, { color }]}>{step}</Text>
      )}
    </View>
  );
}

// AI-assisted: see docs/AI_LOG.md #N
// Botón del encabezado para volver a la pantalla de Bienvenida (lo escrito no se pierde).
function BackToWelcome({ onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver a la bienvenida"
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.primary} />
      <Text style={styles.backText}>Inicio</Text>
    </Pressable>
  );
}

export default function RegistrationTabs({ onBack }) {
  const { errors, revealed } = useRegistration();
  const personalDone = !hasErrors(errors.personal);
  const vehicleDone = !hasErrors(errors.vehicle);
  const documentsDone = !hasErrors(errors.documents);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { fontWeight: "700" },
        sceneStyle: { backgroundColor: colors.background },
        headerLeft: onBack ? () => <BackToWelcome onPress={onBack} /> : undefined,
      }}
    >
      <Tab.Screen
        name="Personal"
        component={PersonalScreen}
        options={{
          title: "Datos personales",
          tabBarIcon: ({ color }) => (
            <StepIcon step="1" done={personalDone} color={color} />
          ),
          tabBarBadge: revealed.personal && !personalDone ? "!" : undefined,
        }}
      />
      <Tab.Screen
        name="Vehicle"
        component={VehicleScreen}
        options={{
          title: "Vehículo",
          tabBarIcon: ({ color }) => (
            <StepIcon step="2" done={vehicleDone} color={color} />
          ),
          tabBarBadge: revealed.vehicle && !vehicleDone ? "!" : undefined,
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: "Documentos",
          tabBarIcon: ({ color }) => (
            <StepIcon step="3" done={documentsDone} color={color} />
          ),
          tabBarBadge: revealed.documents && !documentsDone ? "!" : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDone: { backgroundColor: colors.accent },
  iconText: { fontSize: 12, fontWeight: "700" },
  back: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: "600", color: colors.primary },
});