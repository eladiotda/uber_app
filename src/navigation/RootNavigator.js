import { useCallback, useState } from 'react';
import { useRegistration } from '../context/RegistrationContext';
import RegistrationTabs from './RegistrationTabs';
import AppDrawer from './AppDrawer';
import PendingScreen from '../screens/PendingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

export default function RootNavigator() {
  const { status } = useRegistration();
  // Cada vez que se abre la app, un conductor sin registro completo ve primero la Bienvenida.
  const [registering, setRegistering] = useState(false);
  const startRegistration = useCallback(() => setRegistering(true), []);
  const backToWelcome = useCallback(() => setRegistering(false), []);

  if (status === 'approved') return <AppDrawer />;
  if (status === 'pending') return <PendingScreen />;
  if (!registering) return <WelcomeScreen hasDraft={status === 'draft'} onStart={startRegistration} />;
  return <RegistrationTabs onBack={backToWelcome} />;
}