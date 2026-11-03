// Controles reutilizables del formulario. Cada uno muestra su error DEBAJO del campo (no en un Alert).
import { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../theme/colors';
import { parseISODate, toISODate } from '../utils/validation';

// Etiqueta + contenido + mensaje de error.
export function Field({ label, error, hint, children }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            {children}
            {error ? (
                <Text style={styles.error}>{error}</Text>
            ) : hint ? (
                <Text style={styles.hint}>{hint}</Text>
            ) : null}
        </View>
    );
}

export function TextField({ label, error, hint, value, onChangeText, ...inputProps }) {
    return (
        <Field label={label} error={error} hint={hint}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={colors.disabled}
                style={[styles.input, error && styles.inputError]}
                {...inputProps}
            />
        </Field>
    );
}

// Lista desplegable: abre un modal con las opciones { value, label }.
export function SelectField({ label, error, value, options, onChange, placeholder = 'Selecciona…' }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === value);

    return (
        <Field label={label} error={error}>
            <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(true)}
                style={[styles.input, styles.selectBox, error && styles.inputError]}
            >
                <Text style={selected ? styles.value : styles.placeholder}>
                    {selected ? selected.label : placeholder}
                </Text>
                <Text style={styles.chevron}>▾</Text>
            </Pressable>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>{label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        onChange(item.value);
                                        setOpen(false);
                                    }}
                                    style={[styles.option, item.value === value && styles.optionSelected]}
                                >
                                    <Text style={styles.value}>{item.label}</Text>
                                    {item.value === value ? <Text style={styles.check}>✓</Text> : null}
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </Field>
    );
}

// Selector de fecha. Guarda el valor como texto 'AAAA-MM-DD'.
// Android: diálogo nativo. iOS: rueda en un modal. Web: se escribe la fecha.
export function DateField({ label, error, value, onChange, maximumDate }) {
    const [iosOpen, setIosOpen] = useState(false);
    const [draft, setDraft] = useState(new Date());
    const current = parseISODate(value) || maximumDate || new Date();

    if (Platform.OS === 'web') {
        return (
            <TextField
                label={label}
                error={error}
                value={value}
                onChangeText={onChange}
                placeholder="AAAA-MM-DD"
                maxLength={10}
            />
        );
    }

    const openPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: current,
                mode: 'date',
                maximumDate,
                onValueChange: (_event, date) => onChange(toISODate(date)),
            });
        } else {
            setDraft(current);
            setIosOpen(true);
        }
    };

    return (
        <Field label={label} error={error}>
            <Pressable
                accessibilityRole="button"
                onPress={openPicker}
                style={[styles.input, styles.selectBox, error && styles.inputError]}
            >
                <Text style={value ? styles.value : styles.placeholder}>{value || 'Seleccionar fecha'}</Text>
                <Text style={styles.chevron}>📅</Text>
            </Pressable>

            <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
                <View style={styles.backdrop}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>{label}</Text>
                        <DateTimePicker
                            value={draft}
                            mode="date"
                            display="spinner"
                            themeVariant="light"
                            maximumDate={maximumDate}
                            onValueChange={(_event, date) => setDraft(date)}
                        />
                        <Button
                            title="Listo"
                            onPress={() => {
                                onChange(toISODate(draft));
                                setIosOpen(false);
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </Field>
    );
}

export function Button({ title, onPress, kind = 'primary', disabled = false, loading = false }) {
    const isPrimary = kind === 'primary';
    return (
        <Pressable
            accessibilityRole="button"
            disabled={disabled || loading}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
                (disabled || loading) && styles.buttonDisabled,
                pressed && { opacity: 0.8 },
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? '#fff' : colors.primary} />
            ) : (
                <Text style={[styles.buttonText, !isPrimary && { color: colors.primary }]}>{title}</Text>
            )}
        </Pressable>
    );
}

// Aviso dentro de la pantalla: tone = 'info' | 'success' | 'warning' | 'danger'.
export function Banner({ tone = 'info', children }) {
    const background = {
        info: colors.surface,
        success: colors.accentSoft,
        warning: colors.warningSoft,
        danger: colors.dangerSoft,
    }[tone];
    return (
        <View style={[styles.banner, { backgroundColor: background }]}>
            <Text style={[styles.bannerText, tone === 'danger' && { color: colors.danger }]}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    field: { marginBottom: spacing, gap: 6 },
    label: { fontSize: 15, fontWeight: '600', color: colors.text },
    hint: { fontSize: 13, color: colors.muted },
    error: { fontSize: 13, color: colors.danger },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text,
    },
    inputError: { borderColor: colors.danger },
    selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    value: { fontSize: 16, color: colors.text },
    placeholder: { fontSize: 16, color: colors.disabled },
    chevron: { fontSize: 16, color: colors.muted },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: spacing,
        paddingBottom: spacing * 2,
        maxHeight: '70%',
        gap: 8,
    },
    sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, color: colors.text },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    optionSelected: { backgroundColor: colors.accentSoft },
    check: { color: colors.accent, fontWeight: '700' },
    button: { borderRadius: radius, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    buttonPrimary: { backgroundColor: colors.primary },
    buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    buttonDisabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    banner: { borderRadius: radius, padding: 12, marginBottom: spacing, borderWidth: 1, borderColor: colors.border },
    bannerText: { fontSize: 14, color: colors.text },
});
