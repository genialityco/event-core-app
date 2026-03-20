import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ImageBackground,
} from "react-native";
import { Button } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { sendOtpCode } from "@/services/api/authService";

const CODE_LENGTH = 6;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { signInWithOtp } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  const handleDigitChange = (value: string, index: number) => {
    const cleaned = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    // Avanzar al siguiente campo automáticamente
    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      Alert.alert("Error", `Ingresa el código de ${CODE_LENGTH} dígitos.`);
      return;
    }

    setIsVerifying(true);
    const success = await signInWithOtp(email, code);
    setIsVerifying(false);

    if (success) {
      router.replace("/(app)/(tabs)/home");
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await sendOtpCode(email);
      Alert.alert("Código enviado", `Enviamos un nuevo código a ${email}`);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "No pudimos reenviar el código. Intenta de nuevo.";
      Alert.alert("Error", msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../assets/images/APP_ACHO_SLIDER_01.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.card}>
          <Text style={styles.headerText}>Verificar correo</Text>
          <Text style={styles.descriptionText}>
            Ingresa el código de {CODE_LENGTH} dígitos que enviamos a
          </Text>
          <Text style={styles.emailText}>{email}</Text>

          {/* Inputs de dígitos */}
          <View style={styles.codeContainer}>
            {digits.map((digit, index) => (
              <RNTextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.digitInput}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={isVerifying || digits.join("").length < CODE_LENGTH}
            style={styles.verifyButton}
            contentStyle={styles.buttonContent}
          >
            Verificar y entrar
          </Button>

          <TouchableOpacity
            onPress={handleResend}
            disabled={isResending}
            style={styles.resendContainer}
          >
            <Text style={styles.resendText}>
              {isResending ? "Enviando..." : "¿No recibiste el código? Reenviar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Cambiar correo</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  emailText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  codeContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  digitInput: {
    width: 44,
    height: 54,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 22,
    fontWeight: "bold",
    backgroundColor: "#f9f9f9",
    color: "#333",
  },
  verifyButton: {
    width: "100%",
    marginBottom: 16,
  },
  buttonContent: {
    height: 50,
  },
  resendContainer: {
    marginBottom: 12,
  },
  resendText: {
    color: "#007AFF",
    fontSize: 15,
    textAlign: "center",
  },
  backText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
});
