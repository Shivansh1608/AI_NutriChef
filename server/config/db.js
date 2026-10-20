import mongoose from 'mongoose';

const connectDB = async () => {
  const connUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-nutrichef';
  let retries = 5;

  while (retries) {
    try {
      const conn = await mongoose.connect(connUri);
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      break;
    } catch (err) {
      console.error(`[Database] MongoDB connection failed: ${err.message}`);
      retries -= 1;
      console.log(`[Database] Retries remaining: ${retries}`);
      if (retries === 0) {
        console.error('[Database] Could not connect to MongoDB. Exiting...');
        process.exit(1);
      }
      // Wait for 5 seconds before retrying
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

export default connectDB;
