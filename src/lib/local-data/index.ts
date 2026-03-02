'use server';

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getMongoDb, isMongoConfigured } from '@/lib/mongodb';

const dataPath = path.join(process.cwd(), 'local-data');
const usersFilePath = path.join(dataPath, 'users.json');
const testimonialsFilePath = path.join(dataPath, 'testimonials.json');
const notificationsFilePath = path.join(dataPath, 'notifications.json');
const feedbackFilePath = path.join(dataPath, 'feedback.json');
const communityPostsFilePath = path.join(dataPath, 'community-posts.json');
const appSettingsFilePath = path.join(dataPath, 'app-settings.json');
const chatsPath = path.join(dataPath, 'chats');
const brainPath = path.join(dataPath, 'brain');

const useMongoBackend =
  process.env.ANA_DATA_BACKEND === 'mongodb' || isMongoConfigured();

const COLLECTIONS = {
  users: 'users',
  testimonials: 'testimonials',
  notifications: 'notifications',
  feedback: 'feedback',
  communityPosts: 'community_posts',
  appSettings: 'app_settings',
  chats: 'chats',
  brainFiles: 'brain_files',
} as const;

export interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: AppMessage[];
  createdAt: string;
}

export interface UserData {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string | null;
  gender?: 'male' | 'female' | 'other';
  plan: 'Free' | 'Business' | 'Enterprise';
  character?: string;
  password?: string;
  connectProfile?: {
    handle?: string;
    bio?: string;
    isPublic?: boolean;
    followingUserIds?: string[];
  };
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
  avatarHint: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  userId?: string | null;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  chatId: string;
  messageContent: string;
  feedbackType: 'like' | 'dislike';
  comment?: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userPlan?: UserData['plan'];
  text: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface BrainDocument {
  fileName: string;
  content: string;
}

export interface ToolFeatureSettings {
  imageGeneratorInDevelopment: boolean;
  docGeneratorInDevelopment: boolean;
  codeStudioInDevelopment: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

type BrainFileDoc = BrainDocument & {
  updatedAt: string;
};

type MongoChatDoc = ChatSession & {
  userId: string;
};

type ToolFeatureSettingsDoc = ToolFeatureSettings & {
  id: 'tool_feature_settings';
};

const TOOL_FEATURE_SETTINGS_DOC_ID = 'tool_feature_settings' as const;

const getDefaultToolFeatureSettings = (): ToolFeatureSettings => ({
  imageGeneratorInDevelopment: false,
  docGeneratorInDevelopment: false,
  codeStudioInDevelopment: false,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
});

const sanitizeToolFeatureSettings = (
  value: Partial<ToolFeatureSettings> | null | undefined
): ToolFeatureSettings => {
  const defaults = getDefaultToolFeatureSettings();
  return {
    imageGeneratorInDevelopment:
      value?.imageGeneratorInDevelopment ?? defaults.imageGeneratorInDevelopment,
    docGeneratorInDevelopment:
      value?.docGeneratorInDevelopment ?? defaults.docGeneratorInDevelopment,
    codeStudioInDevelopment:
      value?.codeStudioInDevelopment ?? defaults.codeStudioInDevelopment,
    updatedAt: value?.updatedAt || defaults.updatedAt,
    updatedBy: value?.updatedBy ?? null,
  };
};

const ensureDir = async (dirPath: string) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const readJsonFile = async <T>(filePath: string, defaultValue: T): Promise<T> => {
  try {
    await ensureDir(path.dirname(filePath));
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
};

const writeJsonFile = async <T>(filePath: string, data: T): Promise<void> => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const initializeLocalStore = async () => {
  await ensureDir(dataPath);
  await ensureDir(chatsPath);
  await ensureDir(brainPath);
  await readJsonFile(usersFilePath, []);
  await readJsonFile(testimonialsFilePath, []);
  await readJsonFile(notificationsFilePath, []);
  await readJsonFile(feedbackFilePath, []);
  await readJsonFile(communityPostsFilePath, []);
  await readJsonFile<ToolFeatureSettingsDoc>(appSettingsFilePath, {
    id: TOOL_FEATURE_SETTINGS_DOC_ID,
    ...getDefaultToolFeatureSettings(),
  });
};

const initializeMongoStore = async () => {
  const db = await getMongoDb();
  await Promise.all([
    db.collection<UserData>(COLLECTIONS.users).createIndex({ id: 1 }, { unique: true }),
    db.collection<UserData>(COLLECTIONS.users).createIndex(
      { email: 1 },
      { unique: true, sparse: true }
    ),
    db
      .collection<Testimonial>(COLLECTIONS.testimonials)
      .createIndex({ id: 1 }, { unique: true }),
    db
      .collection<Notification>(COLLECTIONS.notifications)
      .createIndex({ id: 1 }, { unique: true }),
    db.collection<Notification>(COLLECTIONS.notifications).createIndex({ userId: 1 }),
    db.collection<Feedback>(COLLECTIONS.feedback).createIndex({ id: 1 }, { unique: true }),
    db
      .collection<CommunityPost>(COLLECTIONS.communityPosts)
      .createIndex({ id: 1 }, { unique: true }),
    db
      .collection<ToolFeatureSettingsDoc>(COLLECTIONS.appSettings)
      .createIndex({ id: 1 }, { unique: true }),
    db.collection<MongoChatDoc>(COLLECTIONS.chats).createIndex(
      { userId: 1, id: 1 },
      { unique: true }
    ),
    db.collection<MongoChatDoc>(COLLECTIONS.chats).createIndex({ userId: 1, createdAt: -1 }),
    db
      .collection<BrainFileDoc>(COLLECTIONS.brainFiles)
      .createIndex({ fileName: 1 }, { unique: true }),
  ]);
};

const initializeDataStore = async () => {
  if (useMongoBackend) {
    await initializeMongoStore();
    return;
  }
  await initializeLocalStore();
};

initializeDataStore().catch((error) => {
  console.error('Failed to initialize data store:', error);
});

const getUserChatDir = (userId: string) => path.join(chatsPath, userId);

const parseBrainJson = (rawContent: string): { conversations?: any[] } | null => {
  try {
    const parsed = JSON.parse(rawContent);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    return parsed as { conversations?: any[] };
  } catch {
    return null;
  }
};

const getBroadcastNotificationFilter = () => ({
  $or: [{ userId: null }, { userId: { $exists: false } }],
});

const sortByCreatedAtDesc = <T extends { createdAt: string }>(items: T[]): T[] => {
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getAllUsers = async (): Promise<UserData[]> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    return db
      .collection<UserData>(COLLECTIONS.users)
      .find({}, { projection: { _id: 0 } })
      .toArray();
  }
  return readJsonFile(usersFilePath, []);
};

export const getUserByEmail = async (email: string): Promise<UserData | undefined> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const user = await db
      .collection<UserData>(COLLECTIONS.users)
      .findOne({ email }, { projection: { _id: 0 } });
    return user ?? undefined;
  }
  const users = await getAllUsers();
  return users.find((u) => u.email === email);
};

