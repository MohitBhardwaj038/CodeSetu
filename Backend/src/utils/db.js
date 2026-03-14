import mongoose from 'mongoose';
import env from './env.js';
import dns from 'dns';

export const connectDB = async () => {
    try {
        dns.setServers(["1.1.1.1", "8.8.8.8"]);
        const conn = await mongoose.connect(`${env.MONGODB_URI}/${env.DB_NAME}`);
        console.log("\n MongoDB connected !! DB HOST: ",conn.connection.host);
    }
    catch(err){
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};