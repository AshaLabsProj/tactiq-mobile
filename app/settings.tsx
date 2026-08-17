import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { AppButton, AppCard, IconButton } from "@/components/mobile/ui";
import { NativeSignIn } from "@/components/native-sign-in";
import { ScreenContainer } from "@/components/screen-container";
import { useWorkspace } from "@/contexts/workspace-context";
import { useEntitlement } from "@/contexts/entitlement-context";
import { haptic } from "@/lib/haptics";
import { palette } from "@/lib/palette";
import { startOAuthLogin } from "@/constants/oauth";
import { getSessionToken, getUserInfo, removeSessionToken, clearUserInfo } from "@/lib/_core/auth";
import { deleteCloudAccount } from "@/lib/cloud-sync";

type UserInfo = { name?: string; email?: string } | null;

export default function SettingsScreen() {
  const { data, updateSettings, resetWorkspace, pendingSyncCount, syncConflicts, isCloudSyncing, lastCloudSyncAt, cloudSyncError, syncNow, migrateLocalWorkspaceToCloud, eraseCloudBackup } = useWorkspace();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [nativeAuthError, setNativeAuthError] = useState<string | null>(null);
  const { entitlement, isPro, restorePurchases, openCustomerCenter } = useEntitlement();

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

  const refreshNativeSession = async () => {
    setNativeAuthError(null);
    const token = await getSessionToken();
    const info = await getUserInfo();
    setSessionToken(token);
    setUserInfo(info as UserInfo);
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

  const handleSync = async () => {
    const success = await syncNow();
    if (success) haptic.success(data.settings.hapticsEnabled);
  };

  const handleBackup = async () => {
    const success = await migrateLocalWorkspaceToCloud();
    if (success) haptic.success(data.settings.hapticsEnabled);
  };

  const confirmEraseCloud = () => {
    Alert.alert(
      "Erase cloud backup?",
      "This permanently removes Skilltracker data stored in the cloud for this account. Data still stored on this phone will remain until you reset it separately.",
      [{ text: "Cancel", style: "cancel" }, { text: "Erase cloud backup", style: "destructive", onPress: () => { void eraseCloudBackup(); } }],
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Skilltracker account?",
      "This permanently deletes your cloud backup and Skilltracker account. It cannot be undone. Local data on this phone remains until you choose to reset it separately.",
      [{ text: "Cancel", style: "cancel" }, { text: "Delete account", style: "destructive", onPress: () => {
        Alert.alert("Final confirmation", "Delete your Skilltracker account permanently?", [
          { text: "Keep account", style: "cancel" },
          { text: "Delete permanently", style: "destructive", onPress: async () => {
            try {
              await deleteCloudAccount();
              await removeSessionToken();
              await clearUserInfo();
              setSessionToken(null);
              setUserInfo(null);
              Alert.alert("Account deleted", "Your Skilltracker cloud account and backup have been deleted.");
            } catch (error) {
              Alert.alert("Could not delete account", error instanceof Error ? error.message : "Please try again when you are online.");
            }
          } },
        ]);
      } }],
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
          <Text style={styles.eyebrow}>SKILLTRACKER</Text>
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
                <TouchableOpacity onPress={() => router.push("/paywall?origin=settings" as never)} style={[styles.planBadge, isPro ? styles.planBadgePro : styles.planBadgeFree]}><Text style={[styles.planBadgeText, isPro ? styles.planBadgeTextPro : styles.planBadgeTextFree]}>{isPro ? "Skilltracker Pro" : "Free plan"}</Text></TouchableOpacity>
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
              <View style={styles.signInMethods}>
                <NativeSignIn onSignedIn={() => { void refreshNativeSession(); }} onError={setNativeAuthError} />
                {nativeAuthError ? <Text style={styles.nativeAuthError}>{nativeAuthError}</Text> : null}
                <Text style={styles.orLabel}>or continue in browser</Text>
                <AppButton label="Sign in with Skilltracker" icon="arrow-forward" onPress={handleSignIn} />
              </View>
            </AppCard>
          )}
          <AppCard style={styles.proCard}>
            <View style={styles.proIcon}><MaterialIcons name="workspace-premium" size={24} color={palette.primaryDark} /></View>
            <View style={styles.proCopy}><Text style={styles.infoTitle}>{isPro ? "Skilltracker Pro" : "Get the full picture"}</Text><Text style={styles.infoBody}>{isPro ? "Manage your plan or restore purchases from another device." : "Keep season history, detailed tags, practice-to-pitch trends, and private device sync."}</Text></View>
            <AppButton label={isPro ? "Manage" : "Explore Pro"} icon={isPro ? "settings" : "workspace-premium"} onPress={() => isPro ? void openCustomerCenter() : router.push("/paywall?origin=settings" as never)} />
            {!isPro ? <TouchableOpacity onPress={() => void restorePurchases("settings")} style={styles.restoreInline}><Text style={styles.restoreText}>Restore purchases</Text></TouchableOpacity> : null}
          </AppCard>
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
          {sessionToken ? (
            <AppCard style={styles.cloudCard}>
              <View style={styles.cloudHeader}>
                <View style={styles.cloudIcon}>
                  <MaterialIcons name="cloud-done" size={23} color={palette.primaryDark} />
                </View>
                <View style={styles.cloudCopy}>
                  <Text style={styles.infoTitle}>Cloud backup</Text>
                  <Text style={styles.infoBody}>{lastCloudSyncAt ? `Last synced ${new Date(lastCloudSyncAt).toLocaleString()}` : "Back up this device before using another phone."}</Text>
                </View>
              </View>
              {pendingSyncCount ? <View style={styles.pendingRow}><MaterialIcons name="sync" size={16} color={palette.amberDark} /><Text style={styles.pendingText}>{pendingSyncCount} local change{pendingSyncCount === 1 ? "" : "s"} ready to sync</Text></View> : null}
              {syncConflicts.length ? <Text style={styles.conflictText}>{syncConflicts.length} sync conflict{syncConflicts.length === 1 ? "" : "s"} saved safely for review.</Text> : null}
              {cloudSyncError ? <Text style={styles.errorText}>{cloudSyncError}</Text> : null}
              <AppButton label={isCloudSyncing ? "Syncing…" : lastCloudSyncAt ? "Sync now" : "Back up this device"} icon={lastCloudSyncAt ? "sync" : "cloud-upload"} onPress={lastCloudSyncAt ? handleSync : handleBackup} disabled={isCloudSyncing} />
              <AppButton label="Erase cloud backup" variant="destructive" icon="delete-outline" onPress={confirmEraseCloud} disabled={isCloudSyncing} />
              <TouchableOpacity accessibilityRole="button" onPress={confirmDeleteAccount} style={styles.deleteAccountLink}><Text style={styles.deleteAccountLinkText}>Delete Skilltracker account</Text></TouchableOpacity>
            </AppCard>
          ) : null}
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
              <Text style={styles.aboutTitle}>Skilltracker</Text>
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
  accountActions: { overflow: "hidden" }, planBadge: { alignSelf: "flex-start", marginTop: 6, minHeight: 24, paddingHorizontal: 8, borderRadius: 999, justifyContent: "center" }, planBadgePro: { backgroundColor: palette.primarySoft }, planBadgeFree: { backgroundColor: palette.surfaceAlt }, planBadgeText: { fontSize: 11, fontWeight: "800" }, planBadgeTextPro: { color: palette.primaryDark }, planBadgeTextFree: { color: palette.muted },
  signInCard: { gap: 12 },
  signInIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  signInCopy: {},
  signInTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  signInBody: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  signInBtn: { overflow: "hidden" }, signInMethods: { width: "100%", gap: 8 }, nativeAuthError: { color: palette.coralDark, fontSize: 12, lineHeight: 17, fontWeight: "700" }, orLabel: { color: palette.muted, fontSize: 11, fontWeight: "800", textAlign: "center", letterSpacing: 0.3, marginTop: 2 },
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
  cloudCard: { gap: 12 }, deleteAccountLink: { minHeight: 44, alignItems: "center", justifyContent: "center" }, deleteAccountLinkText: { color: palette.coralDark, fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
  proCard: { gap: 12 }, proIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }, proCopy: { flex: 1 }, restoreInline: { minHeight: 44, alignItems: "flex-start", justifyContent: "center" }, restoreText: { color: palette.primaryDark, fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
  cloudHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cloudIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" },
  cloudCopy: { flex: 1 },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: palette.amberSoft },
  pendingText: { color: palette.amberDark, fontSize: 12, fontWeight: "700" },
  conflictText: { color: palette.coral, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  errorText: { color: palette.coral, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  // About
  aboutCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  brandMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  aboutCopy: { flex: 1 },
  aboutTitle: { color: palette.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" },
  aboutBody: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  version: { color: palette.primaryDark, fontSize: 11, lineHeight: 15, fontWeight: "700", marginTop: 7 },
});
