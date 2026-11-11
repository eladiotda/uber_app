// Navegación combinada (PDF sección 1.8):
//  Drawer -> perfil, historial, ganancias y configuración
//  Stack  -> flujo del viaje (Inicio -> Solicitud -> Viaje en curso -> Cobro)
// VERSIÓN FASE 2: en las fases 3 y 4 cada integrante agrega aquí las líneas de sus pantallas.
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SimulatorScreen from '../screens/SimulatorScreen';
import EarningsScreen from '../screens/EarningsScreen';
// [FASE 3 - Andrés] imports de IncomingRequestScreen y TripInProgressScreen
// [FASE 3 - Vaner]  import de EarningsScreen
// [FASE 4 - Eladio] import de PaymentSummaryScreen
// [FASE 4 - Vaner]  imports de HistoryScreen y TripDetailScreen
// [FASE 4 - Andrés] imports de ProfileScreen, PersonalScreen, VehicleScreen y DocumentsScreen
import { colors } from '../theme/colors';
const Drawer = createDrawerNavigator();
const TripStack = createNativeStackNavigator();
const stackOptions = { headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: colors.background } };
function TripFlow() {
  return (
    <TripStack.Navigator screenOptions={{ ...stackOptions, headerShown: false }}>
      <TripStack.Screen name="Home" component={HomeScreen} />
      {/* [FASE 3 - Andrés] IncomingRequest y TripInProgress */}
      {/* [FASE 4 - Eladio] PaymentSummary */}
    </TripStack.Navigator>
  );
}
// [FASE 4 - Vaner]  function HistoryFlow() { ... }
// [FASE 4 - Andrés] function ProfileFlow() { ... }
export default function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: colors.accent,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="Inicio" component={TripFlow} />
      {/* [FASE 4 - Vaner]  Historial */}
      <Drawer.Screen name="Ganancias" component={EarningsScreen} />
      {/* [FASE 4 - Andrés] Perfil */}
      {/* Solo en desarrollo: crea solicitudes de prueba (no existe la app del pasajero). */}
      {__DEV__ ? <Drawer.Screen name="Pruebas" component={SimulatorScreen} options={{ title: 'Simular solicitud' }} /> : null}
    </Drawer.Navigator>
  );
}
