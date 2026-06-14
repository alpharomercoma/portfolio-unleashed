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

- **App icon (512×512):** `public/web-app-manifest-512x512.png`
- **Feature graphic (1024×500):** `twa/play-assets/feature-graphic.png`
- **Phone screenshots (1080×2160):** `twa/play-assets/phone-{home,speaking,gallery,blog}.png`
- **Privacy policy URL:** `https://alpharomer.com/privacy`
- **Short description (≤80):** `ML engineer building intelligent systems that scale — talks, work, and writing.`
- **Full description (draft):**
  > Alpha is the official app for Alpha Romer Coma, a machine learning engineer
  > focused on multimodality and accelerated computing. Browse selected work and
  > projects, talks and workshops (including PyTorch Conference Europe), writing,
  > recognition, and a gallery — all in a fast, installable, offline-capable app.
- Complete the **content rating** questionnaire, **Data safety** form (analytics
  only; no data sold), and **target audience** (not directed at children).

Promote Internal testing → Production when you're happy.

---

## Security / git

- **Never commit** `android.keystore`, `*.jks`, `*.apk`, `*.aab` (gitignored).
- Back up the keystore + passwords. With Play App Signing the upload key is
  resettable, but losing it is still a hassle.
