import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import SimulatorScreen from "../screens/SimulatorScreen";
import EarningsScreen from "../screens/EarningsScreen";
import IncomingRequestScreen from "../screens/IncomingRequestScreen";
import TripInProgressScreen from "../screens/TripInProgressScreen";
import PaymentSummaryScreen from "../screens/PaymentSummaryScreen";
import HistoryScreen from "../screens/HistoryScreen";
import TripDetailScreen from "../screens/TripDetailScreen";
import { colors } from "../theme/colors";
import ProfileScreen from "../screens/ProfileScreen";
import PersonalScreen from "../screens/PersonalScreen";
import VehicleScreen from "../screens/VehicleScreen";
import DocumentsScreen from "../screens/DocumentsScreen";

const Drawer = createDrawerNavigator();
const TripStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const stackOptions = {
  headerTitleStyle: { fontWeight: "700" },
  contentStyle: { backgroundColor: colors.background },
};
function TripFlow() {
  return (
    <TripStack.Navigator
      screenOptions={{ ...stackOptions, headerShown: false }}
    >
      <TripStack.Screen name="Home" component={HomeScreen} />
      <TripStack.Screen
        name="IncomingRequest"
        component={IncomingRequestScreen}
        options={{ presentation: "modal", gestureEnabled: false }}
      />
      <TripStack.Screen
        name="TripInProgress"
        component={TripInProgressScreen}
        options={{ gestureEnabled: false }}
      />
      <TripStack.Screen
        name="PaymentSummary"
        component={PaymentSummaryScreen}
        options={{ gestureEnabled: false }}
      />
    </TripStack.Navigator>
  );
}
function HistoryFlow() {
  return (
    <HistoryStack.Navigator screenOptions={stackOptions}>
      <HistoryStack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <HistoryStack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: "Detalle del viaje" }}
      />
    </HistoryStack.Navigator>
  );
}

const HistoryStack = createNativeStackNavigator();

const EditPersonal = (props) => <PersonalScreen {...props} mode="profile" />;
const EditVehicle = (props) => <VehicleScreen {...props} mode="profile" />;
const EditDocuments = (props) => <DocumentsScreen {...props} mode="profile" />;
function ProfileFlow() {
  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditPersonal"
        component={EditPersonal}
        options={{ title: "Datos personales" }}
      />
      <ProfileStack.Screen
        name="EditVehicle"
        component={EditVehicle}
        options={{ title: "Vehículo" }}
      />
      <ProfileStack.Screen
        name="EditDocuments"
        component={EditDocuments}
        options={{ title: "Documentos" }}
      />
    </ProfileStack.Navigator>
  );
}

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: colors.accent,
        headerTitleStyle: { fontWeight: "700" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="Inicio" component={TripFlow} />
      <Drawer.Screen name="Historial" component={HistoryFlow} />
      <Drawer.Screen name="Ganancias" component={EarningsScreen} />
      <Drawer.Screen
        name="Perfil"
        component={ProfileFlow}
        options={{ title: "Perfil y configuración" }}
      />
      {/* Solo en desarrollo: crea solicitudes de prueba (no existe la app del pasajero). */}
      {__DEV__ ? (
        <Drawer.Screen
          name="Pruebas"
          component={SimulatorScreen}
          options={{ title: "Simular solicitud" }}
        />
      ) : null}
    </Drawer.Navigator>
  );
}
