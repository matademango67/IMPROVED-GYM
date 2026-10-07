import { Router } from "express";
import { gym_membership } from "../controller/gym/membership_controller.js";
import {membership , validate} from "../middleware/gym_validation.js"
import {verifyAccessToken} from "../middleware/accesstoken_validation.js";
import {verifyAccess} from "../middleware/verifyAccess.js"; 

export const MembershipRouter = Router();

MembershipRouter.get('/me',verifyAccessToken, gym_membership.search_memberships);
MembershipRouter.post('/',verifyAccessToken, verifyAccess, validate(membership) , gym_membership.create_membership);
MembershipRouter.patch('/status',verifyAccessToken , verifyAccess, gym_membership.changeStatus_membership)
