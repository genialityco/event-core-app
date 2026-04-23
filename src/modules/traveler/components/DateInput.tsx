import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, spacing, typography } from '@/src/theme';

interface DateInputProps {
  label: string;
  value: string;
  onChangeText: (date: string) => void;
  required?: boolean;
  primary: string;
  minDate?: Date; // Fecha mínima permitida
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChangeText,
  required,
  primary,
  minDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? dayjs(value).toDate() : new Date()
  );
  const [selectedHour, setSelectedHour] = useState<number>(
    value ? dayjs(value).hour() : 12
  );
  const [selectedMinute, setSelectedMinute] = useState<number>(
    value ? dayjs(value).minute() : 0
  );
  const [displayMonth, setDisplayMonth] = useState<Date>(
    value ? dayjs(value).toDate() : new Date()
  );

  const handleConfirm = () => {
    const finalDate = dayjs(selectedDate)
      .hour(selectedHour)
      .minute(selectedMinute);
    
    // Validar fecha mínima
    if (minDate && finalDate.isBefore(minDate)) {
      const formatted = dayjs(minDate).format('YYYY-MM-DD HH:mm');
      onChangeText(formatted);
    } else {
      const formatted = finalDate.format('YYYY-MM-DD HH:mm');
      onChangeText(formatted);
    }
    setShowPicker(false);
  };

  const handleSelectDay = (day: number) => {
    const newDate = dayjs(displayMonth).date(day).toDate();
    if (!minDate || dayjs(newDate).isAfter(dayjs(minDate).subtract(1, 'day'))) {
      setSelectedDate(newDate);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const displayValue = value
    ? dayjs(value).format('DD/MM/YYYY HH:mm')
    : 'Seleccionar fecha y hora';

  const minDateDisplay = minDate ? dayjs(minDate).format('DD/MM/YYYY') : null;
  const isDateInvalid = minDate && dayjs(value).isBefore(minDate);

  // Calendar generation
  const firstDayOfMonth = dayjs(displayMonth).startOf('month');
  const daysInMonth = firstDayOfMonth.daysInMonth();
  const startingDayOfWeek = firstDayOfMonth.day(); // 0 = Sunday
  const calendarDays: (number | null)[] = [
    ...Array(startingDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          { borderColor: isDateInvalid ? '#e53e3e' : primary },
          isDateInvalid && styles.inputError,
        ]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar" size={18} color={isDateInvalid ? '#e53e3e' : primary} />
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholder,
            isDateInvalid && styles.textError,
          ]}
        >
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
      </TouchableOpacity>

      {isDateInvalid && minDateDisplay && (
        <Text style={styles.errorText}>
          La fecha no puede ser anterior a {minDateDisplay}
        </Text>
      )}

      <Modal
        transparent
        animationType="slide"
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Seleccionar fecha y hora</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.pickerDone}>Hecho</Text>
              </TouchableOpacity>
            </View>

            {/* Date Display */}
            <View style={styles.dateDisplay}>
              <Text style={styles.dateDisplayText}>
                {dayjs(selectedDate).format('DD/MM/YYYY')}
              </Text>
            </View>

            {/* Date Picker */}
            <View style={styles.pickerSection}>
              <Text style={styles.sectionLabel}>Fecha</Text>
              
              {/* Month Navigation */}
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  onPress={() => setDisplayMonth(dayjs(displayMonth).subtract(1, 'month').toDate())}
                  style={styles.monthNavButton}
                >
                  <Ionicons name="chevron-back" size={20} color={primary} />
                </TouchableOpacity>
                <Text style={styles.monthText}>
                  {dayjs(displayMonth).format('MMMM YYYY')}
                </Text>
                <TouchableOpacity
                  onPress={() => setDisplayMonth(dayjs(displayMonth).add(1, 'month').toDate())}
                  style={styles.monthNavButton}
                >
                  <Ionicons name="chevron-forward" size={20} color={primary} />
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View style={styles.calendarHeader}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map((day) => (
                  <Text key={day} style={styles.dayOfWeekHeader}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {weeks.map((week, weekIdx) => (
                  <View key={weekIdx} style={styles.calendarRow}>
                    {week.map((day, dayIdx) => {
                      const isSelectable = day !== null && (!minDate || dayjs(displayMonth).date(day).isAfter(dayjs(minDate).subtract(1, 'day')));
                      const isSelected = day !== null && dayjs(selectedDate).date() === day && dayjs(selectedDate).month() === dayjs(displayMonth).month() && dayjs(selectedDate).year() === dayjs(displayMonth).year();
                      
                      return (
                        <TouchableOpacity
                          key={dayIdx}
                          onPress={() => day !== null && isSelectable && handleSelectDay(day)}
                          disabled={!isSelectable}
                          style={[
                            styles.dayButton,
                            isSelected && { backgroundColor: primary },
                            !isSelectable && styles.dayButtonDisabled,
                          ]}
                        >
                          {day !== null && (
                            <Text
                              style={[
                                styles.dayButtonText,
                                isSelected && { color: '#fff', fontWeight: '700' },
                                !isSelectable && styles.dayButtonTextDisabled,
                              ]}
                            >
                              {day}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Time Picker */}
            <View style={styles.pickerSection}>
              <Text style={styles.sectionLabel}>Hora</Text>
              <View style={styles.timePickerWrapper}>
                {/* Hours */}
                <View style={styles.timePicker}>
                  <Text style={styles.timeLabel}>Hora</Text>
                  <ScrollView
                    style={styles.timeScroll}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timeScrollContent}
                  >
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        onPress={() => setSelectedHour(hour)}
                        style={[
                          styles.timeOption,
                          selectedHour === hour && styles.timeOptionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selectedHour === hour && styles.timeOptionTextSelected,
                          ]}
                        >
                          {String(hour).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Minutes */}
                <View style={styles.timePicker}>
                  <Text style={styles.timeLabel}>Minuto</Text>
                  <ScrollView
                    style={styles.timeScroll}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.timeScrollContent}
                  >
                    {minutes.map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        onPress={() => setSelectedMinute(minute)}
                        style={[
                          styles.timeOption,
                          selectedMinute === minute && styles.timeOptionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            selectedMinute === minute && styles.timeOptionTextSelected,
                          ]}
                        >
                          {String(minute).padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Preview */}
                <View style={styles.timePreview}>
                  <Text style={styles.timePreviewText}>
                    {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: { color: '#e53e3e' },
  inputContainer: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  inputText: {
    flex: 1,
    ...typography.body1,
    color: colors.text.primary,
  },
  textError: {
    color: '#e53e3e',
  },
  placeholder: { color: colors.text.disabled },
  errorText: {
    ...typography.caption,
    color: '#e53e3e',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pickerCancel: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  pickerDone: {
    ...typography.body2,
    color: '#2563eb',
    fontWeight: '700',
  },
  dateDisplay: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  dateDisplayText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  datePickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  dateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
    paddingVertical: 8,
  },
  dayOfWeekHeader: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  calendarGrid: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  dayButton: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dayButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dayButtonText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  dayButtonTextDisabled: {
    color: colors.text.disabled,
  },
  timePickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 200,
    gap: spacing.sm,
  },
  timePicker: {
    flex: 1,
    justifyContent: 'center',
  },
  timeLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeScroll: {
    height: 140,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  timeScrollContent: {
    paddingVertical: 60,
  },
  timeOption: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  timeOptionText: {
    ...typography.body1,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '700',
  },
  timePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  timePreviewText: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
});
