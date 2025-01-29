import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

//NOTE: 2nd Approach
connectDB()
  .then(() => {
    //ERROR k liye listen karo, before starting the server, app.on() means on error kya krna hai?!
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

//NOTE: 1st approach IIFE, try catch async await

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERROR", error);
//       throw error;
//     });
//   } catch (error) {
//     console.error("ERROR", error);
//     throw error;
//   }

//   app.listen(process.env.PORT, () => {
//     console.log(`App is listening on port : ${process.env.PORT}`);
//   });
// })();
