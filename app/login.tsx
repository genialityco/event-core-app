import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

const isOtp = clientConfig.authMethods.includes("otp");

export default function LoginScreen() {
  const { signIn, signInDirect, resetPassword } = useAuth();
  const bc = useBrandedColors();
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
      Alert.alert("Error", "Por favor ingresa tu correo electrónico.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Ingresa un correo electrónico válido.");
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
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Ingresa un correo electrónico válido.");
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
      Alert.alert("Error", "Por favor, ingresa tu correo electrónico.");
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
          <Text style={styles.headerText}>Bienvenido a {clientConfig.name}</Text>
          <Text style={styles.descriptionText}>
            {isOtp
              ? "Ingresa tu correo y te enviaremos un código de acceso"
              : "Si ya te has registrado, por favor continúa iniciando sesión"}
          </Text>

          <PaperInput
            label="Correo electrónico"
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
              label="Contraseña"
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

          <Button
            mode="contained"
            onPress={isOtp ? handleDirectLogin : handlePasswordLogin}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={bc.primary}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
          >
            {isOtp ? "Ingresar" : "Iniciar Sesión"}
          </Button>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={[styles.linkText, { color: bc.primary }]}>
              ¿No tienes una cuenta? Regístrate
            </Text>
          </TouchableOpacity>

          {/* Recuperar contraseña solo para flujo emailPassword */}
          {!isOtp && (
            <TouchableOpacity onPress={() => setIsModalVisible(true)}>
              <Text style={[styles.forgotPasswordText, { color: bc.primary }]}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
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
                <Text style={styles.modalTitle}>Recuperar Contraseña</Text>

                <PaperInput
                  label="Correo electrónico"
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
                  style={styles.resetButton}
                >
                  Enviar Enlace
                </Button>

                <Button
                  mode="text"
                  onPress={() => setIsModalVisible(false)}
                  style={styles.cancelButton}
                >
                  Cancelar
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  loginButton: {
    marginVertical: 10,
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
  forgotPasswordText: {
    color: "#007AFF",
    textAlign: "center",
    fontSize: 15,
    marginTop: 15,
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
  resetButton: {
    marginTop: 10,
    width: "100%",
  },
  cancelButton: {
    marginTop: 10,
    width: "100%",
  },
  inputModal: {
    marginBottom: 15,
    width: "100%",
    height: 50,
  },
});
