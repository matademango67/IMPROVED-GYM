import { Router } from "express";
import { auth_controller } from "../controller/auth_controller.js";
import { gym_controller } from "../controller/gym/gym_controller.js";
import { paymentController } from "../controller/gym/payment_controller.js";
import { gym_membership } from "../controller/gym/membership_controller.js";
import { statusSchema, validateUserMiddleware ,updateSchema , userSchema } from "../middleware/auth_validation.js";
import { authorizeRoles} from "../middleware/roles.js"
import {verifyAccessToken} from "../middleware/accesstoken_validation.js"
export const AdminRouter = Router();

// customer routes

AdminRouter.get('/customers',verifyAccessToken, authorizeRoles('admin' , 'employee'), gym_controller.getAllCustomers); 
AdminRouter.get('/findcustomer/:search',verifyAccessToken,authorizeRoles('admin' , 'employee'), gym_controller.SearchCustomer);

// membership routes

AdminRouter.get('/memberships',verifyAccessToken, authorizeRoles('admin' , 'employee'), gym_membership.get_memberships);
AdminRouter.patch('/memberships/type',verifyAccessToken , authorizeRoles('admin' , 'employee'), gym_membership.changeType_membership)
AdminRouter.patch('/memberships/status',verifyAccessToken, authorizeRoles('admin' , 'employee'), gym_membership.changeStatus_membership);

// payments routes

AdminRouter.get('/payments',verifyAccessToken, authorizeRoles('admin' , 'employee'), paymentController.get_allpayments);

// users routes

AdminRouter.get('/',verifyAccessToken, authorizeRoles('admin' , 'employee'), auth_controller.getUsers);
AdminRouter.post('/register', verifyAccessToken, authorizeRoles('admin'), validateUserMiddleware(userSchema), (req, res) => auth_controller.registerUser(req, res, "admin"));
AdminRouter.post('/register/employee', verifyAccessToken, authorizeRoles('admin'), validateUserMiddleware(userSchema), (req, res) => auth_controller.registerUser(req, res, "employee"));
AdminRouter.patch('/setUserStatus',verifyAccessToken, authorizeRoles('admin' , 'employee'),validateUserMiddleware(statusSchema), auth_controller.setUserStatus)
AdminRouter.patch('/Update', verifyAccessToken , authorizeRoles('admin'), validateUserMiddleware(updateSchema) ,  auth_controller.update);


      