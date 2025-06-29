import db from './db';
import { users, webhooks, deliveryAttempts, userSettings } from './schema';

async function seed() {
  // Insert users
  let insertedUsers;
  try {
    insertedUsers = await db.insert(users).values([
    //   {
    //     name: 'Alicia Keys',
    //     email: 'alicia@example.com',
    //     phoneNumber: '+25474567890',
    //     passwordHash: 'alicia@123', // Use a real hash in production
    //     apiKey: 'alice-api-key',
    //   },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phoneNumber: '+1987654321',
        passwordHash: 'password456',
        apiKey: 'bob-api-key',
      },
    ]).returning();
    console.log('👤 User insert result:', insertedUsers);
  } catch (err) {
    console.error('❌ User insert error:', err);
    throw err;
  }
  if (!insertedUsers[0]) {
    throw new Error('❌ Failed to insert users');
  }
  const user = insertedUsers[0]!;

  // Seed user settings for environments
  const envs = ['development', 'staging', 'production'] as const;
  try {
    const settingsValues: Array<{
      userId: string;
      environment: typeof envs[number];
      webhookUrl: string;
    }> = envs.map((environment) => ({
      userId: user.id,
      environment,
      webhookUrl: `https://${environment}.example.com/webhook/${user.id}`,
    }));
    const insertedSettings = await db.insert(userSettings)
      .values(settingsValues)
      .returning();
    console.log('⚙️  User settings inserted:', insertedSettings);
  } catch (err) {
    console.error('❌ User settings insert error:', err);
    throw err;
  }

  // Insert webhooks for each user
  let insertedWebhooks;
  try {
    insertedWebhooks = await db.insert(webhooks).values([
      {
        userId: insertedUsers[0].id,
        url: 'https://example.com/webhook/alice',
        eventType: 'payment_received',
        secret: 'secret1',
        description: 'Alicia payment webhook',
      },
    ]).returning();
    console.log('🔗 Webhook insert result:', insertedWebhooks);
  } catch (err) {
    console.error('❌ Webhook insert error:', err);
    throw err;
  }
  if (!insertedWebhooks[0]) {
    throw new Error('❌ Failed to insert webhooks');
  }

  // Insert delivery attempts for each webhook
  try {
    await db.insert(deliveryAttempts).values([
      {
        webhookId: insertedWebhooks[0].id,
        payload: { amount: 100, currency: 'USD' },
        responseStatus: 200,
        responseBody: 'OK',
        success: true,
        attemptNumber: 1,
      },
    ]);
    console.log('📦 Delivery attempt inserted!');
  } catch (err) {
    console.error('❌ Delivery attempt insert error:', err);
    throw err;
  }

  console.log('🌱 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('🚨 Seeding failed:', err);
  process.exit(1);
});
