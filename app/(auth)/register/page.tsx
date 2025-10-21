'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { generateUserKeyPair, encryptPrivateKey } from '@/lib/crypto/encryption';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { User } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      setLoading(false);
      return;
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: formData.displayName,
      });

      // Generate encryption keys
      const { publicKey, privateKey } = await generateUserKeyPair();

      // Encrypt private key with password
      const encryptedPrivateKeyData = await encryptPrivateKey(
        privateKey,
        formData.password
      );

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: formData.email,
        displayName: formData.displayName,
        photoURL: user.photoURL || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: 'he-IL',
        subscriptionTier: 'free',
        createdAt: Timestamp.now(),
        settings: {
          darkMode: 'auto',
          notifications: {
            messages: true,
            events: true,
          },
          aiInsights: true,
        },
        publicKey,
        encryptedPrivateKey: JSON.stringify(encryptedPrivateKeyData),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      router.push('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'שגיאה ביצירת חשבון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-pale-blue to-soft-gold p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-deep-blue mb-2">Whispr</h1>
            <p className="text-warm-gray">הצטרף עכשיו</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" dir="rtl">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2" dir="rtl">
                שם מלא
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
                className="input"
                dir="rtl"
                placeholder="השם שלך"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2" dir="rtl">
                דואר אלקטרוני
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="input"
                dir="ltr"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2" dir="rtl">
                סיסמה
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="input"
                dir="ltr"
                placeholder="לפחות 8 תווים"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2" dir="rtl">
                אימות סיסמה
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="input"
                dir="ltr"
                placeholder="הזן סיסמה שוב"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'יוצר חשבון...' : 'הרשמה'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm" dir="rtl">
            <span className="text-warm-gray">כבר יש לך חשבון? </span>
            <Link href="/login" className="text-soft-gold hover:underline font-medium">
              התחבר כאן
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
