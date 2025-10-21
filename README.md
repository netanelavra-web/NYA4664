# Whispr - הודעה לעתיד שלך

> **תקשורת רגשית עם עצמך בזמן** - כתיבת הודעות לעתיד, פתיחתן בתאריך יעד, וניהול תאריכים רגשיים

## 🌟 Overview

Whispr is a time-capsule messaging application that enables emotional communication with yourself across time. Write messages to your future self, open them on target dates, and manage emotional calendar events.

### Core Features

- **🕰️ Time Capsule Messages**: Write text, audio, video, or image messages to yourself or others
- **🎨 3D Time Cube UI**: Interactive 3D cube interface with gesture-based navigation
- **🔐 End-to-End Encryption**: All messages encrypted with E2EE using hybrid RSA-OAEP + AES-GCM
- **📅 Emotional Calendar**: Track birthdays, anniversaries, memorials, and personal milestones
- **🤖 AI Assistant**: OpenAI-powered writing suggestions and emotional analysis
- **🌍 Multilingual**: Full RTL/LTR support for Hebrew and English
- **📱 PWA-Ready**: Mobile-first, installable progressive web app
- **🔔 Smart Notifications**: Firebase Cloud Messaging for timely reminders
- **👥 Group Capsules**: Share time capsules with multiple recipients

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: TailwindCSS with custom RTL support
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **Animations**: Framer Motion
- **i18n**: next-i18next (Hebrew RTL + English LTR)
- **TypeScript**: Full type safety

### Backend
- **Authentication**: Firebase Auth (Email/Password + Google OAuth)
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage (encrypted media)
- **Functions**: Cloud Functions (Node.js)
- **Messaging**: Firebase Cloud Messaging (FCM)
- **AI**: OpenAI API (GPT-4)

### Security
- **E2EE**: Client-side encryption with RSA-OAEP (4096-bit) + AES-GCM-256
- **Key Management**: Password-derived key encryption for private keys
- **Privacy**: Zero-knowledge architecture - server never sees plaintext

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd whispr
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI
OPENAI_API_KEY=sk-...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_KEY=your_vapid_key
```

### 3. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy Cloud Functions
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
vercel
```

## 📱 PWA Setup

The app is PWA-ready with:
- Service worker for offline support
- Installable on mobile devices
- Push notification support

## 🔒 Security Model

### End-to-End Encryption Flow

1. **User Registration**: Generate RSA-4096 key pair, encrypt private key with password
2. **Message Creation**: Encrypt with AES-256, wrap key with recipient's RSA public key
3. **Message Opening**: Decrypt private key with password, unwrap AES key, decrypt content

## 🎨 UI/UX Design

### 3D Time Cube Faces

- **Front (Now)**: Upcoming messages and events
- **Top (Create)**: Message creation with AI
- **Bottom (Events)**: Emotional calendar
- **Timeline**: Horizontal scrolling timeline

### Gestures

- Swipe Up → Create
- Swipe Down → Events
- Swipe Horizontal → Timeline

## 🤖 AI Features

- Writing suggestions
- Emotional analysis
- Monthly insights

## 📊 Monetization

| Tier | Price | Features |
|------|-------|----------|
| Free | ₪0 | Text messages, ads |
| Pro | ₪12.90/mo | Audio/video, no ads |
| Family | Custom | Unlimited capsules |
| Therapist | B2B | Analytics dashboard |

## 🧪 Testing

```bash
npm run test
```

## 📄 License

Copyright © 2025 Whispr. All rights reserved.

---

**Built with 💛 for emotional connection across time**
