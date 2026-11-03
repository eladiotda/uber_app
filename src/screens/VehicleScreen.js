// Pestaña 2 — Vehículo. La placa se pasa a mayúsculas antes de validar; XL exige mínimo 6 pasajeros.
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useRegistration } from '../context/RegistrationContext';
import { Banner, Button, SelectField, TextField } from '../components/FormControls';
import PhotoField from '../components/PhotoField';
import { CATEGORIES, LIMITS, VEHICLE_COLORS } from '../config/catalogs';
import { hasErrors, minCapacityFor, normalizePlate } from '../utils/validations';
import { colors, spacing } from '../theme/colors';

const onlyDigits = (text) => text.replace(/\D/g, '');

export default function VehicleScreen({ navigation }) {
  const { vehicle, errors, revealed, errorFor, updateVehicle, revealErrors } = useRegistration();
  const error = (field) => errorFor('vehicle', field);

  const goNext = () => {
    revealErrors('vehicle');
    navigation.navigate('Documents');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tu vehículo</Text>
        <Text style={styles.subtitle}>Todos los campos son obligatorios.</Text>

        {revealed.vehicle && hasErrors(errors.vehicle) ? (
          <Banner tone="danger">Revisa los campos marcados en rojo.</Banner>
        ) : null}

        <SelectField
          label="Categoría"
          value={vehicle.category}
          options={CATEGORIES}
          onChange={(value) => updateVehicle('category', value)}
          error={error('category')}
        />

        <TextField
          label="Placa"
          value={vehicle.plate}
          onChangeText={(text) => updateVehicle('plate', normalizePlate(text))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          placeholder="ABC123"
          hint="Formato colombiano: 3 letras y 3 números"
          error={error('plate')}
        />

        <TextField
          label="Marca"
          value={vehicle.brand}
          onChangeText={(text) => updateVehicle('brand', text)}
          maxLength={LIMITS.brandMax}
          placeholder="Ej. Renault"
          error={error('brand')}
        />

        <TextField
          label="Modelo"
          value={vehicle.model}
          onChangeText={(text) => updateVehicle('model', text)}
          maxLength={LIMITS.modelMax}
          placeholder="Ej. Logan"
          error={error('model')}
        />

        <TextField
          label="Año"
          value={vehicle.year}
          onChangeText={(text) => updateVehicle('year', onlyDigits(text))}
          keyboardType="number-pad"
          maxLength={4}
          placeholder={String(new Date().getFullYear())}
          error={error('year')}
        />

        <SelectField
          label="Color"
          value={vehicle.color}
          options={VEHICLE_COLORS}
          onChange={(value) => updateVehicle('color', value)}
          error={error('color')}
        />

        <TextField
          label="Capacidad de pasajeros"
          value={vehicle.capacity}
          onChangeText={(text) => updateVehicle('capacity', onlyDigits(text))}
          keyboardType="number-pad"
          maxLength={2}
          placeholder={`Mínimo ${minCapacityFor(vehicle.category)}`}
          hint={vehicle.category === 'xl' ? 'XL exige mínimo 6 pasajeros' : undefined}
          error={error('capacity')}
        />

        <PhotoField
          label="Foto del vehículo"
          hint="Debe verse la placa"
          value={vehicle.photo}
          onChange={(uri) => updateVehicle('photo', uri)}
          error={error('photo')}
        />

        <Button title="Continuar" onPress={goNext} />
        <Button title="Volver a Datos personales" kind="secondary" onPress={() => navigation.navigate('Personal')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing, paddingBottom: spacing * 3 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing },
});
