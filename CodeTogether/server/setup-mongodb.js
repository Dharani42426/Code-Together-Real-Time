const https = require('https');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function main() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════╗`);
  console.log(`║   CodeTogether — MongoDB Atlas Setup       ║`);
  console.log(`╚════════════════════════════════════════════╝${RESET}\n`);

  console.log(`${YELLOW}MongoDB is not installed locally on this machine.${RESET}`);
  console.log(`${GREEN}We will use MongoDB Atlas (Free Cloud Database).${RESET}\n`);

  console.log(`${BOLD}Follow these steps to get your Atlas connection string:${RESET}\n`);
  console.log(`${CYAN}Step 1:${RESET} Go to → ${BOLD}https://cloud.mongodb.com${RESET}`);
  console.log(`${CYAN}Step 2:${RESET} Sign up for free (use Google or email)`);
  console.log(`${CYAN}Step 3:${RESET} Click ${BOLD}"Build a Database"${RESET} → Choose ${BOLD}FREE (M0)${RESET} → Click ${BOLD}Create${RESET}`);
  console.log(`${CYAN}Step 4:${RESET} Create a DB user:`);
  console.log(`         Username: ${BOLD}codetogether${RESET}`);
  console.log(`         Password: ${BOLD}codetogether2024${RESET} (or your own)`);
  console.log(`         Click ${BOLD}Create User${RESET}`);
  console.log(`${CYAN}Step 5:${RESET} Under "Where would you like to connect from?"`);
  console.log(`         Click ${BOLD}"Add My Current IP Address"${RESET} → Click ${BOLD}Finish and Close${RESET}`);
  console.log(`${CYAN}Step 6:${RESET} Click ${BOLD}Connect${RESET} → ${BOLD}Drivers${RESET} → Copy the connection string`);
  console.log(`         It looks like: ${BOLD}mongodb+srv://codetogether:<password>@cluster0.xxxxx.mongodb.net/${RESET}\n`);

  const uri = await ask(`${BOLD}Paste your MongoDB Atlas connection string here:\n> ${RESET}`);

  if (!uri || !uri.startsWith('mongodb')) {
    console.log(`\n${RED}Invalid connection string. Please try again.${RESET}`);
    rl.close();
    return;
  }

  // Replace <password> placeholder if present
  let finalUri = uri.trim();
  if (finalUri.includes('<password>')) {
    const pass = await ask(`${BOLD}Enter your Atlas DB password: ${RESET}`);
    finalUri = finalUri.replace('<password>', pass.trim());
  }

  // Add database name if not present
  if (!finalUri.includes('/codetogether')) {
    finalUri = finalUri.replace('/?', '/codetogether?');
    if (!finalUri.includes('/codetogether')) {
      finalUri = finalUri + '/codetogether';
    }
  }

  // Update .env file
  const envPath = path.join(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /MONGO_URI=.*/,
    `MONGO_URI=${finalUri}`
  );
  fs.writeFileSync(envPath, envContent);

  console.log(`\n${GREEN}✅ .env updated with your Atlas connection string!${RESET}`);
  console.log(`\n${BOLD}Testing connection...${RESET}\n`);

  rl.close();

  // Test the connection
  process.env.MONGO_URI = finalUri;
  const mongoose = require('mongoose');

  try {
    await mongoose.connect(finalUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`${GREEN}${BOLD}✅ MongoDB Atlas Connected Successfully!${RESET}`);
    console.log(`${GREEN}   Host: ${mongoose.connection.host}${RESET}`);
    console.log(`${GREEN}   Database: codetogether${RESET}`);
    console.log(`\n${CYAN}${BOLD}🚀 You can now start the server:${RESET}`);
    console.log(`${BOLD}   npm run dev${RESET}\n`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.log(`${RED}${BOLD}❌ Connection failed: ${err.message}${RESET}`);
    console.log(`\n${YELLOW}Common fixes:${RESET}`);
    console.log(`  1. Make sure your IP is whitelisted in Atlas Network Access`);
    console.log(`  2. Check your username and password are correct`);
    console.log(`  3. Try adding 0.0.0.0/0 in Atlas Network Access to allow all IPs\n`);
    process.exit(1);
  }
}

main();
