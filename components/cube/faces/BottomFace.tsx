'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatDate } from '@/lib/utils/date';
import type { Event, EventKind, EmotionTag } from '@/types';

interface BottomFaceProps {
  locale: 'he-IL' | 'en-US';
}

export default function BottomFace({ locale }: BottomFaceProps) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    kind: 'birthday' as EventKind,
    title: '',
    date: '',
    recurring: true,
    emotionTag: 'happy' as EmotionTag,
    description: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const userId = 'current-user-id'; // TODO: Get from auth
      const eventsRef = collection(db, 'events');
      const eventsQuery = query(
        eventsRef,
        where('userId', '==', userId),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(eventsQuery);
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!formData.title || !formData.date) return;

    try {
      const userId = 'current-user-id'; // TODO: Get from auth

      await addDoc(collection(db, 'events'), {
        userId,
        kind: formData.kind,
        title: formData.title,
        date: Timestamp.fromDate(new Date(formData.date)),
        recurring: formData.recurring,
        emotionTag: formData.emotionTag,
        description: formData.description,
        icon: getEventIcon(formData.kind),
        createdAt: Timestamp.now(),
        visibility: 'private',
      });

      setFormData({
        kind: 'birthday',
        title: '',
        date: '',
        recurring: true,
        emotionTag: 'happy',
        description: '',
      });

      setShowAddForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm(t('events.deleteEvent') + '?')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventIcon = (kind: EventKind): string => {
    const icons: Record<EventKind, string> = {
      birthday: '🎂',
      anniversary: '💍',
      memorial_person: '🕯️',
      memorial_pet: '🐾',
      personal_milestone: '⭐',
    };
    return icons[kind];
  };

  const getEmotionColor = (tag: EmotionTag): string => {
    const colors: Record<EmotionTag, string> = {
      happy: 'border-l-yellow-400',
      calm: 'border-l-blue-300',
      memory: 'border-l-purple-400',
      longing: 'border-l-pink-400',
    };
    return colors[tag];
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
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-3xl font-bold text-deep-blue mb-2">
            {t('events.title')}
          </h2>
          <p className="text-warm-gray">{t('events.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-soft-gold text-deep-blue rounded-lg hover:bg-opacity-80 transition-all"
        >
          {showAddForm ? t('common.cancel') : t('events.addEvent')}
        </button>
      </motion.div>

      {/* Add Event Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-pale-blue rounded-lg p-4 space-y-4"
          >
            {/* Event Kind */}
            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2">
                {t('events.eventKind')}
              </label>
              <select
                value={formData.kind}
                onChange={(e) => setFormData({ ...formData, kind: e.target.value as EventKind })}
                className="w-full px-4 py-2 border border-silver-gray rounded-lg"
              >
                {['birthday', 'anniversary', 'memorial_person', 'memorial_pet', 'personal_milestone'].map(
                  (kind) => (
                    <option key={kind} value={kind}>
                      {getEventIcon(kind as EventKind)} {t(`events.${kind}`)}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2">
                {t('events.eventTitle')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-silver-gray rounded-lg"
                dir={locale === 'he-IL' ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2">
                {t('events.eventDate')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-silver-gray rounded-lg"
              />
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-deep-blue">{t('events.recurring')}</label>
            </div>

            {/* Emotion Tag */}
            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2">
                {t('events.emotionTag')}
              </label>
              <div className="flex gap-2">
                {(['happy', 'calm', 'memory', 'longing'] as EmotionTag[]).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFormData({ ...formData, emotionTag: tag })}
                    className={`px-3 py-1 rounded-lg border-2 transition-all ${
                      formData.emotionTag === tag
                        ? 'border-soft-gold bg-soft-gold bg-opacity-20'
                        : 'border-silver-gray'
                    }`}
                  >
                    {t(`events.${tag}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-deep-blue mb-2">
                {t('events.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-silver-gray rounded-lg"
                dir={locale === 'he-IL' ? 'rtl' : 'ltr'}
              />
            </div>

            <button
              onClick={handleAddEvent}
              className="w-full py-2 bg-soft-gold text-deep-blue rounded-lg hover:bg-opacity-80"
            >
              {t('events.saveEvent')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className="grid gap-4">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-lg p-4 shadow-md border-l-4 ${getEmotionColor(event.emotionTag)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{event.icon}</span>
                  <div>
                    <h4 className="font-semibold text-deep-blue">{event.title}</h4>
                    <p className="text-sm text-warm-gray">
                      {formatDate(event.date.toDate(), locale)}
                      {event.recurring && ' • ' + t('events.recurring')}
                    </p>
                  </div>
                </div>
                {event.description && (
                  <p className="text-sm text-warm-gray mt-2" dir={locale === 'he-IL' ? 'rtl' : 'ltr'}>
                    {event.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-warm-gray text-lg">{t('events.noEvents')}</p>
        </div>
      )}
    </div>
  );
}