export const getUserById = async (id: string): Promise<UserData | undefined> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const user = await db
      .collection<UserData>(COLLECTIONS.users)
      .findOne({ id }, { projection: { _id: 0 } });
    return user ?? undefined;
  }
  const users = await getAllUsers();
  return users.find((u) => u.id === id);
};

export const saveUser = async (user: UserData): Promise<void> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<UserData>(COLLECTIONS.users).updateOne(
      { id: user.id },
      {
        $set: user,
      },
      { upsert: true }
    );
    return;
  }

  const users = await getAllUsers();
  const existingUserIndex = users.findIndex((u) => u.id === user.id);
  if (existingUserIndex !== -1) {
    users[existingUserIndex] = user;
  } else {
    users.push(user);
  }
  await writeJsonFile(usersFilePath, users);
};

export const updateUserData = async (updatedUser: UserData): Promise<void> => {
  if (useMongoBackend) {
    const currentUserData = await getUserById(updatedUser.id);
    if (!currentUserData) {
      throw new Error('User not found for update');
    }

    const mergedUser: UserData = {
      ...currentUserData,
      ...updatedUser,
      metadata: {
        creationTime: currentUserData.metadata.creationTime,
        lastSignInTime: new Date().toISOString(),
      },
    };

    const db = await getMongoDb();
    await db.collection<UserData>(COLLECTIONS.users).updateOne(
      { id: updatedUser.id },
      {
        $set: mergedUser,
      }
    );
    return;
  }

  const users = await getAllUsers();
  const userIndex = users.findIndex((u) => u.id === updatedUser.id);
  if (userIndex !== -1) {
    const currentUserData = users[userIndex];
    users[userIndex] = {
      ...currentUserData,
      ...updatedUser,
      metadata: {
        creationTime: currentUserData.metadata.creationTime,
        lastSignInTime: new Date().toISOString(),
      },
    };
    await writeJsonFile(usersFilePath, users);
  } else {
    throw new Error('User not found for update');
  }
};

