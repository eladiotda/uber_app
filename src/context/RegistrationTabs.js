import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PersonalScreen from '../screens/PersonalScreen';
import VehicleScreen from '../screens/VehicleScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import { useRegistration } from '../context/RegistrationContext';
import { hasErrors } from '../utils/validations';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

// Ícono de la pestaña: número del paso o ✓ cuando la sección está completa y válida.
function StepIcon({ step, done, color }) {
  return (
    <View style={[styles.icon, { borderColor: done ? colors.accent : color }, done && styles.iconDone]}>
      <Text style={[styles.iconText, { color: done ? '#fff' : color }]}>{done ? '✓' : step}</Text>
    </View>
  );
}

export default function RegistrationTabs() {
  const { errors, revealed } = useRegistration();
  const personalDone = !hasErrors(errors.personal);
  const vehicleDone = !hasErrors(errors.vehicle);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen
        name="Personal"
        component={PersonalScreen}
        options={{
          title: 'Datos personales',
          tabBarIcon: ({ color }) => <StepIcon step="1" done={personalDone} color={color} />,
          tabBarBadge: revealed.personal && !personalDone ? '!' : undefined,
        }}
      />
      <Tab.Screen
        name="Vehicle"
        component={VehicleScreen}
        options={{
          title: 'Vehículo',
          tabBarIcon: ({ color }) => <StepIcon step="2" done={vehicleDone} color={color} />,
          tabBarBadge: revealed.vehicle && !vehicleDone ? '!' : undefined,
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: 'Documentos',
          tabBarIcon: ({ color }) => <StepIcon step="3" done={false} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconDone: { backgroundColor: colors.accent },
  iconText: { fontSize: 12, fontWeight: '700' },
});
