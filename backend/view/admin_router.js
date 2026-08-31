import { Router } from "express";
import { auth_controller } from "../controller/auth_controller.js";
import { gym_controller } from "../controller/gym/gym_controller.js";
import { paymentController } from "../controller/gym/payment_controller.js";
import { gym_membership } from "../controller/gym/membership_controller.js";
import { validateUserMiddleware, validateUpdateMiddleware , validateStatusMiddleware} from "../middleware/auth_validation.js";
import {verifyAdmin , verifyEmployee} from "../middleware/roles.js"
import {verifyAccessToken} from "../middleware/accesstoken_validation.js"
export const AdminRouter = Router();

// customer routes

AdminRouter.get('/customers',verifyAccessToken, verifyEmployee, gym_controller.getAllCustomers); 
AdminRouter.get('/findcustomer/:search',verifyAccessToken,verifyEmployee, gym_controller.SearchCustomer);

// membership routes

AdminRouter.get('/memberships',verifyAccessToken, verifyEmployee, gym_membership.get_memberships);
AdminRouter.patch('/memberships/type',verifyAccessToken , verifyEmployee, gym_membership.changeType_membership)
AdminRouter.patch('/memberships/status',verifyAccessToken, verifyEmployee, gym_membership.changeStatus_membership);

// payments routes

AdminRouter.get('/payments',verifyAccessToken, verifyAdmin, paymentController.get_allpayments);

// users routes

AdminRouter.get('/',verifyAccessToken, verifyEmployee, auth_controller.getUsers);
AdminRouter.post('/register', verifyAccessToken, verifyAdmin, validateUserMiddleware, (req, res) => auth_controller.registerUser(req, res, "admin"));
AdminRouter.post('/register/employee', verifyAccessToken, verifyAdmin, validateUserMiddleware, (req, res) => auth_controller.registerUser(req, res, "employee"));
AdminRouter.patch('/setUserStatus',verifyAccessToken, verifyEmployee,validateStatusMiddleware, auth_controller.setUserStatus)
AdminRouter.patch('/Update', verifyAccessToken , verifyAdmin, validateUpdateMiddleware ,  auth_controller.update);


      