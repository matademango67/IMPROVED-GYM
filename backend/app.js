import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';

const { gymRouter } = await import("./view/gym_router.js");
const { authRouter } = await import("./view/auth_router.js");
const {MembershipRouter} = await import("./view/membership_router.js")
const {PaymentRouter} = await import("./view/payment_router.js")
const {AdminRouter} = await import("./view/admin_router.js")
const {errorHandler} = await import("./middleware/ErrorHandler.js")

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use('/auth', authRouter);
app.use('/customer', gymRouter);
app.use('/membership',MembershipRouter);
app.use('/payments',PaymentRouter);
app.use('/admin',AdminRouter);
app.use(errorHandler);


export default app;