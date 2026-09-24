const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
