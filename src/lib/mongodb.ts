'use server';

import { Db, MongoClient, ServerApiVersion } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var __anaMongoClientPromise: Promise<MongoClient> | undefined;
}

const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI or MONGO_URI environment variable.');
  }
  return uri;
};

const getMongoDbName = (): string => {
  return process.env.MONGODB_DB_NAME || process.env.MONGO_DB_NAME || 'ana';
};

export const isMongoConfigured = (): boolean => {
  return Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
};

const createMongoClientPromise = (): Promise<MongoClient> => {
  const client = new MongoClient(getMongoUri(), {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  return client.connect();
};

export const getMongoClient = (): Promise<MongoClient> => {
  if (!global.__anaMongoClientPromise) {
    global.__anaMongoClientPromise = createMongoClientPromise();
  }
  return global.__anaMongoClientPromise;
};

export const getMongoDb = async (): Promise<Db> => {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
};
