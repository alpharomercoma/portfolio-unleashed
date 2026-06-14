# Alpha — Android TWA (Google Play)

Wraps the live PWA at **https://alpharomer.com** as a Trusted Web Activity and
publishes it to Google Play. Package id: **`com.alpharomer.app`**. App name: **Alpha**.

The web side is already done and deployed: TWA-grade manifest (`/manifest.json`,
lime theme), Serwist offline support, and `/.well-known/assetlinks.json` (waiting
for fingerprints). The steps below run on **your machine, interactively** —
Bubblewrap downloads a managed JDK 17 + Android SDK on first run and creates your
signing keystore (secret passwords you must own and back up).

Prereq: Node (have it). Everything else Bubblewrap installs into `~/.bubblewrap`.

---

## Phase 2 — Generate the app

```bash
cd twa
npx @bubblewrap/cli@latest init --manifest https://alpharomer.com/manifest.json
```

First run asks to install the JDK 17 + Android SDK → **Y** (accept the SDK
license). Then a wizard; accept the defaults pulled from the live manifest EXCEPT
the package id:

| Prompt                       | Answer                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| Domain                       | `alpharomer.com` (default)                                        |
| URL path                     | `/` (default)                                                     |
| Application name             | `Alpha Romer Coma` (default)                                      |
| Short name                   | `Alpha` (default)                                                 |
| **Application ID / package** | **type `com.alpharomer.app`** (default would be `com.alpharomer`) |
| Display mode                 | `standalone` (default)                                            |
| Status bar / theme color     | `#E0FF4F` (default, lime)                                         |
| Splash screen color          | `#E0FF4F` (default, lime)                                         |
| Navigation bar color         | `#052B42` (navy)                                                  |
| Icon URL                     | `https://alpharomer.com/web-app-manifest-512x512.png` (default)   |
| Maskable icon URL            | same (default)                                                    |
| Monochrome icon URL          | leave blank                                                       |
| Play Billing / geolocation   | No                                                                |
| Key store location           | `./android.keystore` (default)                                    |
| Key alias                    | `android` (default)                                               |

Then build (this is where the keystore is created):

```bash
npx @bubblewrap/cli build
```

- It prompts to create the keystore: set a **keystore password** + **key
  password** and a certificate name/org/country. **WRITE THESE DOWN / back up
  `twa/android.keystore` + the passwords** somewhere safe (a password manager).
- Outputs: **`app-release-bundle.aab`** (upload to Play) and
  **`app-release-signed.apk`** (sideload to a device to test).

Optional sanity check: `npx @bubblewrap/cli validate --url https://alpharomer.com`.

---

## Phase 3 — Verify the app ↔ site link (removes the URL bar)

1. Get the **upload key** SHA-256:
   ```bash
   npx @bubblewrap/cli fingerprint list
   ```
2. In **Play Console**: create the app, upload the `.aab` to an **Internal
   testing** release, and opt into **Play App Signing** (default). Then copy the
   **App signing key** SHA-256 from _Test and release → Setup → App signing_.
3. Write both fingerprints into the site's assetlinks file and redeploy:
   ```bash
   # from twa/
   npx @bubblewrap/cli fingerprint add <PLAY_APP_SIGNING_SHA256> --name=play
   npx @bubblewrap/cli fingerprint generateAssetLinks --output ../public/.well-known/assetlinks.json
   # then: commit + push -> Vercel deploy
   ```
   (Or just paste me both SHA-256s and I'll edit `public/.well-known/assetlinks.json`.)
4. Verify: install from the Internal testing track → the app should open
   **full-screen with no browser URL bar**. Google's Statement List Tester should
   return the app for `https://alpharomer.com`.

---

## Phase 4 — Store listing (assets are ready in `twa/play-assets/`)

- **App icon (512×512, <1MB):** `twa/play-assets/app-icon-512.png`
- **Feature graphic (1024×500):** `twa/play-assets/feature-graphic.png`
- **Phone screenshots (1080×1920, 9:16):** `twa/play-assets/phone-{home,speaking,blog,stats}.png`
  (hero, PyTorch Conf Europe talk card, a writing post, and the $376K/92%/4x/25+ + affiliations band)
- **7-inch tablet (1920×1080, 16:9):** `twa/play-assets/tablet7-{home,speaking,blog}.png`
- **10-inch tablet (2560×1440, 16:9):** `twa/play-assets/tablet10-{home,speaking,blog}.png`
- **Privacy policy URL:** `https://alpharomer.com/privacy`
- **Short description (78/80):**
  `ML engineer building intelligent systems that scale. Talks, work, and writing.`
- **Full description:**
  > Alpha is the official app of Alpha Romer Coma, a machine learning engineer
  > working on multimodality and accelerated computing. It is the fastest way to
  > explore the work behind the title: selected projects and research, talks and
  > workshops, writing, and recognition. The app installs to your home screen,
  > loads instantly, and works offline.
  >
  > Speaking: talks and workshops, including PyTorch Conference Europe 2026, plus
  > sessions with the Microsoft, Google, and AWS communities.
  >
  > Research and work: multimodal AI and accelerated computing, including a shipped
  > vision-language model and benchmarks across modern accelerators, backed by a
  > $376,000 Google Cloud compute grant.
  >
  > Writing: practical notes and essays on building intelligent systems and the
  > engineering behind them.
  >
  > Recognition: awards, honors, and a running record of the work.
  >
  > Built as a Progressive Web App, Alpha mirrors alpharomer.com with offline
  > support and a clean, distraction-free reading experience. No ads. No
  > third-party tracking. Just the work.
- Complete the **content rating** questionnaire, **Data safety** form (analytics
  only; no data sold), and **target audience** (13+, not directed at children).

Promote Internal testing → Production when you're happy.

---

## Security / git

- **Never commit** `android.keystore`, `*.jks`, `*.apk`, `*.aab` (gitignored).
- Back up the keystore + passwords. With Play App Signing the upload key is
  resettable, but losing it is still a hassle.
