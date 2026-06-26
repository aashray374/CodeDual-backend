import express from "express";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";


const app = express();

app.use(express.json());

app.use(authRoutes);
app.use(userRoutes);


export default app;