import {z} from "zod";
import { ValidationError } from "./errors/ErrorsIndex.js";

export const userSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});

export const updateSchema = z.object({
    email: z.string().email("Invalid email address"),
    new_password: z.string().min(6, "Password must be at least 6 characters long").optional()
});

export const statusSchema = z.object({
   user_id : z.uuid() , status: z.enum(['active', 'inactive' , 'banned'],"Status must be either active , banned or inactive" )
 , status_reason: z.string().min(1, "Status reason is required")
});

export function validateUserMiddleware(object) {
    return (req, res, next) => {

        const result = object.safeParse(req.body);

        if (!result.success) {

            const errors = result.error.issues.reduce((acc, issue) => {
                const field = issue.path[0];

                if (!acc[field]) {
                    acc[field] = [];
                }

                acc[field].push(issue.message);

                return acc;
            }, {});

            throw new ValidationError(errors);
        }

        req.body = result.data;
        next();
    };
}