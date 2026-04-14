import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { ActivityIndicator, Button, TextInput, Checkbox } from "react-native-paper";
import RNPickerSelect from "react-native-picker-select";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  InterfaceOrganization,
  fetchOrganizationById,
} from "@/services/api/organizationService";
import { useOrganization } from "@/context/OrganizationContext";
import { clientConfig } from "@/clients";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useBrandedColors } from "@/src/theme";
import { useTranslation } from "react-i18next";

const isOtp = clientConfig.authMethods.includes("otp");

// ─── Formulario simple para clientes OTP (nombre + correo) ───────────────────

function OtpRegisterForm() {
  const { signUpOtp, signInDirect } = useAuth();
  const bc = useBrandedColors();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", t("auth.register.errorName"));
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", t("auth.register.errorEmail"));
      return;
    }

    const organizationId = clientConfig.organizationId;
    if (!organizationId) {
      Alert.alert(t("auth.register.errorOrgTitle"), t("auth.register.errorOrg"));
      return;
    }

    setIsRegistering(true);
    const registered = await signUpOtp(email.trim(), name.trim(), organizationId);

    if (registered) {
      const loggedIn = await signInDirect(email.trim());
      setIsRegistering(false);
      if (loggedIn) {
        router.replace("/(app)/(tabs)/home" as any);
      } else {
        router.replace("/login");
      }
    } else {
      setIsRegistering(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/icons/APP-CUMBRE_SPLASH-REGISTRO.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <Text style={styles.headerText}>{t("auth.register.title")}</Text>
          <Text style={styles.descriptionText}>
            {t("auth.register.subtitleOtp", { appName: clientConfig.name })}
          </Text>

          <TextInput
            label={t("auth.register.namePlaceholder")}
            mode="outlined"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label={t("auth.register.emailPlaceholder")}
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isRegistering}
            disabled={isRegistering}
            buttonColor={bc.primary}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
          >
            {t("auth.register.registerButton")}
          </Button>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={[styles.linkText, { color: bc.primary }]}>
              {t("auth.register.loginLink")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// ─── Formulario dinámico para clientes email+contraseña ──────────────────────

function DynamicRegisterForm() {
  const bc = useBrandedColors();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});
  const [organizationData, setOrganizationData] = useState<InterfaceOrganization>();
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { signUp, authError } = useAuth();
  const { organization } = useOrganization();

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetchOrganizationById(organization._id);
      setOrganizationData(response.data);
    } catch (error) {
      console.error("Error fetching organization:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: false });
  };

  const handleRegister = async () => {
    const { propertiesDefinition } = organizationData || {};

    const requiredFields =
      propertiesDefinition?.filter((field) => field.required && field.show) || [];

    const missingFields = requiredFields.filter((field) => {
      const fieldValue = formData[field.fieldName];
      if (field.type === "checkbox") return fieldValue !== "true";
      return !fieldValue || String(fieldValue).trim() === "";
    });

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map((f) => f.label).join(", ");
      const errorMap = missingFields.reduce((acc, field) => {
        acc[field.fieldName] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      setFieldErrors(errorMap);
      Alert.alert("Error de Validación", `Los siguientes campos son obligatorios:\n\n${missingFieldNames}`);
      return;
    }

    setFieldErrors({});
    setIsRegistering(true);

    try {
      const setDataTreatmentConsent = {
        ...formData,
        dataTreatmentConsent: formData["dataTreatmentConsent"] == "true",
      };

      const email = formData["email"];
      const idNumberField = propertiesDefinition?.find((f) => f.fieldName === "idNumber");
      const password = idNumberField ? formData["idNumber"] : formData["password"];

      if (!email || email.trim() === "") {
        Alert.alert("Error", "El email es requerido para registrarse");
        setIsRegistering(false);
        return;
      }

      if (!password || password.trim() === "") {
        const fieldLabel = idNumberField ? idNumberField.label : "contraseña";
        Alert.alert("Error", `${fieldLabel} es requerido para registrarse`);
        setIsRegistering(false);
        return;
      }

      const success = await signUp(email, password, organization._id, setDataTreatmentConsent);

      if (success) {
        router.replace("/(app)/(tabs)/home" as any);
      }
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Error", authError || "Error al registrar el usuario.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" color={bc.primary} />
        <Text>{t("auth.register.loading")}</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/icons/APP-CUMBRE_SPLASH-REGISTRO.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
          <View style={styles.card}>
            <Text style={styles.headerText}>{t("auth.register.title")}</Text>

            {organizationData?.propertiesDefinition
              .filter((field) => field.show)
              .map((field) => {
                const isFieldRequired = field.required;
                const fieldError = fieldErrors[field.fieldName];

                if (field.type === "checkbox") {
                  return (
                    <View
                      key={field.fieldName}
                      style={[
                        { flexDirection: "row", alignItems: "center", marginBottom: 15 },
                        fieldError && {
                          borderWidth: 2,
                          borderColor: "#ff3333",
                          padding: 10,
                          borderRadius: 8,
                          backgroundColor: "#ffe6e6",
                        },
                      ]}
                    >
                      <Checkbox
                        status={formData[field.fieldName] ? "checked" : "unchecked"}
                        onPress={() =>
                          handleInputChange(field.fieldName, formData[field.fieldName] ? "" : "true")
                        }
                      />
                      <Text>
                        {field.label}
                        {isFieldRequired && <Text style={styles.asterisk}>*</Text>}
                      </Text>
                      {fieldError && (
                        <Text style={{ color: "#ff3333", fontSize: 12, marginLeft: "auto" }}>
                          {t("auth.register.required")}
                        </Text>
                      )}
                    </View>
                  );
                }

                if (field.fieldName === "specialty" && field.type === "list") {
                  return Platform.OS === "ios" ? (
                    <View key={field.fieldName}>
                      <TouchableOpacity
                        onPress={() => setShowPicker(true)}
                        style={[
                          styles.pickerButton,
                          fieldError && { borderColor: "#ff3333", borderWidth: 2, backgroundColor: "#ffe6e6" },
                        ]}
                      >
                        <Text>
                          {formData[field.fieldName] || "Seleccione una especialidad"}
                          {isFieldRequired && <Text style={styles.asterisk}>*</Text>}
                        </Text>
                      </TouchableOpacity>
                      {fieldError && (
                        <Text style={{ color: "#ff3333", fontSize: 12, marginBottom: 10 }}>
                          {t("auth.register.required")}
                        </Text>
                      )}
                      <Modal visible={showPicker} animationType="slide" transparent>
                        <View style={styles.modalContainer}>
                          <View style={styles.pickerContainer}>
                            <Picker
                              selectedValue={formData[field.fieldName] || ""}
                              onValueChange={(value) => {
                                handleInputChange(field.fieldName, value);
                                setShowPicker(false);
                              }}
                            >
                              <Picker.Item label="Seleccione una especialidad" value="" />
                              {field.options.map((option: string, index: number) => (
                                <Picker.Item key={index} label={option} value={option} />
                              ))}
                            </Picker>
                            <Button onPress={() => setShowPicker(false)}>Cerrar</Button>
                          </View>
                        </View>
                      </Modal>
                    </View>
                  ) : (
                    <View key={field.fieldName}>
                      <RNPickerSelect
                        onValueChange={(value) => handleInputChange(field.fieldName, value)}
                        items={field.options.map((option: string) => ({ label: option, value: option }))}
                        placeholder={{ label: "Seleccione una especialidad", value: "" }}
                        value={formData[field.fieldName]}
                        style={{
                          ...pickerSelectStyles,
                          inputAndroid: [
                            pickerSelectStyles.inputAndroid,
                            fieldError && { borderColor: "#ff3333", borderWidth: 2, backgroundColor: "#ffe6e6" },
                          ],
                          inputIOS: [
                            pickerSelectStyles.inputIOS,
                            fieldError && { borderColor: "#ff3333", borderWidth: 2, backgroundColor: "#ffe6e6" },
                          ],
                        }}
                      />
                      {fieldError && (
                        <Text style={{ color: "#ff3333", fontSize: 12, marginBottom: 10 }}>
                          {t("auth.register.required")}
                        </Text>
                      )}
                    </View>
                  );
                }

                if (field.type === "password") {
                  return (
                    <TextInput
                      key={field.fieldName}
                      label={field.label}
                      mode="outlined"
                      secureTextEntry={!isPasswordVisible}
                      value={formData[field.fieldName] || ""}
                      onChangeText={(value) => handleInputChange(field.fieldName, value)}
                      style={styles.input}
                      error={fieldError}
                      right={
                        <TextInput.Icon
                          icon={() => (
                            <Icon
                              name={isPasswordVisible ? "visibility" : "visibility-off"}
                              size={24}
                            />
                          )}
                          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        />
                      }
                    />
                  );
                }

                return (
                  <View key={field.fieldName}>
                    <TextInput
                      label={field.label}
                      mode="outlined"
                      secureTextEntry={field.type === "password"}
                      keyboardType={field.type === "email" ? "email-address" : "default"}
                      value={formData[field.fieldName] || ""}
                      onChangeText={(value) => handleInputChange(field.fieldName, value)}
                      style={styles.input}
                      autoCapitalize={field.type === "email" ? "none" : "sentences"}
                      error={fieldError}
                    />
                    {fieldError && (
                      <Text style={{ color: "#ff3333", fontSize: 12, marginBottom: 10 }}>
                        {t("auth.register.required")}{isFieldRequired && "*"}
                      </Text>
                    )}
                  </View>
                );
              })}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isRegistering}
              disabled={isRegistering}
              buttonColor={bc.primary}
              style={styles.registerButton}
            >
              {t("auth.register.registerButton")}
            </Button>

            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.linkText, { color: bc.primary }]}>{t("auth.register.loginLink")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

export default function RegisterScreen() {
  return isOtp ? <OtpRegisterForm /> : <DynamicRegisterForm />;
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  descriptionText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  registerButton: {
    marginTop: 10,
  },
  buttonContent: {
    height: 50,
  },
  linkText: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerButton: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  asterisk: {
    color: "red",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#888",
    marginBottom: 15,
  },
  inputAndroid: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#888",
    marginBottom: 15,
  },
});
