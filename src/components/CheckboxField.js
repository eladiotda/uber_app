// Casilla de verificación con su error debajo (no en un Alert).
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/colors";
export default function CheckboxField({ label, checked, onChange, error }) {
  return (
    <View style={styles.field}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            error && styles.boxError,
          ]}
        >
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { marginBottom: 16, gap: 6 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius / 3,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  boxError: { borderColor: colors.danger },
  check: { color: "#fff", fontWeight: "700" },
  label: { flex: 1, fontSize: 15, color: colors.text },
  error: { fontSize: 13, color: colors.danger },
});
