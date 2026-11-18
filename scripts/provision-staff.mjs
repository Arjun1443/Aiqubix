import { MongoClient } from "mongodb";

const hashes = JSON.parse(process.env.AIQUBIX_STAFF_PROVISIONING || "[]");
if (!Array.isArray(hashes) || hashes.length !== 3 || !hashes.every(hash => /^[a-f0-9]{96}$/.test(hash))) {
  throw new Error("Invalid staff provisioning configuration");
}

const rows = [
  ["admin@aiqubix.in", "admin", "Academy Admin"],
  ["seniormanager@aiqubix.in", "senior-manager", "Senior Manager"],
  ["trainer@aiqubix.in", "trainer", "Trainer"],
];

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
try {
  const accounts = client.db(process.env.MONGODB_DATABASE?.trim() || "aiqubix").collection("accounts");
  for (const [index, [_id, role, name]] of rows.entries()) {
    const record = { _id, role, name, profile: {}, passwordHash: hashes[index] };
    const result = await accounts.updateOne({ _id }, { $setOnInsert: record }, { upsert: true });
    const verified = await accounts.findOne({ _id, role, passwordHash: record.passwordHash }, { projection: { _id: 1 } });
    console.log(role + ": " + (verified ? (result.upsertedCount ? "created and verified" : "already provisioned by this setup") : "existing record preserved"));
  }
} catch (error) {
  console.error("Staff provisioning failed", error?.name);
  process.exitCode = 1;
} finally {
  await client.close();
}
