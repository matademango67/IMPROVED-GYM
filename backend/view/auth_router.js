import { Router } from "express";
import { auth_controller } from "../controller/auth_controller.js";
import { validateUserMiddleware ,   userSchema } from "../middleware/auth_validation.js";
import {verifyAccessToken} from "../middleware/accesstoken_validation.js"
export const authRouter = Router();

authRouter.get('/', verifyAccessToken , auth_controller.getme);
authRouter.post('/register', validateUserMiddleware(userSchema), (req, res) => auth_controller.registerUser(req, res, "customer"));
authRouter.post('/login',  validateUserMiddleware(userSchema),  auth_controller.login );
authRouter.post('/refresh' , auth_controller.refreshToken);
authRouter.delete('/logout' , auth_controller.logout);
authRouter.delete('/me' , verifyAccessToken, auth_controller.delete_me)

