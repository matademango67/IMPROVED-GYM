import { ForbiddenError } from "./errors/ErrorsIndex.js";

export function authorizeRoles(...allowedRoles){
  return function(req,res,next){
       if(!allowedRoles.includes(req.user.role) ){
        throw new ForbiddenError("Forbidden")
    }
    next()
  }
  
}

