# 🎓 Coursera Auto-Pilot

> Automatically skip videos, dismiss flashcard popups, and bypass quiz questions on Coursera — so you can breeze through course content effortlessly.

![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Compatible-green?logo=tampermonkey&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)
![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Firefox%20%7C%20Edge-orange)

---

## ✨ Features

| Feature | Description |
|---|---|
| ⏩ **Auto-Skip Videos** | Jumps to 7 seconds before the end of any video, regardless of length |
| 📝 **Auto-Dismiss Flashcards** | Clicks "Continue learning" on the flashcard recap popup |
| ❓ **Auto-Skip Questions** | Clicks "Skip" on in-video quiz questions |
| 🔁 **Works on All Pages** | Detects URL changes in Coursera's single-page app |
| 🔄 **Retry Logic** | Keeps trying until the video seek actually works (up to 60 retries) |

---

## 📦 Prerequisites

You need a **userscript manager** browser extension. Install one of these:

| Browser | Extension | Install Link |
|---|---|---|
| Chrome | Tampermonkey | [Install from Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | Tampermonkey | [Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Edge | Tampermonkey | [Install from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |

---

## 🚀 Installation (Step-by-Step)

### Step 1: Install Tampermonkey

1. Go to the install link for your browser from the table above
2. Click **"Add to Chrome"** (or equivalent for your browser)
3. Confirm the installation when prompted

### Step 2: Create a New Script

1. Click the **Tampermonkey icon** in your browser toolbar (top-right)
2. Click **"Create a new script..."**

   ![Step: Click create new script](https://img.shields.io/badge/Tampermonkey_Menu-→_Create_New_Script-informational?style=for-the-badge)

3. You'll see a default template in the editor — **select all** the text (`Ctrl+A`) and **delete** it

### Step 3: Paste the Script

1. Open the [`coursera-auto-pilot.user.js`](./coursera-auto-pilot.user.js) file from this repo
2. **Copy the entire content** of the file
3. **Paste** it into the Tampermonkey editor (where you deleted the template)

### Step 4: Save

1. Press **`Ctrl + S`** to save the script
2. You should see a confirmation that the script was saved
3. The script is now **active** ✅

### Step 5: Use It!

1. Go to [coursera.org](https://www.coursera.org)
2. Open any course video
3. The script will automatically:
   - ⏩ Jump the video to **7 seconds before the end**
   - 📝 Click **"Continue learning"** on flashcard popups
   - ❓ Click **"Skip"** on quiz questions

---

## 🔍 How to Verify It's Working

1. Open your browser's **Developer Tools** → Press `F12`
2. Go to the **Console** tab
3. You should see logs like:

```
[Coursera Bot] 🚀 Script loaded — auto-skipping videos & dismissing popups
[Coursera Bot] ⏩ SUCCESS! Jumped to 253.0s / 260.0s
[Coursera Bot] ✅ Clicked "Continue learning"
[Coursera Bot] ✅ Clicked "Skip"
```

---

## ⚙️ Configuration

You can customize these values at the top of the script:

```js
const CHECK_INTERVAL_MS = 1000;    // How often to check (milliseconds)
const CLICK_DELAY_MS = 300;        // Delay before clicking buttons
const SKIP_BEFORE_END = 7;         // Seconds before end to jump to
```

| Variable | Default | Description |
|---|---|---|
| `CHECK_INTERVAL_MS` | `1000` | Polling interval in ms |
| `CLICK_DELAY_MS` | `300` | Delay before auto-clicking |
| `SKIP_BEFORE_END` | `7` | Jump to this many seconds before the video ends |

---

## 🛑 How to Disable

1. Click the **Tampermonkey icon** in your toolbar
2. Click the **toggle switch** next to "Coursera Auto-Pilot" to disable it
3. To re-enable, click the toggle again

---

## ⚠️ Disclaimer

This tool is for **educational/personal use only**. Use it responsibly. The author is not responsible for any consequences arising from the use of this script, including but not limited to violations of Coursera's Terms of Service.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🤝 Contributing

Feel free to open issues or submit pull requests if you have improvements!

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request
