# Tactiq Coach Release Guide

**Prepared by Manus AI · July 16, 2026**

## Release Snapshot

Tactiq Coach is a portrait-first Expo mobile application for youth football coaches. It combines the most useful parts of the original Tactiq and SkillTracker web applications into four concise areas: **Home, Squad, Capture, and Insights**. The first release stores the workspace on the device, requires no account, and does not request notification, microphone, camera, or location permissions.

| Item | Current value |
|---|---|
| Product name | Tactiq Coach |
| App version | 1.0.0 |
| Expo slug | `tactiq-mobile` |
| iOS bundle identifier | `com.app.tactiqmobile` |
| Android package | `com.app.tactiqmobile` |
| Orientation | Portrait |
| Data model | Local-first persistent workspace |
| Release profiles | `preview` and `production` in `eas.json` |
| Validation | TypeScript, Expo lint, unit tests, and Android/iOS/web exports passed |

> **Identifier decision:** Confirm that `com.app.tactiqmobile` is the permanent identifier you want before creating the first records in App Store Connect and Google Play Console. If it must use an organization-owned reverse domain, change it in `app.config.ts` before the first store upload.

## What Is Ready

The application includes a native-feeling four-tab structure, local workspace persistence, player search and profiles, six-skill assessments, one-handed live match event capture, score editing, match summaries, team trends, player progress, settings, demo-data reset, platform-safe haptics, and a custom emerald tactical-path launcher icon.

The release configuration includes separate internal-preview and production profiles. Expo documents `eas build --platform all` as the standard command for producing Android and iOS binaries, while EAS Build can also manage signing credentials when desired.[1] EAS Submit uploads completed binaries to App Store Connect or Google Play Console, but store metadata and the final review action remain in the respective store portals.[2]

## Pre-Release Decisions

Before producing store binaries, confirm the legal product name, seller or developer organization, privacy-policy URL, support URL, app category, age rating, countries, and price. Because this release stores coaching information locally and does not create user accounts, the store privacy declarations should describe only the data actually collected by the final shipped build. Revisit those declarations if analytics, cloud synchronization, accounts, crash reporting, or third-party SDKs are added later.

| Decision | Recommended first-release choice |
|---|---|
| Category | Sports or Productivity |
| Pricing | Free, unless a commercial model is already defined |
| iOS testing | TestFlight internal testing before App Review |
| Android testing | Internal testing before closed or production rollout |
| Data backup | Explain that deleting the app or resetting the workspace removes local coaching data |
| Tablet support | Validate on iPad or set `supportsTablet` to `false` before the production build |

## Build Workflow

Install and authenticate the EAS command-line tooling, connect the project to the intended Expo account, and create an internal build first. The managed project already contains `eas.json`; Expo’s production workflow can build both platform binaries and manage signing credentials.[1]

```bash
npm install --global eas-cli
eas login
cd tactiq-mobile
eas init
eas build --platform all --profile preview
```

Install the preview builds on representative iPhone and Android devices. Validate safe areas, text scaling, keyboard behavior, live match capture, match finishing, score editing, player assessment saving, local persistence after an app restart, and workspace reset. After approval, create production binaries:

```bash
eas build --platform all --profile production
```

In the Manus project interface, the saved checkpoint also enables the **Publish** action. Use that managed action when you want the platform-generated Android package; do not attempt to compile an APK manually in the sandbox.

## Apple App Store

Create the app record in App Store Connect using the final bundle identifier. Upload the production iOS build with EAS Submit or the supported Apple upload workflow. An EAS iOS submission appears in App Store Connect and TestFlight; it does not automatically publish the app.[2]

```bash
eas submit --platform ios --profile production
```

In App Store Connect, complete the app description, keywords, support and privacy URLs, age rating, app privacy responses, export-compliance response, screenshots, review contact, and review notes. Select the processed build, test it through TestFlight, then add the version for review and explicitly submit it for review. Apple’s current workflow requires the metadata and selected build to be ready before the **Add for Review** and **Submit for Review** actions.[3]

## Google Play

Create the app in Google Play Console with the same final application package. Complete the main store listing, privacy policy, data-safety form, content rating, target audience, app access, ads declaration, countries, and pricing. Produce an Android App Bundle through the production profile.

```bash
eas submit --platform android --profile production
```

Google Play supports internal, closed, open, and production tracks. Begin with internal testing, resolve all errors and material warnings, and only then advance the tested build toward production. Google’s release workflow requires a prepared store listing and App content information before rollout.[4] Expo also notes that a first Google Play upload may need to be completed manually before API-based submissions work.[2]

## Store Asset Checklist

| Asset | Preparation guidance |
|---|---|
| App icon | Installed in the project; verify appearance in both store previews |
| iPhone screenshots | Capture the final app on the required current iPhone display sizes |
| iPad screenshots | Required if iPad support remains enabled |
| Android screenshots | Capture representative phone screens without debug chrome |
| Feature graphic | Prepare a Google Play feature graphic using the emerald, chalk, and tactical-arrow system |
| Description | Explain player development and live match capture in direct coach-facing language |
| Privacy policy | Publish a URL that accurately reflects local storage and any later services |
| Support URL | Provide a working page or support email route |
| Review notes | Explain that the app is local-first and that demo workspace data can be reset in Settings |

## Recommended Store Copy

**Short description:** “Track player development and capture match signals without losing sight of the game.”

**Positioning paragraph:** Tactiq Coach gives youth football coaches one clear place to prepare, observe, and act. Review your squad, record simple player assessments, capture match events by pitch zone, and turn recent observations into practical coaching priorities. The first release works locally on the device with no account required.

## Final Go/No-Go Checklist

| Gate | Required evidence |
|---|---|
| Identity | Product name and permanent platform identifiers approved |
| Device quality | Core flows tested on at least one current iPhone and one current Android phone |
| Persistence | Assessments, matches, scores, and settings survive app restarts |
| Accessibility | Text remains readable with larger system text and primary controls remain reachable |
| Privacy | Store declarations match the exact production build and its SDKs |
| Store content | Screenshots, descriptions, category, rating, privacy policy, and support URL complete |
| Testing | TestFlight and Google internal-track testers approve the production candidate |
| Review | Correct binary selected and submitted in each store portal |

## References

[1]: https://docs.expo.dev/build/introduction/ "Expo — EAS Build"
[2]: https://docs.expo.dev/submit/introduction/ "Expo — EAS Submit"
[3]: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/ "Apple — Submit an app"
[4]: https://support.google.com/googleplay/android-developer/answer/9859348?hl=en "Google Play Console Help — Prepare and roll out a release"
