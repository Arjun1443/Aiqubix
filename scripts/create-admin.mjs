import { MongoClient } from "mongodb";
import { hashPassword } from "../lib/password.mjs";

const uri = process.env.MONGODB_URI?.trim();
const email = process.env.AIQUBIX_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.AIQUBIX_ADMIN_PASSWORD;
const name = process.env.AIQUBIX_ADMIN_NAME?.trim() || "Academy Admin";

if (!uri || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 || !password || password.length < 12 || password.length > 128 ||
    name.length < 2 || name.length > 100) {
  throw new Error("Configure MONGODB_URI, AIQUBIX_ADMIN_EMAIL and a 12–128 character AIQUBIX_ADMIN_PASSWORD.");
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
try {
  const accounts = client.db(process.env.MONGODB_DATABASE?.trim() || "aiqubix").collection("accounts");
  await accounts.insertOne({ _id: email, role: "admin", name, profile: {}, passwordHash: await hashPassword(password) });
  console.log("Admin account created.");
} catch (error) {
  console.error(error?.code === 11000 ? "An account already uses that email." : "Could not create admin account.");
  process.exitCode = 1;
} finally {
  await client.close();
}
