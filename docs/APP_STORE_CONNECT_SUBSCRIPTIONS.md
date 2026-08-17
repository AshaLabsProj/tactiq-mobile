# Skilltracker Pro — App Store Connect Subscription Runbook

This guide creates the two intended **auto-renewable subscriptions** for the existing iOS app, whose bundle identifier is `com.ashalabs.tactiqcoach`. It deliberately does **not** create a lifetime product.

| Plan | Product ID | Duration | United States price | Trial |
|---|---|---:|---:|---:|
| Skilltracker Pro Monthly | `skilltracker_pro_monthly` | 1 month | US$4.99 | 7 days free |
| Skilltracker Pro Annual | `skilltracker_pro_annual` | 1 year | US$39.99 | 7 days free |

## Before you begin

Sign in at [App Store Connect](https://appstoreconnect.apple.com/apps) as the Account Holder, Admin, App Manager, Developer, or Marketing user for the Skilltracker app. Open **Apps → Skilltracker**. The release code has already been built as version 1.0.0 (build 9), but the products must exist in both App Store Connect and RevenueCat before the app can show live store prices or complete a real sandbox purchase.

## 1. Create one subscription group

In the sidebar under **Monetization**, select **Subscriptions**. Click the **+** button in the Subscription Groups section and create a single group with this reference name:

`Skilltracker Pro`

Use a single group because Monthly and Annual unlock the same Pro benefit. Apple limits each customer to one active subscription in a group, which prevents duplicate billing for the two variants. Add the group localisation in English with display name **Skilltracker Pro** and a short description such as **Advanced coaching history, insights, sync, and tactical tagging**.

## 2. Create the Monthly subscription

Open the **Skilltracker Pro** group and click **Create**. Enter the following values, then save:

| Field | Value |
|---|---|
| Reference name | `Skilltracker Pro Monthly` |
| Product ID | `skilltracker_pro_monthly` |
| Subscription duration | `1 Month` |
| Subscription price | Select the US$4.99 price point for the United States storefront, then keep Apple’s comparable prices or set regional prices deliberately. |
| Availability | Every planned App Store country or region. |
| English display name | `Skilltracker Pro Monthly` |
| English description | `Full season history, private sync, detailed tactical tagging, and practice-to-pitch trends.` |

Add a current **Free Trial** introductory offer in the Subscription Prices area. Select the applicable storefronts, choose **Free**, and set the duration to **1 Week**. The app’s paywall describes this as **7 days free**.

## 3. Create the Annual subscription

From the same group, click **+** and create the annual plan with the values below.

| Field | Value |
|---|---|
| Reference name | `Skilltracker Pro Annual` |
| Product ID | `skilltracker_pro_annual` |
| Subscription duration | `1 Year` |
| Subscription price | Select the US$39.99 price point for the United States storefront. |
| Availability | Every planned App Store country or region. |
| English display name | `Skilltracker Pro Annual` |
| English description | `Full season history, private sync, detailed tactical tagging, and practice-to-pitch trends.` |

Create the same **Free / 1 Week** introductory offer. Place Monthly and Annual at the **same subscription level** because they provide identical Pro access with different billing periods.

## 4. Complete review information and submit correctly

For each product, set the appropriate tax category and add App Review information. Upload a screenshot of the in-app Skilltracker Pro paywall and add this reviewer note:

> Skilltracker Pro is an optional auto-renewing subscription. The paywall appears from Settings or when a Pro-only feature is selected. Monthly and Annual plans both include a seven-day free trial. Restore Purchases and subscription management are available in the paywall and Settings. Terms: https://soccerskilltracker.com/terms. Privacy: https://soccerskilltracker.com/privacy.

Click **Add for Review** for both products. Apple requires the first auto-renewable subscription and its first group to be submitted with a new app version. Therefore, when you are ready for the first public App Store submission, create the next editable App Store version, attach both subscription products to that submission, and submit them together. This is distinct from TestFlight processing.

## 5. Connect the products in RevenueCat

In the RevenueCat Skilltracker project, add or open the Apple app with bundle ID `com.ashalabs.tactiqcoach` and connect its App Store Connect app. Then create an entitlement with this exact identifier:

`pro`

Import both Apple products and attach both to `pro`. Create the current offering named `default`, mapping the monthly product to RevenueCat’s standard **Monthly** package (`$rc_monthly`) and the annual product to its standard **Annual** package (`$rc_annual`). The mobile code reads the store offering rather than hard-coding prices.

Use the iOS public SDK key RevenueCat issues for the connected Apple app (normally beginning `appl_`) for actual StoreKit/App Store testing. The existing `test_…` key is only for the current test-store setup. Do not put a RevenueCat secret key into the mobile app.

## 6. Configure the RevenueCat webhook

Create a RevenueCat webhook at this URL:

`https://soccerskilltracker.com/api/webhooks/revenuecat`

Set its authorization value to the same confidential value stored on the deployed service as `REVENUECAT_WEBHOOK_AUTHORIZATION`. Do not share that value in messages, app code, or source control. The server verifies the header, handles duplicate deliveries safely, records the lifecycle event, and updates the account’s Pro entitlement.

## 7. Test the real purchase safely

In App Store Connect, open **Users and Access → Sandbox**, click **+**, and create a dedicated Sandbox Apple Account. Its email address must not already be used by an Apple Account. After TestFlight has finished Apple processing, install Skilltracker version 1.0.0 (build 9) from TestFlight. Test a Monthly trial, close and reopen the app, use **Restore purchases**, open Customer Center, and verify webhook delivery in RevenueCat.

Do not use a real personal Apple Account to test a sandbox transaction, and never provide any Apple ID password or verification code in chat.

## References

1. [Apple: Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/)
2. [Apple: Set up introductory offers](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/)
3. [Apple: Create a Sandbox Apple Account](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account/)
4. [RevenueCat: Apple App Store and TestFlight testing](https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store)
