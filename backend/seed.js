import { Problem } from "./models/problem.model.js";
import env from "./utils/env.js"

const problemsData = [];
const seedDatabase =  async () => {
    try {
        const conn = await mongoose.connect(`${env.MONGODB_URI}/${env.DB_NAME}`);
        console.log("\n MongoDB connected !! DB HOST: ",conn.connection.host);

        for  (const problemData of problemsData) {
            await Problem.findOneAndUpdate(
                {slug : problemData.slug},
                problemData,
                {
                    upsert : true,
                    new : true,
                    setDefaultsOnInsert : true
                }
            );
        }

        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}