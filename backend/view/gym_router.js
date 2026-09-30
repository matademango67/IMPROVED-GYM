import { Router } from "express";
import { gym_controller } from "../controller/gym/gym_controller.js";
import {validar_customer , validate} from "../middleware/gym_validation.js"
import {verifyAccessToken} from "../middleware/accesstoken_validation.js";
import {verifyAccess} from "../middleware/verifyAccess.js"; 
import { errorHandler } from "../middleware/ErrorHandler.js";

export const gymRouter = Router();

gymRouter.get('/', verifyAccessToken,gym_controller.getCustomer , errorHandler);
gymRouter.post('/',verifyAccessToken,validate(validar_customer), gym_controller.createCustomer);
gymRouter.patch('/',verifyAccessToken, verifyAccess, validate(validar_customer), gym_controller.UpdateCustomer);
