# Skilltracker Pro — RevenueCat Integration Notes

## Chosen commercial model

Skilltracker Pro is subscription-only. The supported products are `skilltracker_pro_monthly` and `skilltracker_pro_annual`; both use the `pro` entitlement and are intended to include a seven-day trial. No lifetime product is part of this release.

## Native implementation

The Expo / React Native client uses `react-native-purchases` for StoreKit and Google Play Billing and `react-native-purchases-ui` for Customer Center. It must be exercised in an EAS development or production build; Expo Go cannot perform native purchases. The public Apple SDK key supplied for the development configuration is `test_urzRcrxrERFFQfWJYcCFpdcsSTH`. Production Apple and Google public keys are build configuration values, while private RevenueCat API/webhook keys remain server-side.

## Required RevenueCat dashboard configuration

### 1. Create the iOS subscriptions in App Store Connect

Open **My Apps → Skilltracker → Subscriptions**. Create one subscription group named **Skilltracker Pro**, then add the two auto-renewable subscriptions below. Add localised display names and descriptions, select the stated price points, and complete the required App Store Connect metadata before submitting the products with the app version.

| Product ID | Display name | Duration | Price | Introductory offer |
|---|---|---:|---:|---|
| `skilltracker_pro_monthly` | Skilltracker Pro Monthly | 1 month | US$4.99 | 7-day free trial |
| `skilltracker_pro_annual` | Skilltracker Pro Annual | 1 year | US$39.99 | 7-day free trial |

Do **not** create a lifetime product. The purchase screen has been designed and implemented exclusively for these Monthly and Annual subscriptions.

### 2. Connect App Store Connect to RevenueCat

Create or open the Skilltracker RevenueCat project, add the iOS app with bundle ID `com.ashalabs.tactiqcoach`, and connect the App Store Connect app. In RevenueCat, create the entitlement ID **`pro`**. Import or add the two App Store product IDs above and attach both to that entitlement.

Create the current offering named **`default`** with the standard packages **`$rc_monthly`** and **`$rc_annual`**, mapped respectively to the Monthly and Annual product IDs. The client reads these offering packages; it does not hard-code prices. The existing `test_…` public key is suitable only for the current test configuration. Before external or production store testing, replace it with the iOS public SDK key issued for the connected Apple app (normally prefixed `appl_`). Keep RevenueCat secret keys out of the mobile bundle.

### 3. Configure the RevenueCat webhook

In **RevenueCat → Project Settings → Integrations → Webhooks**, create a webhook using the following endpoint:

`https://soccerskilltracker.com/api/webhooks/revenuecat`

Set the webhook authorization/header value to the same confidential value stored for the deployed service as `REVENUECAT_WEBHOOK_AUTHORIZATION`. This endpoint verifies the header, stores each event idempotently, and updates the mobile entitlement record. Do not paste that secret into the app, source control, or a message.

### 4. Configure Customer Center and sandbox testing

Enable RevenueCat Customer Center for the iOS app, retaining access to restore purchases and subscription management. In App Store Connect, create a Sandbox tester under **Users and Access → Sandbox**. After TestFlight finishes processing, install the current build, make a purchase with the Sandbox tester, and verify the following flow:

| Check | Expected result |
|---|---|
| Open paywall | Monthly and Annual store-localised prices load from RevenueCat; each shows its configured seven-day trial. |
| Start trial | The native purchase sheet appears and a completed sandbox purchase unlocks Skilltracker Pro. |
| Relaunch app | The `pro` entitlement is restored from RevenueCat without losing coaching records. |
| Restore purchases | A prior sandbox purchase is recovered without a second charge. |
| Customer Center | Subscription-management controls open successfully. |
| Cancel/expire test subscription | Core data remains readable; Pro-only surfaces downgrade safely. |
| Webhook delivery | RevenueCat records a successful delivery to the Skilltracker endpoint and the service records the entitlement update. |

Record the TestFlight build number, tester account used, purchase outcome, restore outcome, and any errors in the release test plan before inviting external testers.

## Official sources

- RevenueCat Expo installation: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat SDK quickstart: https://www.revenuecat.com/docs/getting-started/quickstart
- Expo in-app purchases guide: https://docs.expo.dev/guides/in-app-purchases/
- Apple subscription setup: https://developer.apple.com/help/app-store-connect/manage-subscriptions/create-an-auto-renewable-subscription/
- Apple sandbox testing: https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-sandbox-apple-ids/
