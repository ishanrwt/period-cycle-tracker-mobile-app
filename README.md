# Regina — Period Tracker

**Regina** is a React Native period-tracking app built with [Expo](https://expo.dev). It helps users log cycles, view phase forecasts, receive cycle reminders, and track insights from a calm, mobile-first UI.

---

## Features

- **Today** — Cycle day ring, live period logging (start/end), historical cycle entry, and upcoming phase cards
- **Cycle calendar** — Month view with phase-colored days; navigate previous/next months
- **Insights** — Cycle statistics driven by logged history
- **Profile** — Name, avatar (gallery or presets), and cycle summary
- **Onboarding** — First-launch name + profile setup
- **Cycle engine** — Average cycle length (gaps &gt; 45 days ignored), phase predictions (menstruation, follicular, ovulation, luteal)
- **Local notifications** — Period reminder (2 days early) and phase-change alerts
- **OTA updates** — EAS Update with in-app “Refresh App” prompt when a new bundle is available

---

## Tech stack

| Layer | Tools |
|--------|--------|
| Framework | Expo SDK 54, React Native 0.81, React 19 |
| Navigation | React Navigation (bottom tabs) |
| State | React Context + AsyncStorage |
| UI | React Native, `react-native-svg` |
| Notifications | `expo-notifications` |
| Updates | `expo-updates` (EAS Update) |
| Builds | EAS Build |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- [Expo Go](https://expo.dev/go) (optional, for quick JS testing)
- [EAS CLI](https://docs.expo.dev/build/setup/) for APK/IPA builds and OTA (`npm install -g eas-cli`)
- Expo account (for EAS Build / Update)

---

## Getting started

```bash
# Clone the repository
git clone <your-repo-url>
cd period-tracker

# Install dependencies
npm install

# Start the dev server
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

> **Note:** Expo Go does **not** show your custom app icon, native splash, or OTA behavior. Use an **EAS build** to test those.

---

## Project structure

```
period-tracker/
├── App.js                 # Entry: fonts, splash, OTA listener
├── app.json               # Expo config (name, icons, splash, updates)
├── eas.json               # EAS Build & Update channels
├── assets/                # Icons, splash source, profile presets
├── scripts/
│   └── generate-padded-icon.mjs
└── src/
    ├── components/        # AnimatedSplash, OtaUpdatePrompt
    ├── constants/       # Theme colors
    ├── context/           # EngineContext (history, profile, engine)
    ├── navigation/        # AppNavigator, AppBootstrap
    ├── screens/           # Today, Calendar, Insights, Profile, Onboarding
    └── utils/
        ├── engine.js      # Cycle math & phase dates
        └── notifications.js
```

---

## Cycle engine (summary)

- Periods are stored as `{ type: 'period', startDate, endDate }` (`endDate` may be `null` for an active cycle).
- **Average cycle** is computed from consecutive `startDate` gaps; gaps **over 45 days** are excluded.
- **Phase forecast** is anchored on the most recent period start, with dynamic bleed length for open vs closed cycles.

Core logic lives in `src/utils/engine.js`.

---

## App icons

Source artwork: `assets/icon.png`.

Generate launcher assets (trimmed foreground + padded app icon):

```bash
npm run generate-icon
```

Outputs:

- `assets/icon-foreground.png` — Android adaptive icon foreground
- `assets/icon-app.png` — iOS icon and fallbacks

Commit both generated files (and `icon.png`) before building.

---

## Building with EAS

Log in and configure the project (first time only):

```bash
eas login
eas build:configure
```

### Preview APK (internal testers)

```bash
eas build --profile preview --platform android
```

### Production

```bash
eas build --profile production --platform android
# eas build --profile production --platform ios
```

Install the APK from the EAS build page or QR link.

---

## Over-the-air (OTA) updates

OTA only works on **installed builds** (not Expo Go). Channels match `eas.json`:

| Profile | Channel |
|---------|---------|
| preview | `preview` |
| production | `production` |

Publish a JS update:

```bash
# After testers have a preview build installed
npm run update:preview

# Production
npm run update:production
```

When an update is available, the app shows an alert with **Refresh App** (`fetchUpdateAsync` → `reloadAsync`).

**Requires a new native build when you change:** native modules, `app.json` icons/splash, or `runtimeVersion` / app version policy.

---

## Useful scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start with Android |
| `npm run ios` | Start with iOS |
| `npm run generate-icon` | Regenerate `icon-app.png` / `icon-foreground.png` |
| `npm run update:preview` | Push OTA to preview channel |
| `npm run update:production` | Push OTA to production channel |

---

## Configuration

- **App display name:** Regina (`app.json` → `expo.name`)
- **Android package:** `com.ishanrwt.periodtracker`
- **EAS project ID:** see `app.json` → `extra.eas.projectId`
- **Splash:** dusty pink `#E6C6C6` with centered logo (`./assets/icon.png`)

---

## License

Private project — all rights reserved unless otherwise specified by the repository owner.
