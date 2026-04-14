import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { Button, TextInput as PaperInput } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { clientConfig } from "@/clients";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useBrandedColors } from "@/src/theme";
import { useTranslation } from "react-i18next";

const isOtp = clientConfig.authMethods.includes("otp");

export default function LoginScreen() {
  const { signIn, signInDirect, resetPassword } = useAuth();
  const bc = useBrandedColors();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const validateEmail = (value: string) =>
    /\S+@\S+\.\S+/.test(value);

  // ── Flujo directo: solo correo → custom token → ingreso ──
  const handleDirectLogin = async () => {
    if (!email) {
      Alert.alert("Error", t("auth.login.emailPlaceholder"));
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", t("auth.login.emailPlaceholder"));
      return;
    }

    setIsLoading(true);
    const success = await signInDirect(email.trim().toLowerCase());
    setIsLoading(false);

    if (success) {
      router.replace("/(app)/(tabs)/home");
    }
  };

  // ── Flujo email+contraseña (clientes legacy) ──
  const handlePasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", t("auth.login.error"));
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", t("auth.login.error"));
      return;
    }

    setIsLoading(true);
    const success = await signIn(email, password);
    setIsLoading(false);

    if (success) {
      router.push("/(app)/(tabs)/home");
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert("Error", t("auth.login.emailPlaceholder"));
      return;
    }
    try {
      await resetPassword(resetEmail);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error al enviar el correo de restablecimiento:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../assets/icons/APP-CUMBRE_SPLASH-REGISTRO.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.card}>
          <Text style={styles.headerText}>
            {t("auth.login.title")} — {clientConfig.name}
          </Text>
          <Text style={styles.descriptionText}>
            {isOtp
              ? t("auth.login.subtitleOtp")
              : t("auth.login.subtitlePassword")}
          </Text>

          <PaperInput
            label={t("auth.login.emailPlaceholder")}
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<PaperInput.Icon icon="email" />}
          />

          {/* Campo contraseña solo para flujo emailPassword */}
          {!isOtp && (
            <PaperInput
              label={t("auth.login.passwordPlaceholder")}
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              style={styles.input}
              left={<PaperInput.Icon icon="lock" />}
              right={
                <PaperInput.Icon
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
          )}

          {/* Botón principal: Ingresar */}
          <Button
            mode="contained"
            onPress={isOtp ? handleDirectLogin : handlePasswordLogin}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={bc.primary}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            {t("auth.login.loginButton")}
          </Button>

          {/* Botón secundario: Registrarse */}
          <Button
            mode="outlined"
            onPress={() => router.push("/register")}
            disabled={isLoading}
            textColor={bc.primary}
            style={[styles.actionButton, { borderColor: bc.primary }]}
            contentStyle={styles.buttonContent}
          >
            {t("auth.login.registerButton")}
          </Button>

          {/* Recuperar contraseña solo para flujo emailPassword */}
          {!isOtp && (
            <Button
              mode="text"
              onPress={() => setIsModalVisible(true)}
              textColor={bc.primary}
              style={styles.forgotButton}
            >
              {t("auth.login.forgotPassword")}
            </Button>
          )}
        </View>

        {/* Modal recuperación de contraseña (solo emailPassword) */}
        {!isOtp && (
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {t("auth.login.resetTitle")}
                </Text>

                <PaperInput
                  label={t("auth.login.emailPlaceholder")}
                  mode="outlined"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.inputModal}
                  left={<PaperInput.Icon icon="email" />}
                />

                <Button
                  mode="contained"
                  onPress={handleForgotPassword}
                  buttonColor={bc.primary}
                  style={styles.modalButton}
                >
                  {t("auth.login.resetSend")}
                </Button>

                <Button
                  mode="text"
                  onPress={() => setIsModalVisible(false)}
                  style={styles.modalButton}
                >
                  {t("auth.login.cancel")}
                </Button>
              </View>
            </View>
          </Modal>
        )}
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
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
  actionButton: {
    marginTop: 10,
  },
  buttonContent: {
    height: 50,
  },
  forgotButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalButton: {
    marginTop: 10,
    width: "100%",
  },
  inputModal: {
    marginBottom: 15,
    width: "100%",
    height: 50,
  },
});
