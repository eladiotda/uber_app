import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RegistrationProvider, useRegistration } from './src/context/RegistrationContext';
import { TripProvider } from './src/context/TripContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';
// Mientras se carga el registro guardado se muestra un indicador, para no escribir sobre datos viejos.function Root() {
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
      <RootNavigator />
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RegistrationProvider>
          <TripProvider>
            <Root />
          </TripProvider>
        </RegistrationProvider>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  loadingText: { color: colors.muted },
});
