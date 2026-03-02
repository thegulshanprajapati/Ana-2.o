import fs from 'node:fs/promises';
import path from 'node:path';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { config } from 'dotenv';

config();

const rootDir = process.cwd();
const localDataDir = path.join(rootDir, 'local-data');
const chatsDir = path.join(localDataDir, 'chats');
const brainDir = path.join(localDataDir, 'brain');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || 'ana';

if (!uri) {
  throw new Error(
    'Missing MONGODB_URI or MONGO_URI. Add one before running migration.'
  );
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const COLLECTIONS = {
  users: 'users',
  testimonials: 'testimonials',
  notifications: 'notifications',
  feedback: 'feedback',
  communityPosts: 'community_posts',
  chats: 'chats',
  brainFiles: 'brain_files',
};

const readJsonArray = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};

const upsertById = async (collection, docs, idField = 'id') => {
  let count = 0;
  for (const doc of docs) {
    if (!doc || !doc[idField]) continue;
    await collection.updateOne(
      { [idField]: doc[idField] },
      {
        $set: doc,
      },
      { upsert: true }
    );
    count += 1;
  }
  return count;
};

const migrateChats = async (db) => {
  let count = 0;
  let userDirs = [];
  try {
    userDirs = await fs.readdir(chatsDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return 0;
    throw error;
  }

  const collection = db.collection(COLLECTIONS.chats);
  for (const userDir of userDirs) {
    if (!userDir.isDirectory()) continue;
    const userId = userDir.name;
    const userChatPath = path.join(chatsDir, userId);
    const chatFiles = await fs.readdir(userChatPath, { withFileTypes: true });

    for (const chatFile of chatFiles) {
      if (!chatFile.isFile() || !chatFile.name.endsWith('.json')) continue;
      const filePath = path.join(userChatPath, chatFile.name);
      const content = await fs.readFile(filePath, 'utf-8');
      const session = JSON.parse(content);
      if (!session?.id) continue;

      await collection.updateOne(
        { userId, id: session.id },
        {
          $set: {
            ...session,
            userId,
          },
        },
        { upsert: true }
      );
      count += 1;
    }
  }
  return count;
};

const migrateBrain = async (db) => {
  let count = 0;
  let files = [];
  try {
    files = await fs.readdir(brainDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return 0;
    throw error;
  }

  const collection = db.collection(COLLECTIONS.brainFiles);
  for (const file of files) {
    if (!file.isFile()) continue;
    const filePath = path.join(brainDir, file.name);
    const content = await fs.readFile(filePath, 'utf-8');
    await collection.updateOne(
      { fileName: file.name },
      {
        $set: {
          fileName: file.name,
          content,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
    count += 1;
  }
  return count;
};

try {
  await client.connect();
  const db = client.db(dbName);

  const users = await readJsonArray(path.join(localDataDir, 'users.json'));
  const testimonials = await readJsonArray(path.join(localDataDir, 'testimonials.json'));
  const notifications = await readJsonArray(path.join(localDataDir, 'notifications.json'));
  const feedback = await readJsonArray(path.join(localDataDir, 'feedback.json'));
  const communityPosts = await readJsonArray(path.join(localDataDir, 'community-posts.json'));

  const [usersCount, testimonialsCount, notificationsCount, feedbackCount, postsCount, chatsCount, brainCount] =
    await Promise.all([
      upsertById(db.collection(COLLECTIONS.users), users),
      upsertById(db.collection(COLLECTIONS.testimonials), testimonials),
      upsertById(db.collection(COLLECTIONS.notifications), notifications),
      upsertById(db.collection(COLLECTIONS.feedback), feedback),
      upsertById(db.collection(COLLECTIONS.communityPosts), communityPosts),
      migrateChats(db),
      migrateBrain(db),
    ]);

  console.log('Migration complete.');
  console.log(`users: ${usersCount}`);
  console.log(`testimonials: ${testimonialsCount}`);
  console.log(`notifications: ${notificationsCount}`);
  console.log(`feedback: ${feedbackCount}`);
  console.log(`community_posts: ${postsCount}`);
  console.log(`chats: ${chatsCount}`);
  console.log(`brain_files: ${brainCount}`);
} finally {
  await client.close();
}
