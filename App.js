import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RegistrationProvider } from './src/context/RegistrationContext';
import RegistrationTabs from './src/context/RegistrationTabs';

export default function App() {
  return (
    <SafeAreaProvider>
      <RegistrationProvider>
        <NavigationContainer>
          <RegistrationTabs />
        </NavigationContainer>
      </RegistrationProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
