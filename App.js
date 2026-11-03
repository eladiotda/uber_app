import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RegistrationProvider, useRegistration } from './src/context/RegistrationContext';
import RegistrationTabs from './src/context/RegistrationTabs';
import { colors } from './src/theme/colors';

// Mientras se carga el registro guardado se muestra un indicador, para no escribir sobre datos viejos.
function Root() {
  const { loading } = useRegistration();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tu registro…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RegistrationTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <RegistrationProvider>
        <Root />
      </RegistrationProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  loadingText: { color: colors.muted },
});