export const deleteUserById = async (id: string): Promise<void> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    await Promise.all([
      db.collection<UserData>(COLLECTIONS.users).deleteOne({ id }),
      db.collection<MongoChatDoc>(COLLECTIONS.chats).deleteMany({ userId: id }),
      db.collection<Notification>(COLLECTIONS.notifications).deleteMany({ userId: id }),
    ]);
    return;
  }

  const users = await getAllUsers();
  const updatedUsers = users.filter((u) => u.id !== id);
  await writeJsonFile(usersFilePath, updatedUsers);
  await fs.rm(getUserChatDir(id), { recursive: true, force: true });
};

export const getChatHistoryForUser = async (userId: string): Promise<ChatSession[]> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const sessions = await db
      .collection<MongoChatDoc>(COLLECTIONS.chats)
      .find({ userId }, { projection: { _id: 0, userId: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return sessions;
  }

  const userChatDir = getUserChatDir(userId);
  await ensureDir(userChatDir);
  const files = await fs.readdir(userChatDir);
  const chatSessions: ChatSession[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(userChatDir, file);
    const session = await readJsonFile<ChatSession>(filePath, {} as ChatSession);
    if (session.id) {
      chatSessions.push(session);
    }
  }

  return chatSessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const saveChatHistory = async (
  userId: string,
  session: ChatSession
): Promise<void> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<MongoChatDoc>(COLLECTIONS.chats).updateOne(
      { userId, id: session.id },
      {
        $set: {
          ...session,
          userId,
        },
      },
      { upsert: true }
    );
    return;
  }

  const userChatDir = getUserChatDir(userId);
  const sessionFilePath = path.join(userChatDir, `${session.id}.json`);
  await writeJsonFile(sessionFilePath, session);
};

