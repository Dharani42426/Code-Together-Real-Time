const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.error('❌ MONGO_URI not set in .env');
      process.exit(1);
    }

    // Check if still using placeholder
    if (uri.includes('cluster0.mongodb.net') && uri.includes('codetogether2024')) {
      console.warn('\n⚠️  WARNING: You are using the placeholder MongoDB URI.');
      console.warn('   The server will start but database features will not work.');
      console.warn('   To fix: Replace MONGO_URI in server/.env with your Atlas URI.');
      console.warn('   Get free MongoDB at: https://cloud.mongodb.com\n');
      return;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected.');
    });

  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed: ${error.message}`);

    if (error.message.includes('ECONNREFUSED') || error.message.includes('localhost')) {
      console.error('💡 MongoDB is not running locally.');
      console.error('   Use MongoDB Atlas (free): https://cloud.mongodb.com\n');
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('💡 Invalid MongoDB Atlas URI or no internet connection.');
      console.error('   Check your MONGO_URI in server/.env\n');
    }
    if (error.message.includes('bad auth') || error.message.includes('Authentication')) {
      console.error('💡 Wrong MongoDB username or password.\n');
    }
    if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.error('💡 Your IP is not whitelisted in Atlas Network Access.\n');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
