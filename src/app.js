import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";

const app = express();

app.use((err, req, res, next) => {
  console.error(err); // Log the error for debugging
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//NOTE: to accept Data in JSON and define its limit
app.use(
  express.json({
    limit: "16kb",
  })
);

//NOTE: to accept Data from URL and define its limit and extended means nested objects bhi allowed
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

//NOTE: this means what we can save some static files and images on our server only in our public folder
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

export { app };
