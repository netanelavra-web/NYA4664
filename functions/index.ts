/**
 * Firebase Cloud Functions for Whispr
 *
 * These functions handle:
 * - Scheduled message opening checks
 * - Push notifications
 * - Monthly insights generation
 * - User invitations
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateMonthlyInsights } from '../lib/ai/openai';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// ============================================================================
// SCHEDULED: Check for messages that should be opened
// Runs every 10 minutes
// ============================================================================

export const checkOpenDates = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    try {
      // Find messages that are ready to open but haven't been opened
      const messagesRef = db.collection('messages');
      const query = messagesRef
        .where('isOpened', '==', false)
        .where('openDate', '<=', now);

      const snapshot = await query.get();

      const notifications: Promise<any>[] = [];

      snapshot.forEach((doc) => {
        const message = doc.data();

        // Send notification to each recipient
        message.recipientIds.forEach(async (recipientId: string) => {
          const userDoc = await db.collection('users').doc(recipientId).get();
          const userData = userDoc.data();

          if (!userData || !userData.settings?.notifications?.messages) {
            return;
          }

          const locale = userData.locale || 'he-IL';
          const title = locale === 'he-IL'
            ? '🕰️ יש לך לחישה מהעבר שלך'
            : '🕰️ You have a whisper from your past';

          const body = locale === 'he-IL'
            ? `ההודעה "${message.title || 'ללא שם'}" מוכנה להיפתח`
            : `The message "${message.title || 'Untitled'}" is ready to open`;

          // Get user's FCM token (assumed to be stored in user document)
          const fcmToken = userData.fcmToken;
          if (fcmToken) {
            notifications.push(
              messaging.send({
                token: fcmToken,
                notification: { title, body },
                data: {
                  messageId: doc.id,
                  type: 'message_open',
                },
              })
            );
          }
        });
      });

      await Promise.all(notifications);
      console.log(`Processed ${snapshot.size} ready messages`);
    } catch (error) {
      console.error('Error checking open dates:', error);
    }

    return null;
  });

// ============================================================================
// SCHEDULED: Check for upcoming events (1-3 days ahead)
// Runs daily at 9:00 AM
// ============================================================================

export const checkUpcomingEvents = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Jerusalem')
  .onRun(async (context) => {
    try {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const eventsRef = db.collection('events');
      const query = eventsRef
        .where('date', '>=', admin.firestore.Timestamp.fromDate(now))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(threeDaysLater));

      const snapshot = await query.get();

      const notifications: Promise<any>[] = [];

      snapshot.forEach(async (doc) => {
        const event = doc.data();
        const userDoc = await db.collection('users').doc(event.userId).get();
        const userData = userDoc.data();

        if (!userData || !userData.settings?.notifications?.events) {
          return;
        }

        const locale = userData.locale || 'he-IL';
        const title = locale === 'he-IL'
          ? `מחר יום השנה של ${event.title}`
          : `Tomorrow is the anniversary of ${event.title}`;

        const body = locale === 'he-IL'
          ? 'תרצה לכתוב כמה מילים?'
          : 'Would you like to write a few words?';

        const fcmToken = userData.fcmToken;
        if (fcmToken) {
          notifications.push(
            messaging.send({
              token: fcmToken,
              notification: { title, body },
              data: {
                eventId: doc.id,
                type: 'event_upcoming',
              },
            })
          );
        }
      });

      await Promise.all(notifications);
      console.log(`Processed ${snapshot.size} upcoming events`);
    } catch (error) {
      console.error('Error checking upcoming events:', error);
    }

    return null;
  });

// ============================================================================
// SCHEDULED: Generate monthly insights
// Runs on the 1st of each month at 10:00 AM
// ============================================================================

export const generateInsights = functions.pubsub
  .schedule('0 10 1 * *')
  .timeZone('Asia/Jerusalem')
  .onRun(async (context) => {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get all users who have AI insights enabled
      const usersRef = db.collection('users');
      const usersQuery = usersRef.where('settings.aiInsights', '==', true);
      const usersSnapshot = await usersQuery.get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Get user's messages from last month
        const messagesRef = db.collection('messages');
        const messagesQuery = messagesRef
          .where('ownerId', '==', userId)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(lastMonth))
          .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(lastMonthEnd));

        const messagesSnapshot = await messagesQuery.get();
        const messages = messagesSnapshot.docs.map(doc => doc.data());

        if (messages.length === 0) continue;

        // Generate insights using AI
        const locale = userData.locale || 'he-IL';
        const { summaryText, topThemes } = await generateMonthlyInsights(
          messages as any,
          locale
        );

        // Calculate emotion stats
        const emotionStats: Record<string, number> = {};
        messages.forEach(msg => {
          const emotion = msg.aiEmotion || 'calm';
          emotionStats[emotion] = (emotionStats[emotion] || 0) + 1;
        });

        // Save insight
        await db.collection('insights').add({
          userId,
          period: 'monthly',
          periodStart: admin.firestore.Timestamp.fromDate(lastMonth),
          periodEnd: admin.firestore.Timestamp.fromDate(lastMonthEnd),
          emotionStats,
          topThemes,
          messageCount: messages.length,
          summaryTextHe: locale === 'he-IL' ? summaryText : undefined,
          summaryTextEn: locale === 'en-US' ? summaryText : undefined,
          createdAt: admin.firestore.Timestamp.now(),
        });

        // Send notification
        const fcmToken = userData.fcmToken;
        if (fcmToken) {
          const title = locale === 'he-IL'
            ? 'התובנות החודשיות שלך מוכנות'
            : 'Your monthly insights are ready';

          const body = locale === 'he-IL'
            ? 'גלה מה למדת החודש'
            : 'Discover what you learned this month';

          await messaging.send({
            token: fcmToken,
            notification: { title, body },
            data: {
              type: 'insight_ready',
            },
          });
        }
      }

      console.log(`Generated insights for ${usersSnapshot.size} users`);
    } catch (error) {
      console.error('Error generating insights:', error);
    }

    return null;
  });

// ============================================================================
// CALLABLE: Send invitation to join a capsule or read a message
// ============================================================================

export const sendInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to send invitations'
    );
  }

  const { toEmail, messageId, capsuleId } = data;

  if (!toEmail || (!messageId && !capsuleId)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  try {
    const fromUserId = context.auth.uid;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create invitation document
    const invitationRef = await db.collection('invitations').add({
      fromUserId,
      toEmail,
      messageId: messageId || null,
      capsuleId: capsuleId || null,
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      accepted: false,
    });

    // TODO: Send email invitation using SendGrid or similar service
    // For now, we just create the invitation document

    return {
      success: true,
      invitationId: invitationRef.id,
    };
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send invitation');
  }
});

// ============================================================================
// TRIGGER: When message is created, analyze emotion (async)
// ============================================================================

export const onMessageCreated = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();

    // Skip if already has AI emotion
    if (message.aiEmotion) return null;

    // NOTE: Content is encrypted, so we can only analyze if we have access
    // In a real implementation, this would require server-side decryption
    // or client-side analysis before encryption

    // For now, we'll just set default values
    await snapshot.ref.update({
      aiEmotion: 'calm',
      aiKeywords: [],
    });

    return null;
  });
