// Decide qué ve el conductor según el estado de su cuenta (campo status en drivers/{uid}).
//  - new / draft  -> registro con Tabs (Datos personales, Vehículo, Documentos)
//  - pending      -> Pendiente de aprobación (no puede ponerse Disponible)
//  - approved     -> app completa con Drawer (Inicio, Historial, Ganancias, Perfil)
import { useRegistration } from '../context/RegistrationContext';
import RegistrationTabs from './RegistrationTabs';
import AppDrawer from './AppDrawer';
import PendingScreen from '../screens/PendingScreen';
export default function RootNavigator() {
  const { status } = useRegistration();
  if (status === 'approved') return <AppDrawer />;
  if (status === 'pending') return <PendingScreen />;
  return <RegistrationTabs />;
}
