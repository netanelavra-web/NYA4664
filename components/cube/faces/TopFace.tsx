'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { encryptMessage, encryptFile } from '@/lib/crypto/encryption';
import { generateWritingSuggestions } from '@/lib/ai/openai';
import type { MessageType, EmotionTone } from '@/types';

interface TopFaceProps {
  locale: 'he-IL' | 'en-US';
}

export default function TopFace({ locale }: TopFaceProps) {
  const { t } = useTranslation();
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [emotionTone, setEmotionTone] = useState<EmotionTone>('other');
  const [recipientType, setRecipientType] = useState<'self' | 'other' | 'group'>('self');
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);

  // Get AI suggestions
  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone: emotionTone,
          partialText: content,
          locale,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.data.suggestions);
        setShowAiHelper(true);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create message
  const handleCreateMessage = async () => {
    if (!content && !mediaFile) return;
    if (!openDate) return;

    setLoading(true);

    try {
      const userId = 'current-user-id'; // TODO: Get from auth context
      const userPublicKey = 'user-public-key'; // TODO: Get from user profile

      // Prepare recipient keys
      const recipientPublicKeys: Record<string, string> = {
        [userId]: userPublicKey, // Always include self
      };

      // TODO: Fetch public keys for other recipients

      // Encrypt content
      const encrypted = await encryptMessage(content, recipientPublicKeys);

      let mediaURL: string | undefined;
      let mediaMetadata: any;

      // Handle media upload
      if (mediaFile) {
        const { encryptedFile, metadata } = await encryptFile(mediaFile, recipientPublicKeys);

        const storageRef = ref(
          storage,
          `media/${userId}/${Date.now()}_${mediaFile.name}`
        );

        await uploadBytes(storageRef, encryptedFile);
        mediaURL = await getDownloadURL(storageRef);
        mediaMetadata = metadata;
      }

      // Create message document
      await addDoc(collection(db, 'messages'), {
        ownerId: userId,
        recipientIds: [userId, ...recipientEmails], // TODO: Convert emails to user IDs
        type: messageType,
        title,
        content: encrypted.ciphertext,
        mediaURL,
        emotionTone,
        createdAt: Timestamp.now(),
        openDate: Timestamp.fromDate(new Date(openDate)),
        isOpened: false,
        visibility: recipientType === 'self' ? 'private' : 'shared',
        encryption: {
          scheme: 'e2ee-envelope',
          encryptedKeyFor: encrypted.encryptedKeyFor,
          algo: 'AES-GCM-256',
          iv: encrypted.iv,
        },
      });

      // Reset form
      setTitle('');
      setContent('');
      setOpenDate('');
      setMediaFile(null);
      setAiSuggestions([]);

      alert(t('create.messageCreated') || 'Message created successfully!');
    } catch (error) {
      console.error('Error creating message:', error);
      alert(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-deep-blue mb-2">
          {t('create.title')}
        </h2>
      </motion.div>

      {/* Message Type Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-blue">
          {t('create.messageType')}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['text', 'audio', 'video', 'image'] as MessageType[]).map((type) => (
            <button
              key={type}
              onClick={() => setMessageType(type)}
              className={`p-3 rounded-lg border-2 transition-all ${
                messageType === type
                  ? 'border-soft-gold bg-soft-gold bg-opacity-20'
                  : 'border-silver-gray hover:border-warm-gray'
              }`}
            >
              <div className="text-2xl mb-1">
                {type === 'text' && '📝'}
                {type === 'audio' && '🎤'}
                {type === 'video' && '📹'}
                {type === 'image' && '🖼️'}
              </div>
              <div className="text-xs">{t(`create.${type}`)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-blue">
          {t('create.titleLabel')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('create.titlePlaceholder')}
          className="w-full px-4 py-2 border border-silver-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-gold"
          dir={locale === 'he-IL' ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Content */}
      {messageType === 'text' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-deep-blue">
            {t('create.contentLabel')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('create.contentPlaceholder')}
            rows={6}
            className="w-full px-4 py-2 border border-silver-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-gold resize-none"
            dir={locale === 'he-IL' ? 'rtl' : 'ltr'}
          />
          <button
            onClick={handleGetSuggestions}
            disabled={loading}
            className="text-sm text-soft-gold hover:underline"
          >
            ✨ {t('create.getHelp')}
          </button>
        </div>
      )}

      {/* AI Suggestions */}
      {showAiHelper && aiSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pale-blue rounded-lg p-4 space-y-2"
        >
          <h4 className="font-semibold text-deep-blue">{t('create.aiSuggestions')}</h4>
          {aiSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setContent(content + ' ' + suggestion);
                setShowAiHelper(false);
              }}
              className="block w-full text-left p-2 hover:bg-white rounded transition-colors"
              dir={locale === 'he-IL' ? 'rtl' : 'ltr'}
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}

      {/* Media Upload */}
      {messageType !== 'text' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-deep-blue">
            {t('create.uploadMedia')}
          </label>
          <input
            type="file"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            accept={
              messageType === 'audio'
                ? 'audio/*'
                : messageType === 'video'
                ? 'video/*'
                : 'image/*'
            }
            className="w-full"
          />
        </div>
      )}

      {/* Emotion Tone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-blue">
          {t('create.emotionTone')}
        </label>
        <select
          value={emotionTone}
          onChange={(e) => setEmotionTone(e.target.value as EmotionTone)}
          className="w-full px-4 py-2 border border-silver-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-gold"
        >
          {['encouragement', 'gratitude', 'reflection', 'farewell', 'hope', 'other'].map(
            (tone) => (
              <option key={tone} value={tone}>
                {t(`create.${tone}`)}
              </option>
            )
          )}
        </select>
      </div>

      {/* Open Date */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-blue">
          {t('create.openDate')}
        </label>
        <input
          type="datetime-local"
          value={openDate}
          onChange={(e) => setOpenDate(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="w-full px-4 py-2 border border-silver-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-soft-gold"
        />
      </div>

      {/* Recipients */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-deep-blue">
          {t('create.recipients')}
        </label>
        <div className="flex gap-2">
          {(['self', 'other', 'group'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setRecipientType(type)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                recipientType === type
                  ? 'border-soft-gold bg-soft-gold bg-opacity-20'
                  : 'border-silver-gray hover:border-warm-gray'
              }`}
            >
              {t(`create.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Create Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreateMessage}
        disabled={loading || !content || !openDate}
        className="w-full py-3 bg-soft-gold text-deep-blue font-semibold rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('common.loading') : t('create.createMessage')}
      </motion.button>
    </div>
  );
}
