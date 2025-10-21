'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatRelativeTime, canOpenMessage } from '@/lib/utils/date';
import type { Message, Event } from '@/types';

interface FrontFaceProps {
  locale: 'he-IL' | 'en-US';
}

export default function FrontFace({ locale }: FrontFaceProps) {
  const { t } = useTranslation();
  const [upcomingMessages, setUpcomingMessages] = useState<Message[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch upcoming messages and events
  useEffect(() => {
    async function fetchData() {
      try {
        // Get user ID from auth context (placeholder)
        const userId = 'current-user-id'; // TODO: Get from auth context

        // Fetch messages that can be opened soon
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('recipientIds', 'array-contains', userId),
          where('isOpened', '==', false),
          where('openDate', '<=', Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))), // Next 7 days
          orderBy('openDate', 'asc')
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        const messages = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        setUpcomingMessages(messages);

        // Fetch upcoming events
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(
          eventsRef,
          where('userId', '==', userId),
          where('date', '<=', Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))),
          orderBy('date', 'asc')
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];

        setUpcomingEvents(events);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getEmotionEmoji = (tone: string): string => {
    const emojiMap: Record<string, string> = {
      encouragement: '💪',
      gratitude: '🙏',
      reflection: '💭',
      farewell: '👋',
      hope: '✨',
      other: '💬',
      birthday: '🎂',
      anniversary: '💍',
      memorial_person: '🕯️',
      memorial_pet: '🐾',
      personal_milestone: '⭐',
    };
    return emojiMap[tone] || '💬';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-deep-blue mb-2">
          {t('now.title')}
        </h2>
        <p className="text-warm-gray">{t('now.subtitle')}</p>
      </motion.div>

      {/* Upcoming Messages */}
      {upcomingMessages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-deep-blue">
            {t('now.upcomingMessages')}
          </h3>
          <div className="grid gap-4">
            {upcomingMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg p-4 shadow-md border-l-4 ${
                  canOpenMessage(message.openDate.toDate())
                    ? 'border-soft-gold'
                    : 'border-pale-blue'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {getEmotionEmoji(message.emotionTone)}
                      </span>
                      <h4 className="font-semibold text-deep-blue">
                        {message.title || t('create.messageType.' + message.type)}
                      </h4>
                    </div>
                    <p className="text-sm text-warm-gray">
                      {formatRelativeTime(message.openDate.toDate(), locale)}
                    </p>
                  </div>
                  {canOpenMessage(message.openDate.toDate()) && (
                    <button className="px-4 py-2 bg-soft-gold text-deep-blue rounded-lg hover:bg-opacity-80 transition-all">
                      {t('now.openMessage')}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-deep-blue">
            {t('now.upcomingEvents')}
          </h3>
          <div className="grid gap-4">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-cream rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getEmotionEmoji(event.kind)}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-deep-blue">{event.title}</h4>
                    <p className="text-sm text-warm-gray">
                      {formatRelativeTime(event.date.toDate(), locale)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {upcomingMessages.length === 0 && upcomingEvents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-warm-gray text-lg">{t('now.noUpcoming')}</p>
          <p className="text-sm text-silver-gray mt-2">
            {t('cube.swipeUp')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
