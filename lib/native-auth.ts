import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";
import * as Auth from "@/lib/_core/auth";

const API_URL = (process.env.EXPO_PUBLIC_SKILLTRACKER_API_URL ?? "https://soccerskilltracker.com").replace(/\/$/, "");
const GOOGLE_IOS_CLIENT_ID = "469394796444-kpntk6nvjo8u5sk5dko3e9eg7864q23p.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "469394796444-6nh9skvmefb2v15vebiblnsl0gkinp1i.apps.googleusercontent.com";
const GOOGLE_WEB_CLIENT_ID = "469394796444-b5hc8ap6eam5tt8ji6t31dbvh474v097.apps.googleusercontent.com";

type NativeSession = { sessionToken: string; user: Auth.User };

async function exchange<T>(procedure: string, input: unknown): Promise<T> {
  const response = await fetch(`${API_URL}/api/trpc/${procedure}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ json: input }) });
  const body = await response.json() as { result?: { data?: { json?: T } }; error?: { json?: { message?: string } } };
  if (!response.ok || body.error) throw new Error(body.error?.json?.message ?? "Sign-in could not be completed.");
  if (!body.result?.data?.json) throw new Error("Skilltracker received an invalid sign-in response.");
  return body.result.data.json;
}

async function persist(session: NativeSession) {
  await Auth.setSessionToken(session.sessionToken);
  await Auth.setUserInfo(session.user);
  return session.user;
}

function configureGoogle() {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID, offlineAccess: false, scopes: ["openid", "email", "profile"] });
}

export async function signInWithGoogle(): Promise<Auth.User | null> {
  configureGoogle();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) throw new Error("Google did not provide an identity token. Please try again.");
  return persist(await exchange<NativeSession>("nativeAuth.google", { idToken: response.data.idToken }));
}

export async function signInWithApple(): Promise<Auth.User | null> {
  if (Platform.OS !== "ios" || !(await AppleAuthentication.isAvailableAsync())) throw new Error("Sign in with Apple is only available on a compatible iPhone or iPad.");
  try {
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
    if (!credential.identityToken) throw new Error("Apple did not provide an identity token. Please try again.");
    const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ") || undefined;
    return persist(await exchange<NativeSession>("nativeAuth.apple", { idToken: credential.identityToken, name }));
  } catch (error) {
    if ((error as { code?: string }).code === "ERR_REQUEST_CANCELED") return null;
    throw error;
  }
}
