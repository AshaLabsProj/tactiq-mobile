import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { signInWithApple, signInWithGoogle } from "@/lib/native-auth";
import { palette } from "@/lib/palette";

export function NativeSignIn({ onSignedIn, onError }: { onSignedIn: () => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const useGoogle = async () => { try { setBusy(true); const user = await signInWithGoogle(); if (user) onSignedIn(); } catch (error) { onError(error instanceof Error ? error.message : "Google sign-in could not be completed."); } finally { setBusy(false); } };
  const useApple = async () => { try { setBusy(true); const user = await signInWithApple(); if (user) onSignedIn(); } catch (error) { onError(error instanceof Error ? error.message : "Apple sign-in could not be completed."); } finally { setBusy(false); } };
  return <View style={styles.wrap}>
    <GoogleSigninButton size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} style={[styles.google, busy && styles.disabled]} onPress={useGoogle} disabled={busy} />
    {Platform.OS === "ios" ? <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE} buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK} cornerRadius={12} style={[styles.apple, busy && styles.disabled]} onPress={useApple} /> : null}
    <Text style={styles.note}>We use your account only to secure your private coaching workspace.</Text>
  </View>;
}

const styles = StyleSheet.create({ wrap: { gap: 10, width: "100%" }, google: { width: "100%", height: 48 }, apple: { width: "100%", height: 48 }, disabled: { opacity: 0.55 }, note: { color: palette.muted, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 2 } });
