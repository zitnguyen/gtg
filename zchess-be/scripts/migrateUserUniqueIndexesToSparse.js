require("dotenv").config();
const mongoose = require("mongoose");

async function migrateUserUniqueIndexesToSparse() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = mongoose.connection.collection("users");
  const indexes = await users.indexes();
  const indexNames = indexes.map((index) => index.name);

  if (indexNames.includes("email_1")) {
    await users.dropIndex("email_1");
    console.log("Dropped index: email_1");
  }

  if (indexNames.includes("phone_1")) {
    await users.dropIndex("phone_1");
    console.log("Dropped index: phone_1");
  }

  await users.createIndex({ email: 1 }, { name: "email_1", unique: true, sparse: true });
  await users.createIndex({ phone: 1 }, { name: "phone_1", unique: true, sparse: true });
  console.log("Recreated email_1 and phone_1 as unique+sparse indexes.");
}

migrateUserUniqueIndexesToSparse()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Index migration completed.");
  })
  .catch(async (error) => {
    console.error("Index migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
