import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors/ErrorsIndex.js';

export function verifyAccessToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Access Token required");
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
    throw new UnauthorizedError("Access Token required");
}

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        if (!decoded.id || !decoded.role) {
            throw new UnauthorizedError("Invalid Access Token");
        }

        req.user = {
            role: decoded.role,
            id: decoded.id
        };

        next();

    } catch (error) {

        if (error instanceof UnauthorizedError) {
            throw error;
        }

        if (error.name === "TokenExpiredError") {
            throw new UnauthorizedError("Token is expired");
        }

        throw new UnauthorizedError("Invalid token");
    }
}