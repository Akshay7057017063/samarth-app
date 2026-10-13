import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import mongoose from "mongoose";

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const col = mongoose.connection.collection("users");
  const indexes = await col.indexes();

  console.log("Current indexes:");
  indexes.forEach((i) =>
    console.log(" - " + i.name + " " + JSON.stringify(i.key) + " unique=" + !!i.unique)
  );

  for (const idx of indexes) {
    const keys = Object.keys(idx.key);
    const onlyEmailOrPhone =
      keys.length === 1 && (keys[0] === "email" || keys[0] === "phone");

    if (onlyEmailOrPhone && idx.unique) {
      await col.dropIndex(idx.name);
      console.log("Dropped unique index: " + idx.name);
    }
  }

  await col.createIndex({ email: 1 });
  await col.createIndex({ phone: 1 });

  console.log("Done.");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

