import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { AppButton, AppCard, IconButton } from "@/components/mobile/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import { startOAuthLogin } from "@/constants/oauth";
import { getSessionToken, getUserInfo, removeSessionToken, clearUserInfo } from "@/lib/_core/auth";

type UserInfo = { name?: string; email?: string } | null;

export default function SettingsScreen() {
  const { data, updateSettings, resetWorkspace } = useWorkspace();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>(null);

  // Load auth state on mount
  useEffect(() => {
    (async () => {
      const token = await getSessionToken();
      setSessionToken(token);
      if (token) {
        const info = await getUserInfo();
        setUserInfo(info as UserInfo);
      }
    })();
  }, []);

  const handleSignIn = async () => {
    haptic.light(data.settings.hapticsEnabled);
    await startOAuthLogin();
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign out?",
      "Your local data will remain on this device. You can sign back in at any time.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await removeSessionToken();
            await clearUserInfo();
            setSessionToken(null);
            setUserInfo(null);
            haptic.light(data.settings.hapticsEnabled);
          },
        },
      ],
    );
  };

  const confirmReset = () => {
    Alert.alert(
      "Reset local workspace?",
      "This restores the demonstration team, assessments, matches, and settings on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetWorkspace();
            haptic.success(true);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>TACTIQ</Text>
          <Text style={styles.title}>Settings</Text>
        </View>
        <IconButton name="close" accessibilityLabel="Close settings" onPress={() => router.back()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Account ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {sessionToken ? (
            <AppCard style={styles.accountCard}>
              <View style={styles.accountIcon}>
                <MaterialIcons name="account-circle" size={26} color={palette.primary} />
              </View>
              <View style={styles.accountCopy}>
                <Text style={styles.accountName}>{userInfo?.name ?? "Signed in"}</Text>
                {userInfo?.email ? (
                  <Text style={styles.accountEmail}>{userInfo.email}</Text>
                ) : null}
              </View>
              <View style={styles.accountActions}>
                <AppButton
                  label="Sign out"
                  variant="destructive"
                  icon="logout"
                  onPress={handleSignOut}
                />
              </View>
            </AppCard>
          ) : (
            <AppCard style={styles.signInCard}>
              <View style={styles.signInIcon}>
                <MaterialIcons name="login" size={24} color={palette.primaryDark} />
              </View>
              <View style={styles.signInCopy}>
                <Text style={styles.signInTitle}>Sign in to sync your data</Text>
                <Text style={styles.signInBody}>
                  Access your teams and assessments across devices.
                </Text>
              </View>
              <View style={styles.signInBtn}>
                <AppButton label="Sign in" icon="arrow-forward" onPress={handleSignIn} />
              </View>
            </AppCard>
          )}
        </View>

        {/* ── Experience ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <AppCard style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <MaterialIcons name="vibration" size={22} color={palette.primary} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Haptic feedback</Text>
                <Text style={styles.settingBody}>Subtle confirmation for important taps.</Text>
              </View>
              <Switch
                value={data.settings.hapticsEnabled}
                onValueChange={(value) => {
                  updateSettings({ hapticsEnabled: value });
                  haptic.medium(value);
                }}
                trackColor={{ false: palette.border, true: palette.sage }}
                thumbColor={data.settings.hapticsEnabled ? palette.primary : palette.white}
                ios_backgroundColor={palette.border}
                accessibilityLabel="Haptic feedback"
              />
            </View>
          </AppCard>
        </View>

        {/* ── Data ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <AppCard style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="phone-iphone" size={24} color={palette.primaryDark} />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Stored on this device</Text>
              <Text style={styles.infoBody}>
                Team, match, and assessment data is saved locally. Sign in above to sync across devices.
              </Text>
            </View>
          </AppCard>
          <AppButton label="Reset demonstration data" variant="destructive" icon="restart-alt" onPress={confirmReset} />
        </View>

        {/* ── About ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <AppCard tone="green" style={styles.aboutCard}>
            <View style={styles.brandMark}>
              <MaterialIcons name="insights" size={28} color={palette.white} />
            </View>
            <View style={styles.aboutCopy}>
              <Text style={styles.aboutTitle}>Tactiq Coach</Text>
              <Text style={styles.aboutBody}>Player development and touchline insight, simplified.</Text>
              <Text style={styles.version}>Version 1.0.0</Text>
            </View>
          </AppCard>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: palette.primary, fontSize: 11, lineHeight: 15, fontWeight: "800", letterSpacing: 0.9 },
  title: { color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: "800", letterSpacing: -0.4 },
  content: { paddingHorizontal: 20, paddingBottom: 34, gap: 26 },
  section: { gap: 10 },
  sectionTitle: { color: palette.ink, fontSize: 18, lineHeight: 24, fontWeight: "700" },
  // Account
  accountCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  accountCopy: { flex: 1 },
  accountName: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  accountEmail: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  accountActions: { overflow: "hidden" },
  signInCard: { gap: 12 },
  signInIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  signInCopy: {},
  signInTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  signInBody: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  signInBtn: { overflow: "hidden" },
  // Experience
  settingsCard: { paddingVertical: 6 },
  settingRow: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  settingCopy: { flex: 1 },
  settingTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  settingBody: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  // Data
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  infoCopy: { flex: 1 },
  infoTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  infoBody: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  // About
  aboutCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  brandMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  aboutCopy: { flex: 1 },
  aboutTitle: { color: palette.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  aboutBody: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  version: { color: palette.primaryDark, fontSize: 11, lineHeight: 15, fontWeight: "700", marginTop: 7 },
});
