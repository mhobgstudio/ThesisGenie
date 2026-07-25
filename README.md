# ThesisGenie 🎓✨

> From a spark of an idea to a fully realized thesis. AI precision blended with human artistry.

A premium static landing page for an academic writing service, featuring 3D visuals, Paystack payments, and multi-channel order notifications.

## ✨ Features

- **3D Academic Background** — Floating graduation cap + golden A+ badges (Three.js)
- **Parallax Starfield** — Depth-shifting background that responds to scroll
- **Paystack Payments** — Secure payment popup with tiered pricing (₵49 / ₵89 / ₵149)
- **Google Forms Integration** — Auto-submits orders to your Google Sheet
- **Email Notifications** — New paid orders sent to your inbox via FormSubmit
- **WhatsApp Receipt** — Clickable payment receipt link for customers
- **Smooth Animations** — Scroll-triggered reveals, gradient borders, shimmer effects

## 🚀 Quick Deploy

### Option 1: Vercel (Recommended)

1. Push to GitHub: `git push origin main`
2. Go to [vercel.com](https://vercel.com) → Import your `ThesisGenie` repo
3. Vercel auto-detects it's static → deploys with **HTTPS** instantly
4. Your URL: `https://thesisgenie.vercel.app`

### Option 2: GitHub Pages

1. Go to repo **Settings → Pages**
2. Under "Branch", select `gh-pages` → Save
3. Wait 1-2 minutes
4. Your URL: `https://mhobgstudio.github.io/ThesisGenie/`

## 🧪 Testing Payments

Use these Paystack test credentials:

| Field | Value |
|---|---|
| Card Number | `4084084084084081` |
| Expiry | Any future date (e.g. `12/28`) |
| CVV | Any 3 digits (e.g. `123`) |
| PIN | Any 4 digits (e.g. `1234`) |
| OTP | Click "Success" on the test OTP page |

## 📧 Email Setup

After your first deployment:
1. Submit a test order (use test card)
2. Check **zampacto15@gmail.com** inbox
3. Click the **FormSubmit verification link** to authorize future emails

## 🧩 Tech Stack

- **Vanilla HTML/CSS/JS** — No framework, single-page app
- **Three.js** — 3D graphics via CDN
- **Paystack Inline** — Payment processing
- **Google Forms** — Data collection
- **FormSubmit** — Email forwarding

## 📁 Project Structure

```
index.html   → Single-page application (all CSS + JS inline)
README.md    → This file
```

## 📬 Submission Flow

```
User fills form
       ↓
Paystack payment popup
       ↓
Payment success
       ↓
├── Google Forms (your sheet) ✅
├── Email to zampacto15@gmail.com ✅
└── WhatsApp receipt link (user clicks) ✅
```

## 🔧 Customization

- **Pricing**: Edit `tierPricing` and `tierLabels` in `handleDraftForm()`
- **WhatsApp number**: Update the `wa.me/233501353546` links
- **Google Form fields**: Update the `entry.xxxxx` IDs in `handleDraftForm()`
- **Email recipient**: Update the FormSubmit URL in `sendEmailNotification()`
- **Colors**: Edit the `:root` CSS variables
