import { Router } from "express";
import { gym_controller } from "../controller/gym/gym_controller.js";
import {customers , validate} from "../middleware/gym_validation.js"
import {verifyAccessToken} from "../middleware/accesstoken_validation.js";
import {verifyAccess} from "../middleware/verifyAccess.js"; 

export const gymRouter = Router();

gymRouter.get('/', verifyAccessToken,gym_controller.getCustomer);
gymRouter.post('/',verifyAccessToken,validate(customers), gym_controller.createCustomer);
gymRouter.patch('/',verifyAccessToken, verifyAccess, validate(customers), gym_controller.UpdateCustomer);
