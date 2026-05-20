import mongoose from 'mongoose';

import env from '../utils/env.js';
import dns from 'dns';

export const connectDB = async () => {
    try {
        dns.setServers(["1.1.1.1", "8.8.8.8"]);
        // Use URI directly — it already contains the DB name
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 8000,
        });
        console.log("\n MongoDB connected !! DB HOST: ",conn.connection.host);
    }
    catch(err){
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

