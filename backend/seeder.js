import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kiraya_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');

    // Clear existing users just for safety in dev (optional, comment out for prod)
    // await User.deleteMany(); 

    const existingOwner = await User.findOne({ username: 'owner' });

    if (!existingOwner) {
      await User.create({
        username: 'Naseeb',
        password: 'Naseeb7971',
        fullName: 'System Administrator',
        role: 'owner',
        isActive: true
      });
      console.log('Admin account created successfully.');
      console.log('Username: owner | Password: admin123');
    } else {
      console.log('Admin account already exists.');
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
