import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "./src/theme/colors";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>UberClone · Conductor</Text>
      <Text style={styles.subtitle}>
        Proyecto base listo. El registro del conductor se construye en los
        siguientes commits.
      </Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing * 2,
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 16, color: colors.muted, textAlign: "center" },
});
