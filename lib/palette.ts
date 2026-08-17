import { Appearance } from "react-native";

/** Skilltracker Design System — emerald on chalk-white, with a system-aware dark palette. */
const isDarkAppearance = Appearance?.getColorScheme?.() === "dark";

const lightPalette = {
  navy: "#0F1F2E", navyMid: "#1C3A52", navyLight: "#2E5C82", navySoft: "#E8EFF6", navyBorder: "#2E4A6A",
  primary: "#00A878", primaryDark: "#006B4D", primarySoft: "#E8F7F3", sage: "#C2E0D8", border: "#E5E7EB", borderMid: "#D1D5DB",
  amber: "#F59E0B", amberDark: "#92400E", amberSoft: "#FEF3C7",
  coral: "#F87171", coralDark: "#991B1B", coralSoft: "#FEE2E2",
  background: "#F5F6F4", surface: "#FFFFFF", surfaceAlt: "#F0F1EF", surfaceElev: "#FAFAFA",
  ink: "#111827", inkMid: "#374151", muted: "#6B7280", faint: "#9CA3AF",
  developing: "#F87171", secure: "#F59E0B", strong: "#00A878",
  white: "#FFFFFF", black: "#000000", transparent: "transparent" as const,
  matchSurface: "#1C3A52", matchBorder: "#2E5C82", matchText: "#FFFFFF", matchMuted: "rgba(255,255,255,0.65)",
} as const;

const darkPalette = {
  ...lightPalette,
  navy: "#12251E", navyMid: "#1B382D", navyLight: "#2C5947", navySoft: "#1B2A23", navyBorder: "#345746",
  primary: "#63D6AE", primaryDark: "#A9F1D3", primarySoft: "#173B2E", sage: "#2C6250", border: "#2A3A32", borderMid: "#3C5147",
  amber: "#F8C35B", amberDark: "#FFD77D", amberSoft: "#493918", coral: "#FF9A94", coralDark: "#FFB9B4", coralSoft: "#482325",
  background: "#101713", surface: "#17211B", surfaceAlt: "#1D2A22", surfaceElev: "#223129", ink: "#F3F7F4", inkMid: "#D9E4DD", muted: "#AABAB0", faint: "#788A7F",
  developing: "#FF9A94", secure: "#F8C35B", strong: "#63D6AE", matchSurface: "#163529", matchBorder: "#2C5A45", matchText: "#FFFFFF", matchMuted: "rgba(255,255,255,0.72)",
} as const;

/** Existing screen styles consume these tokens, so dark appearance is supported without duplicated screen trees. */
export const palette = (isDarkAppearance ? darkPalette : lightPalette) as typeof lightPalette;

export const typography = {
  displayLg: { fontSize: 36, lineHeight: 43, fontWeight: "800" as const, letterSpacing: -0.8 },
  displayMd: { fontSize: 30, lineHeight: 37, fontWeight: "800" as const, letterSpacing: -0.6 },
  pageTitle: { fontSize: 26, lineHeight: 33, fontWeight: "800" as const, letterSpacing: -0.5 },
  sectionHead: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const, letterSpacing: -0.3 },
  cardTitle: { fontSize: 17, lineHeight: 23, fontWeight: "700" as const, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const, letterSpacing: 0 },
  bodyMed: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const, letterSpacing: 0 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const, letterSpacing: 0.2 },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: "700" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999 } as const;
export const ratingColor = (rating: 1 | 2 | 3): string => rating === 1 ? palette.developing : rating === 2 ? palette.secure : palette.strong;
export const ratingBg = (rating: 1 | 2 | 3): string => rating === 1 ? palette.coralSoft : rating === 2 ? palette.amberSoft : palette.primarySoft;
export const ratingLabel = (rating: 1 | 2 | 3): string => rating === 1 ? "Developing" : rating === 2 ? "Secure" : "Strong";
