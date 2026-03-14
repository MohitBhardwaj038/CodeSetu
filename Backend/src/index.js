import app from "./app.js";
import env from "./utils/env.js";
import { connectDB } from "./utils/db.js";


connectDB().then(()=>{
    app.listen(env.PORT,()=>{
        console.log(`Server is running on port ${env.PORT}`);
    })
}).catch((err)=>{
    console.error('Failed to connect to the database. Server not started.', err);
});