export const deleteChatHistory = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<MongoChatDoc>(COLLECTIONS.chats).deleteOne({ userId, id: sessionId });
    return;
  }

  const userChatDir = getUserChatDir(userId);
  const sessionFilePath = path.join(userChatDir, `${sessionId}.json`);
  try {
    await fs.unlink(sessionFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Error deleting chat session ${sessionId} for user ${userId}:`, error);
      throw error;
    }
  }
};

export const getTestimonials = async (): Promise<Testimonial[]> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    return db
      .collection<Testimonial>(COLLECTIONS.testimonials)
      .find({}, { projection: { _id: 0 } })
      .toArray();
  }

  return readJsonFile<Testimonial[]>(testimonialsFilePath, []);
};

export const saveTestimonial = async (testimonial: Testimonial): Promise<void> => {
  const testimonialToSave: Testimonial = {
    ...testimonial,
    createdAt: testimonial.createdAt || new Date().toISOString(),
  };

  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<Testimonial>(COLLECTIONS.testimonials).updateOne(
      { id: testimonialToSave.id },
      {
        $set: testimonialToSave,
      },
      { upsert: true }
    );
    return;
  }

  const testimonials = await getTestimonials();
  const existingIndex = testimonials.findIndex((t) => t.id === testimonialToSave.id);
  if (existingIndex !== -1) {
    testimonials[existingIndex] = testimonialToSave;
  } else {
    testimonials.push(testimonialToSave);
  }
  await writeJsonFile(testimonialsFilePath, testimonials);
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<Testimonial>(COLLECTIONS.testimonials).deleteOne({ id });
    return;
  }

  const testimonials = await getTestimonials();
  const updated = testimonials.filter((t) => t.id !== id);
  await writeJsonFile(testimonialsFilePath, updated);
};

export const getNotifications = async (userId: string | null): Promise<Notification[]> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const filter = userId
      ? {
          $or: [{ userId }, { userId: null }, { userId: { $exists: false } }],
        }
      : getBroadcastNotificationFilter();

    const notifications = await db
      .collection<Notification>(COLLECTIONS.notifications)
      .find(filter, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return notifications;
  }

  const allNotifications = await readJsonFile<Notification[]>(notificationsFilePath, []);
  const relevantNotifications = allNotifications.filter(
    (n) => !n.userId || n.userId === userId
  );
  return sortByCreatedAtDesc(relevantNotifications);
};

export const saveNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<Notification> => {
  const newNotification: Notification = {
    ...notification,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<Notification>(COLLECTIONS.notifications).insertOne(newNotification);
    return newNotification;
  }

  const allNotifications = await readJsonFile<Notification[]>(notificationsFilePath, []);
  allNotifications.unshift(newNotification);
  await writeJsonFile(notificationsFilePath, allNotifications);
  return newNotification;
};

export const clearAllNotifications = async (): Promise<void> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<Notification>(COLLECTIONS.notifications).deleteMany(
      getBroadcastNotificationFilter()
    );
    return;
  }

  const allNotifications = await readJsonFile<Notification[]>(notificationsFilePath, []);
  const personalNotifications = allNotifications.filter((n) => n.userId);
  await writeJsonFile(notificationsFilePath, personalNotifications);
};

export const getToolFeatureSettings = async (): Promise<ToolFeatureSettings> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const existingDoc = await db
      .collection<ToolFeatureSettingsDoc>(COLLECTIONS.appSettings)
      .findOne({ id: TOOL_FEATURE_SETTINGS_DOC_ID }, { projection: { _id: 0 } });

    if (!existingDoc) {
      const createdDoc: ToolFeatureSettingsDoc = {
        id: TOOL_FEATURE_SETTINGS_DOC_ID,
        ...getDefaultToolFeatureSettings(),
      };
      await db.collection<ToolFeatureSettingsDoc>(COLLECTIONS.appSettings).updateOne(
        { id: TOOL_FEATURE_SETTINGS_DOC_ID },
        { $set: createdDoc },
        { upsert: true }
      );
      return sanitizeToolFeatureSettings(createdDoc);
    }

    return sanitizeToolFeatureSettings(existingDoc);
  }

  const doc = await readJsonFile<ToolFeatureSettingsDoc>(appSettingsFilePath, {
    id: TOOL_FEATURE_SETTINGS_DOC_ID,
    ...getDefaultToolFeatureSettings(),
  });
  return sanitizeToolFeatureSettings(doc);
};

export const updateToolFeatureSettings = async (
  updates: Partial<
    Pick<
      ToolFeatureSettings,
      'imageGeneratorInDevelopment' | 'docGeneratorInDevelopment' | 'codeStudioInDevelopment'
    >
  > & {
    updatedBy?: string | null;
  }
): Promise<ToolFeatureSettings> => {
  const current = await getToolFeatureSettings();
  const nextDoc: ToolFeatureSettingsDoc = {
    id: TOOL_FEATURE_SETTINGS_DOC_ID,
    imageGeneratorInDevelopment:
      typeof updates.imageGeneratorInDevelopment === 'boolean'
        ? updates.imageGeneratorInDevelopment
        : current.imageGeneratorInDevelopment,
    docGeneratorInDevelopment:
      typeof updates.docGeneratorInDevelopment === 'boolean'
        ? updates.docGeneratorInDevelopment
        : current.docGeneratorInDevelopment,
    codeStudioInDevelopment:
      typeof updates.codeStudioInDevelopment === 'boolean'
        ? updates.codeStudioInDevelopment
        : current.codeStudioInDevelopment,
    updatedAt: new Date().toISOString(),
    updatedBy: updates.updatedBy ?? current.updatedBy ?? null,
  };

  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<ToolFeatureSettingsDoc>(COLLECTIONS.appSettings).updateOne(
      { id: TOOL_FEATURE_SETTINGS_DOC_ID },
      { $set: nextDoc },
      { upsert: true }
    );
    return sanitizeToolFeatureSettings(nextDoc);
  }

  await writeJsonFile(appSettingsFilePath, nextDoc);
  return sanitizeToolFeatureSettings(nextDoc);
};

export const getBrainDocuments = async (): Promise<BrainDocument[]> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const docs = await db
      .collection<BrainFileDoc>(COLLECTIONS.brainFiles)
      .find({}, { projection: { _id: 0, fileName: 1, content: 1 } })
      .toArray();
    return docs.sort((a, b) => a.fileName.localeCompare(b.fileName));
  }

  await ensureDir(brainPath);
  const files = await fs.readdir(brainPath);
  const docs = await Promise.all(
    files.map(async (fileName): Promise<BrainDocument | null> => {
      try {
        const filePath = path.join(brainPath, fileName);
        const content = await fs.readFile(filePath, 'utf-8');
        return { fileName, content };
      } catch (error) {
        console.warn(`Skipping unreadable brain file ${fileName}`, error);
        return null;
      }
    })
  );

  return docs.filter((doc): doc is BrainDocument => doc !== null);
};

export const getTrainingFiles = async (): Promise<string[]> => {
  if (useMongoBackend) {
    const docs = await getBrainDocuments();
    return docs.map((doc) => doc.fileName);
  }

  await ensureDir(brainPath);
  return fs.readdir(brainPath);
};

export const saveTrainingFile = async (
  fileName: string,
  content: string
): Promise<void> => {
  const safeFileName = path.basename(fileName);
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<BrainFileDoc>(COLLECTIONS.brainFiles).updateOne(
      { fileName: safeFileName },
      {
        $set: {
          fileName: safeFileName,
          content,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
    return;
  }

  await ensureDir(brainPath);
  const filePath = path.join(brainPath, safeFileName);
  await fs.writeFile(filePath, content, 'utf-8');
};

export const deleteTrainingFile = async (fileName: string): Promise<void> => {
  const safeFileName = path.basename(fileName);
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<BrainFileDoc>(COLLECTIONS.brainFiles).deleteOne({ fileName: safeFileName });
    return;
  }

  await ensureDir(brainPath);
  const filePath = path.join(brainPath, safeFileName);
  await fs.unlink(filePath);
};

export const getTrainingData = async (character?: string): Promise<string> => {
  const characterName = character || 'defaultt';
  const fileName = `${characterName}.json`;

  if (useMongoBackend) {
    const db = await getMongoDb();
    const targetDoc = await db
      .collection<BrainFileDoc>(COLLECTIONS.brainFiles)
      .findOne({ fileName }, { projection: { _id: 0, content: 1 } });

    if (targetDoc?.content) {
      return targetDoc.content;
    }

    const fallbackDoc = await db
      .collection<BrainFileDoc>(COLLECTIONS.brainFiles)
      .findOne({ fileName: 'defaultt.json' }, { projection: { _id: 0, content: 1 } });
    return fallbackDoc?.content || '{}';
  }

  let filePath = path.join(brainPath, fileName);
  try {
    await fs.access(filePath);
  } catch {
    filePath = path.join(brainPath, 'defaultt.json');
  }

  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading brain file ${filePath}:`, error);
    return '{}';
  }
};

