import jwt from "jsonwebtoken";
import { test, expect, describe } from "@jest/globals";
import request from "supertest";

import app from "../../app.js";
import { createTestUser } from "../helpers/db_helper.js";

export function createTestToken(testUser, overrides = {}) {
    return jwt.sign(
        {
            id: testUser.id,
            role: testUser.role,
            ...overrides
        },
        process.env.ACCESS_TOKEN_SECRET
    );
}

export function testAdminAuthorization(method, route) {

    describe("Authorization", () => {

        test("no Access token > 401", async () => {
            const response = await request(app)[method](route);

            expect(response.statusCode).toBe(401);

            expect(response.body).toEqual({
                message: "Access token required"
            });
        });

        test("Invalid Access token > 401", async () => {
            const response = await request(app)
                [method](route)
                .set("Authorization", "Bearer invalid-token");

            expect(response.statusCode).toBe(401);

            expect(response.body).toEqual({
                message: "Invalid access token"
            });
        });

        test("Non-admin user > 403", async () => {
            const testUser = await createTestUser();

            const token = createTestToken(testUser);

            const response = await request(app)
                [method](route)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(403);

            expect(response.body).toEqual({
                message: "Forbidden"
            });
        });

    });
};

export function testUserAuthorization(method, route) {

    describe("Authorization", () => {

        test("no Access token > 401", async () => {
            const response = await request(app)[method](route);

            expect(response.statusCode).toBe(401);

            expect(response.body).toEqual({
                message: "Access token required"
            });
        });

        test("Invalid Access token > 401", async () => {
            const response = await request(app)
                [method](route)
                .set("Authorization", "Bearer invalid-token");

            expect(response.statusCode).toBe(401);

            expect(response.body).toEqual({
                message: "Invalid access token"
            });
        });
    });
}