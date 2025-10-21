'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatDate } from '@/lib/utils/date';
import type { Message, Event, TimelineFilter } from '@/types';

interface TimelineFaceProps {
  locale: 'he-IL' | 'en-US';
}

interface TimelineItem {
  id: string;
  type: 'message' | 'event';
  date: Date;
  title: string;
  icon: string;
  data: Message | Event;
}

export default function TimelineFace({ locale }: TimelineFaceProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [filter, setFilter] = useState<TimelineFilter>({ type: 'all' });
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRTL = locale === 'he-IL';

  useEffect(() => {
    fetchTimelineData();
  }, [filter]);

  const fetchTimelineData = async () => {
    try {
      const userId = 'current-user-id'; // TODO: Get from auth
      const timelineItems: TimelineItem[] = [];

      // Fetch messages
      if (!filter.type || filter.type === 'all' || filter.type === 'messages') {
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('recipientIds', 'array-contains', userId)
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.docs.forEach(doc => {
          const msg = { id: doc.id, ...doc.data() } as Message;
          timelineItems.push({
            id: msg.id,
            type: 'message',
            date: msg.openDate.toDate(),
            title: msg.title || t('create.messageType.' + msg.type),
            icon: getMessageIcon(msg.emotionTone),
            data: msg,
          });
        });
      }

      // Fetch events
      if (!filter.type || filter.type === 'all' || filter.type === 'events') {
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(
          eventsRef,
          where('userId', '==', userId)
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        eventsSnapshot.docs.forEach(doc => {
          const evt = { id: doc.id, ...doc.data() } as Event;
          timelineItems.push({
            id: evt.id,
            type: 'event',
            date: evt.date.toDate(),
            title: evt.title,
            icon: evt.icon || '📅',
            data: evt,
          });
        });
      }

      // Sort by date
      timelineItems.sort((a, b) => a.date.getTime() - b.date.getTime());

      setItems(timelineItems);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMessageIcon = (tone: string): string => {
    const icons: Record<string, string> = {
      encouragement: '💪',
      gratitude: '🙏',
      reflection: '💭',
      farewell: '👋',
      hope: '✨',
      other: '💬',
    };
    return icons[tone] || '💬';
  };

  const scrollToToday = () => {
    const todayIndex = items.findIndex(item => item.date >= new Date());
    if (todayIndex !== -1 && scrollRef.current) {
      const itemWidth = 200; // Approximate item width
      scrollRef.current.scrollLeft = todayIndex * itemWidth - window.innerWidth / 2;
    }
  };

  useEffect(() => {
    if (items.length > 0) {
      setTimeout(scrollToToday, 100);
    }
  }, [items]);

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
          {t('timeline.title')}
        </h2>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 justify-center flex-wrap">
        {['all', 'messages', 'events'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter({ ...filter, type: type as any })}
            className={`px-4 py-2 rounded-lg transition-all ${
              (filter.type === type || (type === 'all' && !filter.type))
                ? 'bg-soft-gold text-deep-blue'
                : 'bg-pale-blue text-warm-gray hover:bg-opacity-80'
            }`}
          >
            {t(`timeline.${type}`)}
          </button>
        ))}
        <button
          onClick={scrollToToday}
          className="px-4 py-2 bg-deep-blue text-white rounded-lg hover:bg-opacity-80"
        >
          {t('timeline.today')}
        </button>
      </div>

      {/* Horizontal Timeline */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-4"
        style={{
          scrollBehavior: 'smooth',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <div className="flex gap-4 min-w-max px-4">
          {/* Past/Future Divider */}
          <div className="relative flex items-center">
            <div className="absolute h-full w-1 bg-soft-gold left-1/2 transform -translate-x-1/2"></div>
          </div>

          {items.map((item, index) => {
            const isPast = item.date < new Date();
            const isToday =
              item.date.toDateString() === new Date().toDateString();

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-soft-gold z-10"></div>

                {/* Item card */}
                <div
                  className={`w-48 p-4 rounded-lg shadow-md ${
                    isPast ? 'bg-cream' : 'bg-pale-blue'
                  } ${isToday ? 'ring-2 ring-soft-gold' : ''}`}
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h4 className="font-semibold text-deep-blue text-sm mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-warm-gray">
                    {formatDate(item.date, locale)}
                  </p>
                  <span className="text-xs text-silver-gray">
                    {item.type === 'message' ? '💌' : '📅'}{' '}
                    {t(`timeline.${item.type}s`)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-warm-gray">{t('timeline.noItems')}</p>
        </div>
      )}
    </div>
  );
}