export const saveConversationToBrain = async (
  character: string,
  userInput: string,
  aiResponse: string
): Promise<'saved' | 'duplicate' | 'failed'> => {
  const characterName = character.endsWith('.json')
    ? character.replace('.json', '')
    : character;
  const characterFile = `${characterName}.json`;

  if (!characterFile.endsWith('.json') || ['defaultt.json', 'ankuu.json'].includes(characterFile)) {
    return 'failed';
  }

  if (useMongoBackend) {
    const db = await getMongoDb();
    const doc = await db
      .collection<BrainFileDoc>(COLLECTIONS.brainFiles)
      .findOne({ fileName: characterFile }, { projection: { _id: 0, content: 1 } });

    if (!doc?.content) {
      return 'failed';
    }

    const brainData = parseBrainJson(doc.content);
    if (!brainData?.conversations || !Array.isArray(brainData.conversations)) {
      return 'failed';
    }

    const isDuplicate = brainData.conversations.some(
      (convo: any) =>
        typeof convo?.user_input === 'string' &&
        convo.user_input.toLowerCase() === userInput.toLowerCase()
    );
    if (isDuplicate) {
      return 'duplicate';
    }

    brainData.conversations.push({
      user_input: userInput,
      ana_response: aiResponse,
      context: 'learned_from_interaction',
      emotional_tone: 'neutral',
    });

    await db.collection<BrainFileDoc>(COLLECTIONS.brainFiles).updateOne(
      { fileName: characterFile },
      {
        $set: {
          content: JSON.stringify(brainData, null, 2),
          updatedAt: new Date().toISOString(),
        },
      }
    );
    return 'saved';
  }

  const filePath = path.join(brainPath, characterFile);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const brainData = parseBrainJson(fileContent);
    if (!brainData?.conversations || !Array.isArray(brainData.conversations)) {
      return 'failed';
    }

    const isDuplicate = brainData.conversations.some(
      (convo: any) =>
        typeof convo?.user_input === 'string' &&
        convo.user_input.toLowerCase() === userInput.toLowerCase()
    );
    if (isDuplicate) {
      return 'duplicate';
    }

    brainData.conversations.push({
      user_input: userInput,
      ana_response: aiResponse,
      context: 'learned_from_interaction',
      emotional_tone: 'neutral',
    });
    await writeJsonFile(filePath, brainData);
    return 'saved';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'failed';
    }
    console.error(`Failed to save conversation to brain for ${character}:`, error);
    return 'failed';
  }
};

