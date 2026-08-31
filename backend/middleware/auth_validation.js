import {z} from "zod";

const userSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});

const updateSchema = z.object({
    email: z.string().email("Invalid email address"),
    new_password: z.string().min(6, "Password must be at least 6 characters long").optional()
});

const statusSchema = z.object({
   user_id : z.uuid() , status: z.enum(['active', 'inactive' , 'banned'],"Status must be either active , banned or inactive" )
 , status_reason: z.string().min(1, "Status reason is required")
});

 function validateUser(body) {
    return userSchema.safeParse(body);
}   

 function validateUpdate(body) {
    return updateSchema.safeParse(body);
}

function validateStatus(body) {
    return statusSchema.safeParse(body);
}

export function validateStatusMiddleware(req, res, next) {
    const result = validateStatus(req.body);
    if (!result.success) {
         return res.status(400).json({ error: result.error.issues[0].message})
    }
    next();
}

export function validateUserMiddleware(req,res,next){
    const result = validateUser(req.body);
    if (!result.success){
        return res.status(400).json({ error: result.error.issues[0].message})
    }
    next();
}

export function validateUpdateMiddleware(req, res, next) {
    const result = validateUpdate(req.body);
    if (!result.success) {
         return res.status(400).json({ error: result.error.issues[0].message})
    }
    next();
}