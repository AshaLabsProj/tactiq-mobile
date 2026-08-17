import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEntitlement } from "@/contexts/entitlement-context";
import type { SubscriptionProduct } from "@/lib/entitlements";
import { palette, radius, spacing, typography } from "@/lib/palette";
import { logSubscriptionEvent } from "@/lib/subscription-events";

const BENEFITS = [
  ["calendar-month", "Full season history"],
  ["timeline", "Practice-to-pitch trends"],
  ["cloud-done", "Private sync across devices"],
  ["tune", "Detailed tactical tagging"],
] as const;

export default function PaywallScreen() {
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const { entitlement, offers, isLoading, purchase, restorePurchases, openCustomerCenter, refreshOffers } = useEntitlement();
  const [selected, setSelected] = useState<SubscriptionProduct>("annual");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    void logSubscriptionEvent("paywall_viewed", origin ?? "unknown");
    void refreshOffers();
  }, [origin, refreshOffers]);

  const annual = useMemo(() => offers.find((offer) => offer.product === "annual"), [offers]);
  const monthly = useMemo(() => offers.find((offer) => offer.product === "monthly"), [offers]);
  const selectedOffer = selected === "annual" ? annual : monthly;

  const completePurchase = async () => {
    if (!selectedOffer || isPurchasing) return;
    setIsPurchasing(true);
    setMessage(undefined);
    try {
      const result = await purchase(selected, origin ?? "paywall");
      if (!result.cancelled && result.snapshot.plan === "pro") {
        router.back();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not complete that purchase. Your coaching data is safe.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const restore = async () => {
    setIsPurchasing(true);
    setMessage(undefined);
    try {
      const restored = await restorePurchases(origin ?? "paywall");
      setMessage(restored.plan === "pro" ? "Your Skilltracker Pro access has been restored." : "No previous Skilltracker Pro purchase was found for this store account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not restore purchases. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.close} onPress={() => { void logSubscriptionEvent("paywall_dismissed", origin ?? "unknown"); router.back(); }} accessibilityLabel="Close Skilltracker Pro">
            <MaterialIcons name="close" size={24} color={palette.white} />
          </TouchableOpacity>
          <View style={styles.motif}><MaterialIcons name="sports-soccer" size={34} color={palette.white} /></View>
          <Text style={styles.kicker}>SKILLTRACKER PRO</Text>
          <Text style={styles.heroTitle}>The full picture of your team, all season.</Text>
          <Text style={styles.heroBody}>Keep coaching work connected—from practice focus to match-day evidence.</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.benefits}>
            {BENEFITS.map(([icon, copy]) => <View style={styles.benefit} key={copy}><View style={styles.benefitIcon}><MaterialIcons name={icon} size={20} color={palette.primaryDark} /></View><Text style={styles.benefitText}>{copy}</Text></View>)}
          </View>

          <View style={styles.plans}>
            <PlanRow selected={selected === "annual"} title="Annual" detail={annual ? `${annual.priceString} ${annual.periodLabel}` : "Loading store price…"} badge="2 months free" onPress={() => setSelected("annual")} disabled={!annual} />
            <PlanRow selected={selected === "monthly"} title="Monthly" detail={monthly ? `${monthly.priceString} ${monthly.periodLabel}` : "Loading store price…"} onPress={() => setSelected("monthly")} disabled={!monthly} />
          </View>

          <Text style={styles.trial}>{selectedOffer ? `7 days free, then ${selectedOffer.priceString} ${selectedOffer.periodLabel}. Cancel anytime.` : "Prices and trial details are loaded securely from your app store."}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {entitlement.plan === "pro" ? <TouchableOpacity style={styles.manageButton} onPress={() => void openCustomerCenter()}><Text style={styles.manageText}>Manage Skilltracker Pro</Text></TouchableOpacity> : <TouchableOpacity style={[styles.primary, (!selectedOffer || isPurchasing) && styles.primaryDisabled]} disabled={!selectedOffer || isPurchasing} onPress={() => void completePurchase()}><Text style={styles.primaryText}>{isPurchasing ? "Working…" : "Start free trial"}</Text>{isPurchasing ? <ActivityIndicator color={palette.white} /> : <MaterialIcons name="arrow-forward" size={20} color={palette.white} />}</TouchableOpacity>}

          <View style={styles.links}>
            <TouchableOpacity onPress={() => void restore()} disabled={isPurchasing}><Text style={styles.link}>Restore purchases</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => void Linking.openURL("https://soccerskilltracker.com/terms")}><Text style={styles.link}>Terms</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => void Linking.openURL("https://soccerskilltracker.com/privacy")}><Text style={styles.link}>Privacy</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanRow({ selected, title, detail, badge, onPress, disabled }: { selected: boolean; title: string; detail: string; badge?: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity style={[styles.plan, selected && styles.planSelected, disabled && styles.planDisabled]} onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ selected, disabled }}><View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View><View style={styles.planCopy}><View style={styles.planTitleRow}><Text style={styles.planTitle}>{title}</Text>{badge ? <Text style={styles.badge}>{badge}</Text> : null}</View><Text style={styles.planDetail}>{detail}</Text></View></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background }, content: { paddingBottom: spacing.xl },
  hero: { backgroundColor: palette.primaryDark, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl, overflow: "hidden" },
  close: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", alignSelf: "flex-end", marginBottom: spacing.lg },
  motif: { width: 64, height: 64, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", marginBottom: spacing.base },
  kicker: { ...typography.eyebrow, color: "#C2E0D8", marginBottom: spacing.sm }, heroTitle: { ...typography.displayMd, color: palette.white, maxWidth: 340 }, heroBody: { ...typography.body, color: "rgba(255,255,255,0.78)", marginTop: spacing.md, maxWidth: 340 },
  body: { padding: spacing.lg, gap: spacing.lg }, benefits: { gap: spacing.md }, benefit: { flexDirection: "row", minHeight: 44, alignItems: "center", gap: spacing.md }, benefitIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }, benefitText: { ...typography.bodyMed, color: palette.ink },
  plans: { gap: spacing.sm }, plan: { minHeight: 74, borderRadius: radius.lg, borderWidth: 1.5, borderColor: palette.borderMid, padding: spacing.base, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: palette.surface }, planSelected: { borderColor: palette.primary, backgroundColor: palette.primarySoft }, planDisabled: { opacity: 0.58 }, radio: { width: 22, height: 22, borderRadius: radius.full, borderWidth: 2, borderColor: palette.borderMid, alignItems: "center", justifyContent: "center" }, radioSelected: { borderColor: palette.primary }, radioDot: { width: 12, height: 12, borderRadius: radius.full, backgroundColor: palette.primary }, planCopy: { flex: 1 }, planTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, planTitle: { ...typography.cardTitle, color: palette.ink }, planDetail: { ...typography.caption, color: palette.muted, marginTop: 2 }, badge: { color: palette.primaryDark, backgroundColor: "#C2E0D8", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, fontSize: 11, fontWeight: "800", overflow: "hidden" },
  trial: { ...typography.caption, color: palette.muted, textAlign: "center", paddingHorizontal: spacing.md }, message: { ...typography.caption, color: palette.coralDark, textAlign: "center", backgroundColor: palette.coralSoft, padding: spacing.md, borderRadius: radius.md },
  primary: { minHeight: 52, borderRadius: radius.lg, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.base }, primaryDisabled: { backgroundColor: palette.faint }, primaryText: { ...typography.bodyMed, color: palette.white }, manageButton: { minHeight: 52, borderRadius: radius.lg, backgroundColor: palette.primarySoft, alignItems: "center", justifyContent: "center" }, manageText: { ...typography.bodyMed, color: palette.primaryDark },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.base }, link: { color: palette.primaryDark, fontSize: 13, lineHeight: 22, fontWeight: "700", textDecorationLine: "underline" },
});
