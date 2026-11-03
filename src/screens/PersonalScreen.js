import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme/colors';

export default function PersonalScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pestaña 1 · Datos personales</Text>
      <Text style={styles.text}>Aquí va el formulario de datos personales.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  text: { color: colors.muted },
});
