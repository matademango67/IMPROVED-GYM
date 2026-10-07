import { z } from "zod";
import { ValidationError } from "./errors/ErrorsIndex.js";

export const customers = z.object({
    name: z.string("name is required").min(1, "Name is required").max(30, "Name must be less than 100 characters"),
    birth: z.string().refine(
        (date) => !isNaN(Date.parse(date)),
        "Birth date must be a valid date (YYYY-MM-DD)"
    ).transform((date) => new Date(date)).refine(
        (date) => date >= new Date("1935-01-01") && date <= new Date("2011-01-01"),
        "Birth date must be between 1935-01-01 and 2011-01-01 (customer must be 15+ years old)"
    )
});

export const membership = z.object({
    type: z.enum(["normal","vip"]),
    status: z.enum(["active", 'expired', 'banned', 'paused']).optional(),
});

export function validate(object) {
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