export const getFeedback = async (): Promise<Feedback[]> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const feedback = await db
      .collection<Feedback>(COLLECTIONS.feedback)
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return feedback;
  }

  const feedback = await readJsonFile<Feedback[]>(feedbackFilePath, []);
  return sortByCreatedAtDesc(feedback);
};

export const saveFeedback = async (
  feedback: Omit<Feedback, 'id' | 'createdAt'>
): Promise<Feedback> => {
  const newFeedback: Feedback = {
    ...feedback,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<Feedback>(COLLECTIONS.feedback).insertOne(newFeedback);
    return newFeedback;
  }

  const allFeedback = await getFeedback();
  allFeedback.unshift(newFeedback);
  await writeJsonFile(feedbackFilePath, allFeedback);
  return newFeedback;
};

export const getCommunityPosts = async (): Promise<CommunityPost[]> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    const posts = await db
      .collection<CommunityPost>(COLLECTIONS.communityPosts)
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return posts;
  }

  const posts = await readJsonFile<CommunityPost[]>(communityPostsFilePath, []);
  return sortByCreatedAtDesc(posts);
};

export const saveCommunityPost = async (
  postData: Omit<CommunityPost, 'id' | 'createdAt'>
): Promise<CommunityPost> => {
  const newPost: CommunityPost = {
    ...postData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<CommunityPost>(COLLECTIONS.communityPosts).insertOne(newPost);
    return newPost;
  }

  const allPosts = await getCommunityPosts();
  allPosts.unshift(newPost);
  await writeJsonFile(communityPostsFilePath, allPosts);
  return newPost;
};

export const updateCommunityPost = async (
  postId: string,
  updates: Partial<Pick<CommunityPost, 'text' | 'imageUrl'>>
): Promise<CommunityPost | null> => {
  const cleanUpdates: Partial<Pick<CommunityPost, 'text' | 'imageUrl'>> = {};
  if (typeof updates.text === 'string') {
    cleanUpdates.text = updates.text;
  }
  if (typeof updates.imageUrl === 'string' || updates.imageUrl === null) {
    cleanUpdates.imageUrl = updates.imageUrl;
  }

  if (Object.keys(cleanUpdates).length === 0) {
    return null;
  }

  if (useMongoBackend) {
    const db = await getMongoDb();
    const result = await db.collection<CommunityPost>(COLLECTIONS.communityPosts).findOneAndUpdate(
      { id: postId },
      {
        $set: cleanUpdates,
      },
      {
        returnDocument: 'after',
        projection: { _id: 0 },
      }
    );
    return result ?? null;
  }

  const allPosts = await readJsonFile<CommunityPost[]>(communityPostsFilePath, []);
  const index = allPosts.findIndex((p) => p.id === postId);
  if (index === -1) {
    return null;
  }

  allPosts[index] = {
    ...allPosts[index],
    ...cleanUpdates,
  };
  await writeJsonFile(communityPostsFilePath, allPosts);
  return allPosts[index];
};

export const deleteCommunityPost = async (postId: string): Promise<void> => {
  if (useMongoBackend) {
    const db = await getMongoDb();
    await db.collection<CommunityPost>(COLLECTIONS.communityPosts).deleteOne({ id: postId });
    return;
  }

  const allPosts = await readJsonFile<CommunityPost[]>(communityPostsFilePath, []);
  const updatedPosts = allPosts.filter((p) => p.id !== postId);
  await writeJsonFile(communityPostsFilePath, updatedPosts);
};
