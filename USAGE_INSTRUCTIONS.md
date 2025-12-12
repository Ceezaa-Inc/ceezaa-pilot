# Ceezaa MVP - Setup & Testing Instructions

Follow these steps to run the Ceezaa app on your phone.

---

## Step 1: Install Node.js

### Mac
Open Terminal and run:
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### Windows
1. Go to https://nodejs.org
2. Download the **LTS** version (green button)
3. Run the installer, click Next through all steps
4. Restart your computer after installation

### Verify Installation
Open Terminal (Mac) or Command Prompt (Windows):
```bash
node --version
# Should show v18.x.x or higher

npm --version
# Should show 9.x.x or higher
```

---

## Step 2: Install Expo Go on Your Phone

Download **Expo Go** from:
- **iPhone**: App Store
- **Android**: Google Play Store

---

## Step 3: Clone & Setup the Project

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ceezaa-mvp.git

# Navigate to mobile folder
cd ceezaa-mvp/mobile

# Install dependencies (this takes 2-3 minutes)
npm install
```

---

## Step 4: Run the App

```bash
# Start the development server
npx expo start
```

You'll see a QR code in the terminal.

---

## Step 5: Open on Your Phone

1. **iPhone**: Open the Camera app and scan the QR code
2. **Android**: Open Expo Go app and scan the QR code

The app will load on your phone (first load takes 30-60 seconds).

---

## Testing the App Flow

Once the app loads, test this flow:

1. **Welcome Screen** - Tap "Get Started"
2. **Login Screen** - Enter any 10-digit number, tap "Continue"
3. **OTP Screen** - Enter any 6 digits (e.g., 123456)
4. **Quiz** - Answer all 5 questions
5. **Taste Card** - View your taste profile, tap "Continue"
6. **Card Link** - Tap "Skip for now"
7. **Tabs** - You should now see the main app with 4 tabs:
   - Pulse (home)
   - Discover
   - Vault
   - Profile

---

## Troubleshooting

### "command not found: node"
Node.js isn't installed. Follow Step 1 again.

### "command not found: npx"
Run `npm install -g expo-cli` then try again.

### QR code won't scan
- Make sure your phone and computer are on the **same WiFi network**
- In terminal, press `w` to open web version instead

### App crashes on load
```bash
# Clear cache and restart
npx expo start --clear
```

### Stuck on white screen
Wait 30-60 seconds for the JavaScript bundle to load.

---

## Quick Commands Reference

```bash
# Start app
npx expo start

# Start with cache cleared
npx expo start --clear

# Run tests
npm test
```
