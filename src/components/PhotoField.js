// Foto desde cámara o galería. Guarda la "uri" de la imagen; la subida a la nube ocurre al guardar.
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Field } from './FormControls';
import { colors, radius } from '../theme/colors';

export default function PhotoField({ label, hint, error, value, onChange, shape = 'rect' }) {
    const [message, setMessage] = useState('');

    async function pick(fromCamera) {
        setMessage('');
        try {
            const permission = fromCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                setMessage(`Debes permitir el acceso a la ${fromCamera ? 'cámara' : 'galería'}.`);
                return;
            }
            const options = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true };
            const result = fromCamera
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);
            if (!result.canceled && result.assets?.[0]?.uri) onChange(result.assets[0].uri);
        } catch (pickError) {
            setMessage(pickError?.message || 'No se pudo cargar la imagen. Intenta de nuevo.');
        }
    }

    const round = shape === 'round';
    return (
        <Field label={label} error={error || message} hint={hint}>
            <View style={styles.row}>
                {value ? (
                    <Image
                        source={{ uri: value }}
                        accessibilityLabel={label}
                        style={[styles.preview, round && styles.round]}
                    />
                ) : (
                    <View style={[styles.preview, styles.empty, round && styles.round, error && styles.emptyError]}>
                        <Text style={styles.emptyText}>Sin foto</Text>
                    </View>
                )}
                <View style={styles.actions}>
                    {Platform.OS !== 'web' && (
                        <Pressable style={styles.action} onPress={() => pick(true)}>
                            <Text style={styles.actionText}>📷 Tomar foto</Text>
                        </Pressable>
                    )}
                    <Pressable style={styles.action} onPress={() => pick(false)}>
                        <Text style={styles.actionText}>🖼️ Galería</Text>
                    </Pressable>
                </View>
            </View>
        </Field>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    preview: { width: 110, height: 84, borderRadius: radius, backgroundColor: colors.border },
    round: { width: 90, height: 90, borderRadius: 45 },
    empty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.muted, backgroundColor: colors.surface },
    emptyError: { borderColor: colors.danger },
    emptyText: { color: colors.muted, fontSize: 12 },
    actions: { flex: 1, gap: 8 },
    action: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingVertical: 10, alignItems: 'center' },
    actionText: { color: colors.text, fontWeight: '500' },
});
