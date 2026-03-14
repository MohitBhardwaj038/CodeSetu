import dotenv from 'dotenv';

dotenv.config();

export default {
    PORT:process.env.PORT,
    MONGODB_URI:process.env.MONGODB_URI,
    DB_NAME:process.env.DB_NAME
}



