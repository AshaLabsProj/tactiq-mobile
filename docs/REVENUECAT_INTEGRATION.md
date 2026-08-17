# Skilltracker Pro — RevenueCat Integration Notes

## Chosen commercial model

Skilltracker Pro is subscription-only. The supported products are `skilltracker_pro_monthly` and `skilltracker_pro_annual`; both use the `pro` entitlement and are intended to include a seven-day trial. No lifetime product is part of this release.

## Native implementation

The Expo / React Native client uses `react-native-purchases` for StoreKit and Google Play Billing and `react-native-purchases-ui` for Customer Center. It must be exercised in an EAS development or production build; Expo Go cannot perform native purchases. The public Apple SDK key supplied for the development configuration is `test_urzRcrxrERFFQfWJYcCFpdcsSTH`. Production Apple and Google public keys are build configuration values, while private RevenueCat API/webhook keys remain server-side.

## Required RevenueCat dashboard configuration

1. Create a Skilltracker project and connect the existing iOS app (`com.ashalabs.tactiqcoach`) and the matching Google Play app.
2. Create the `pro` entitlement.
3. Attach the App Store and Play Store monthly and annual products to `pro`.
4. Create a current offering containing annual and monthly packages.
5. Configure the seven-day trial in each store product and connect a RevenueCat paywall / Customer Center configuration.
6. Configure a webhook to the production Skilltracker service before enforcing paid cloud sync server-side.

## Official sources

- RevenueCat Expo installation: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat SDK quickstart: https://www.revenuecat.com/docs/getting-started/quickstart
- Expo in-app purchases guide: https://docs.expo.dev/guides/in-app-purchases/
