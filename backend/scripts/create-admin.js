const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const { sequelize, User } = require("../src/models");

const email = (process.env.ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "123456@admin";
const firstName = (process.env.ADMIN_FIRST_NAME || "Admin").trim();
const lastName = (process.env.ADMIN_LAST_NAME || "User").trim();

async function main() {
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  await sequelize.authenticate();
  await sequelize.sync();

  const hashedPassword = await bcrypt.hash(password, 10);
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      password: hashedPassword,
      role: "ADMIN",
      firstName,
      lastName,
      isVerified: true,
    },
  });

  if (!created) {
    await user.update({
      password: hashedPassword,
      role: "ADMIN",
      firstName: user.firstName || firstName,
      lastName: user.lastName || lastName,
      isVerified: true,
    });
  }

  console.log(`${created ? "Created" : "Updated"} admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error("Create admin failed:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
