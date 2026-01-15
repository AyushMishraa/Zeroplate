import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoute";
import { connectToDb } from "./config/db";
import foodRoutes from "./routes/foodRoute";
import { Server } from "socket.io";
import http from "http";
import claimRoutes from "./routes/claimRoutes";
import adminDashboardRoutes from "./routes/adminDashboardRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import { errorHandler } from "./middlewares/errorMiddleware";

dotenv.config();
connectToDb();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
// app.use(xss());
app.use(express.json());
const server = http.createServer(app);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

export const io = new Server(server, {
    cors: {origin: "*"}
});
io.on("connection", (socket) => {
    console.log("New client connected: ", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected: ", socket.id);
    });
});

app.use(cookieParser());
app.use(passport.initialize());
app.use(errorHandler);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/analytics", analyticsRoutes);

export default app;