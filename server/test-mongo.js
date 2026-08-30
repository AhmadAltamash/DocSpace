import 'dotenv/config';
import mongoose from 'mongoose';

console.log('Testing MongoDB connection...');
console.log('URI exists:', Boolean(process.env.MONGODB_URI));

try {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('✅ MongoDB CONNECTED');

  await mongoose.disconnect();

  console.log('✅ MongoDB DISCONNECTED');
} catch (error) {
  console.error('❌ MongoDB CONNECTION FAILED');
  console.error(error);
  process.exit(1);
}