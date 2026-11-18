import { MongoClient } from "mongodb";

let client: MongoClient | undefined;

export function getDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is missing");

  client ??= new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 4000,
    socketTimeoutMS: 5000,
    waitQueueTimeoutMS: 5000,
  });

  return client.db(process.env.MONGODB_DATABASE?.trim() || "aiqubix");
}
