import {pool} from "../db/gym.js";
import { ForbiddenError , UnauthorizedError , NotFoundError} from "./errors/ErrorsIndex.js";

export const verifyAccess = async (req, res, next) => {
    if (!req.user) {
        throw new UnauthorizedError("Unauthorized")
    }

    const user_id = req.user.id;

    const access = await pool.query(
        "SELECT status FROM users WHERE id = $1",
        [user_id]
    );

    if (access.rows.length === 0) {
        throw new NotFoundError("User not found")
    }

    if (access.rows[0].status !== "active") {
        throw new ForbiddenError("Access denied because your account is not active. Please contact the administrator.")
    }

    next();
};