import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useTranslation } from "@/src/i18n";
import { colors, spacing, typography } from "@/src/theme";

interface DateInputProps {
  label: string;
  value: string;
  onChangeText: (date: string) => void;
  required?: boolean;
  primary: string;
  minDate?: Date;
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChangeText,
  required,
  primary,
  minDate,
}) => {
  const { i18n } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isEnglish = i18n.language?.toLowerCase().startsWith("en");
  const locale = isEnglish ? "en-US" : "es-CO";

  const text = {
    placeholder: isEnglish ? "Select date and time" : "Seleccionar fecha y hora",
    invalidDatePrefix: isEnglish
      ? "Date cannot be earlier than"
      : "La fecha no puede ser anterior a",
    cancel: isEnglish ? "Cancel" : "Cancelar",
    title: isEnglish ? "Select date and time" : "Seleccionar fecha y hora",
    done: isEnglish ? "Done" : "Hecho",
    date: isEnglish ? "Date" : "Fecha",
    time: isEnglish ? "Time" : "Hora",
    hour: isEnglish ? "Hour" : "Hora",
    minute: isEnglish ? "Minute" : "Minuto",
    weekdays: isEnglish
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"],
  };

  const isCompact = width < 380 || height < 720;

  const [showPicker, setShowPicker] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? dayjs(value).toDate() : new Date(),
  );

  const [selectedHour, setSelectedHour] = useState<number>(
    value ? dayjs(value).hour() : 12,
  );

  const [selectedMinute, setSelectedMinute] = useState<number>(
    value ? dayjs(value).minute() : 0,
  );

  const [displayMonth, setDisplayMonth] = useState<Date>(
    value ? dayjs(value).toDate() : new Date(),
  );

  const handleConfirm = () => {
    const finalDate = dayjs(selectedDate)
      .hour(selectedHour)
      .minute(selectedMinute);

    if (minDate && finalDate.isBefore(minDate)) {
      const formatted = dayjs(minDate).format("YYYY-MM-DD HH:mm");
      onChangeText(formatted);
    } else {
      const formatted = finalDate.format("YYYY-MM-DD HH:mm");
      onChangeText(formatted);
    }

    setShowPicker(false);
  };

  const handleSelectDay = (day: number) => {
    const newDate = dayjs(displayMonth).date(day).toDate();

    if (!minDate || dayjs(newDate).isAfter(dayjs(minDate).subtract(1, "day"))) {
      setSelectedDate(newDate);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const displayValue = value
    ? dayjs(value).toDate().toLocaleString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : text.placeholder;

  const minDateDisplay = minDate
    ? minDate.toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const isDateInvalid = Boolean(
    value && minDate && dayjs(value).isBefore(minDate),
  );

  /**
   * Generación del calendario
   * Se completa la última semana con null para que siempre tenga 7 columnas.
   */
  const firstDayOfMonth = dayjs(displayMonth).startOf("month");
  const daysInMonth = firstDayOfMonth.daysInMonth();
  const startingDayOfWeek = firstDayOfMonth.day(); // 0 = Domingo

  const calendarDays: (number | null)[] = [
    ...Array(startingDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const totalSlots = Math.ceil(calendarDays.length / 7) * 7;

  const normalizedCalendarDays: (number | null)[] = [
    ...calendarDays,
    ...Array(totalSlots - calendarDays.length).fill(null),
  ];

  const weeks: (number | null)[][] = [];

  for (let i = 0; i < normalizedCalendarDays.length; i += 7) {
    weeks.push(normalizedCalendarDays.slice(i, i + 7));
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
          { borderColor: isDateInvalid ? "#e53e3e" : primary },
          isDateInvalid && styles.inputError,
        ]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar"
          size={18}
          color={isDateInvalid ? "#e53e3e" : primary}
        />

        <Text
          style={[
            styles.inputText,
            !value && styles.placeholder,
            isDateInvalid && styles.textError,
          ]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>

        <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
      </TouchableOpacity>

      {isDateInvalid && minDateDisplay && (
        <Text style={styles.errorText}>
          {text.invalidDatePrefix} {minDateDisplay}
        </Text>
      )}

      <Modal
        transparent
        animationType="slide"
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView
            style={[
              styles.pickerContainer,
              { maxHeight: isCompact ? "96%" : "90%" },
            ]}
          >
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerCancel}>{text.cancel}</Text>
              </TouchableOpacity>

              <Text
                style={[
                  styles.pickerTitle,
                  isCompact && styles.pickerTitleCompact,
                ]}
                numberOfLines={1}
              >
                {text.title}
              </Text>

              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.pickerDone}>{text.done}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.pickerScroll}
              contentContainerStyle={styles.pickerScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <View
                style={[
                  styles.dateDisplay,
                  isCompact && styles.dateDisplayCompact,
                ]}
              >
                <Text style={styles.dateDisplayText}>
                  {selectedDate.toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </Text>
              </View>

              <View
                style={[
                  styles.pickerSection,
                  isCompact && styles.pickerSectionCompact,
                ]}
              >
                <Text style={styles.sectionLabel}>{text.date}</Text>

                <View
                  style={[
                    styles.monthNavigation,
                    isCompact && styles.monthNavigationCompact,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setDisplayMonth(
                        dayjs(displayMonth).subtract(1, "month").toDate(),
                      )
                    }
                    style={[
                      styles.monthNavButton,
                      isCompact && styles.monthNavButtonCompact,
                    ]}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={isCompact ? 18 : 20}
                      color={primary}
                    />
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.monthText,
                      isCompact && styles.monthTextCompact,
                    ]}
                    numberOfLines={1}
                  >
                    {displayMonth
                      .toLocaleDateString(locale, {
                        month: "long",
                        year: "numeric",
                      })
                      .replace(/^./, (c) => c.toUpperCase())}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setDisplayMonth(
                        dayjs(displayMonth).add(1, "month").toDate(),
                      )
                    }
                    style={[
                      styles.monthNavButton,
                      isCompact && styles.monthNavButtonCompact,
                    ]}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={isCompact ? 18 : 20}
                      color={primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarHeader}>
                  {text.weekdays.map(
                    (day) => (
                      <Text
                        key={day}
                        style={[
                          styles.dayOfWeekHeader,
                          isCompact && styles.dayOfWeekHeaderCompact,
                        ]}
                        numberOfLines={1}
                      >
                        {day}
                      </Text>
                    ),
                  )}
                </View>

                <View style={styles.calendarGrid}>
                  {weeks.map((week, weekIdx) => (
                    <View
                      key={weekIdx}
                      style={[
                        styles.calendarRow,
                        isCompact && styles.calendarRowCompact,
                      ]}
                    >
                      {week.map((day, dayIdx) => {
                        const currentDate =
                          day !== null ? dayjs(displayMonth).date(day) : null;

                        const isSelectable =
                          day !== null &&
                          currentDate !== null &&
                          (!minDate ||
                            currentDate.isAfter(
                              dayjs(minDate).subtract(1, "day"),
                            ));

                        const isSelected =
                          day !== null &&
                          dayjs(selectedDate).date() === day &&
                          dayjs(selectedDate).month() ===
                            dayjs(displayMonth).month() &&
                          dayjs(selectedDate).year() ===
                            dayjs(displayMonth).year();

                        return (
                          <TouchableOpacity
                            key={`${weekIdx}-${dayIdx}`}
                            onPress={() =>
                              day !== null &&
                              isSelectable &&
                              handleSelectDay(day)
                            }
                            disabled={day === null || !isSelectable}
                            activeOpacity={day === null ? 1 : 0.7}
                            style={[
                              styles.dayButton,
                              isCompact && styles.dayButtonCompact,
                              day === null && styles.dayButtonEmpty,
                              isSelected && { backgroundColor: primary },
                              day !== null &&
                                !isSelectable &&
                                styles.dayButtonDisabled,
                            ]}
                          >
                            {day !== null && (
                              <Text
                                style={[
                                  styles.dayButtonText,
                                  isCompact && styles.dayButtonTextCompact,
                                  isSelected && styles.dayButtonTextSelected,
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

              <View
                style={[
                  styles.pickerSection,
                  styles.timeSection,
                  isCompact && styles.pickerSectionCompact,
                ]}
              >
                <Text style={styles.sectionLabel}>{text.time}</Text>

                <View
                  style={[
                    styles.timePickerWrapper,
                    isCompact && styles.timePickerWrapperCompact,
                  ]}
                >
                  <View style={styles.timePicker}>
                    <Text style={styles.timeLabel}>{text.hour}</Text>

                    <ScrollView
                      style={[
                        styles.timeScroll,
                        isCompact && styles.timeScrollCompact,
                      ]}
                      scrollEnabled
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={[
                        styles.timeScrollContent,
                        isCompact && styles.timeScrollContentCompact,
                      ]}
                    >
                      {hours.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          onPress={() => setSelectedHour(hour)}
                          style={[
                            styles.timeOption,
                            isCompact && styles.timeOptionCompact,
                            selectedHour === hour && styles.timeOptionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              isCompact && styles.timeOptionTextCompact,
                              selectedHour === hour &&
                                styles.timeOptionTextSelected,
                            ]}
                          >
                            {String(hour).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.timePicker}>
                    <Text style={styles.timeLabel}>{text.minute}</Text>

                    <ScrollView
                      style={[
                        styles.timeScroll,
                        isCompact && styles.timeScrollCompact,
                      ]}
                      scrollEnabled
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={[
                        styles.timeScrollContent,
                        isCompact && styles.timeScrollContentCompact,
                      ]}
                    >
                      {minutes.map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          onPress={() => setSelectedMinute(minute)}
                          style={[
                            styles.timeOption,
                            isCompact && styles.timeOptionCompact,
                            selectedMinute === minute &&
                              styles.timeOptionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              isCompact && styles.timeOptionTextCompact,
                              selectedMinute === minute &&
                                styles.timeOptionTextSelected,
                            ]}
                          >
                            {String(minute).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View
                    style={[
                      styles.timePreview,
                      isCompact && styles.timePreviewCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePreviewText,
                        isCompact && styles.timePreviewTextCompact,
                      ]}
                    >
                      {String(selectedHour).padStart(2, "0")}:
                      {String(selectedMinute).padStart(2, "0")}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },

  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  required: {
    color: "#e53e3e",
  },

  inputContainer: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  inputError: {
    borderColor: "#e53e3e",
  },

  inputText: {
    flex: 1,
    ...typography.body1,
    color: colors.text.primary,
  },

  textError: {
    color: "#e53e3e",
  },

  placeholder: {
    color: colors.text.disabled,
  },

  errorText: {
    ...typography.caption,
    color: "#e53e3e",
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  pickerContainer: {
    width: "100%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },

  pickerTitle: {
    flex: 1,
    ...typography.body1,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
  },

  pickerTitleCompact: {
    fontSize: 14,
  },

  pickerCancel: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: "600",
  },

  pickerDone: {
    ...typography.body2,
    color: "#2563eb",
    fontWeight: "700",
  },

  pickerScroll: {
    flexGrow: 0,
  },

  pickerScrollContent: {
    paddingBottom: spacing.lg,
  },

  dateDisplay: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "rgba(37, 99, 235, 0.05)",
  },

  dateDisplayCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  dateDisplayText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: "600",
    textAlign: "center",
  },

  pickerSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  pickerSectionCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  timeSection: {
    borderBottomWidth: 0,
  },

  sectionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },

  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },

  monthNavigationCompact: {
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },

  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  monthNavButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  monthText: {
    flex: 1,
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "capitalize",
  },

  monthTextCompact: {
    fontSize: 14,
  },

  calendarHeader: {
    flexDirection: "row",
    marginBottom: 6,
    paddingVertical: 6,
  },

  dayOfWeekHeader: {
    flex: 1,
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "600",
    textAlign: "center",
  },

  dayOfWeekHeaderCompact: {
    fontSize: 11,
  },

  calendarGrid: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },

  calendarRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

  calendarRowCompact: {
    marginBottom: 4,
  },

  dayButton: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  dayButtonCompact: {
    marginHorizontal: 1.5,
    borderRadius: 7,
  },

  dayButtonEmpty: {
    backgroundColor: "transparent",
  },

  dayButtonDisabled: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },

  dayButtonText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: "500",
  },

  dayButtonTextCompact: {
    fontSize: 12,
  },

  dayButtonTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },

  dayButtonTextDisabled: {
    color: colors.text.disabled,
  },

  timePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 200,
    gap: spacing.sm,
  },

  timePickerWrapperCompact: {
    height: 160,
    gap: 6,
  },

  timePicker: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  timeLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },

  timeScroll: {
    height: 140,
    borderRadius: 8,
    backgroundColor: colors.background,
  },

  timeScrollCompact: {
    height: 105,
  },

  timeScrollContent: {
    paddingVertical: 60,
  },

  timeScrollContentCompact: {
    paddingVertical: 40,
  },

  timeOption: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  timeOptionCompact: {
    height: 34,
  },

  timeOptionSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },

  timeOptionText: {
    ...typography.body1,
    color: colors.text.secondary,
    fontWeight: "500",
  },

  timeOptionTextCompact: {
    fontSize: 14,
  },

  timeOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "700",
  },

  timePreview: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },

  timePreviewCompact: {
    minWidth: 52,
  },

  timePreviewText: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: "700",
  },

  timePreviewTextCompact: {
    fontSize: 18,
  },
});
