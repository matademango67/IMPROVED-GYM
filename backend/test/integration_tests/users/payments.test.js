import { expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken} from "../../helpers/auth_helper.js"
import { createTestUser , createTestCustomer , createTestMembership , createTestPayment} from "../../helpers/db_helper.js";


describe("authorization" , () => {
           test('Get payments/ - no token > 401' , async () => {
       const response = await request(app)
       .get('/payments/');

       expect(response.statusCode).toBe(401)
       expect(response.body).toEqual({
            status: "fail",
            message: "Access token required"
        });
    });

    test('Get payments/ - invalid token > 401' , async () => {
       const response = await request(app)
       .get('/payments/')
       .set("Authorization", "Bearer invalid-token")

       expect(response.statusCode).toBe(401)
       expect(response.body).toEqual({
            status: "fail",
            message: "Invalid access token"
        });
    });
    });


describe('GET /payments/', () => {
    let testUser;
    let testcustomer;
    let testmembership;
    let testpayment;

    beforeEach(async () => {
        testUser = await createTestUser();
        testcustomer = await createTestCustomer(testUser);
        testmembership = await createTestMembership(testcustomer);
        testpayment = await createTestPayment(testmembership);
    });

    afterEach(async () => {
        // Delete payment first because it depends on membership
        await pool.query(
            "DELETE FROM payments WHERE memberships_id = $1",
            [testmembership.id]
        );

        // Delete membership because it depends on customer
        await pool.query(
            "DELETE FROM memberships WHERE id = $1",
            [testmembership.id]
        );

        // Delete customer because it depends on user
        await pool.query(
            "DELETE FROM customers WHERE id = $1",
            [testcustomer.id]
        );

        // Delete user last
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    });

    test('gets the users payment > 200', async () => {
        const token = createTestToken(testUser);

        const response = await request(app)
            .get('/payments/')
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    amount: 1500.00,
                    memberships_id: testmembership.id
                })
            ])
        );
    });

    describe('NO PAYMENTS', () => {
        let testUser;
        let testcustomer;
        let testmembership;

        beforeEach(async () => {
            testUser = await createTestUser();
            testcustomer = await createTestCustomer(testUser);
            testmembership = await createTestMembership(testcustomer);
        });

        afterEach(async () => {
            // No payments exist, so membership can be deleted directly
            await pool.query(
                "DELETE FROM memberships WHERE id = $1",
                [testmembership.id]
            );

            await pool.query(
                "DELETE FROM customers WHERE id = $1",
                [testcustomer.id]
            );

            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [testUser.id]
            );
        });

        test('Get /payments/ - no payments > 200', async () => {
            const token = createTestToken(testUser);

            const response = await request(app)
                .get('/payments/')
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);

            expect(response.body).toEqual([]);
        });
    });
});


describe('POST /payments/', () => {
    let testUser;
    let testcustomer;
    let testmembership;

    describe('with membership', () => {

        beforeEach(async () => {
            testUser = await createTestUser();
            testcustomer = await createTestCustomer(testUser);
            testmembership = await createTestMembership(testcustomer);
        });

        afterEach(async () => {
            // Delete payments first
            await pool.query(
                "DELETE FROM payments WHERE memberships_id = $1",
                [testmembership.id]
            );

            // Delete membership
            await pool.query(
                "DELETE FROM memberships WHERE id = $1",
                [testmembership.id]
            );

            // Delete customer
            await pool.query(
                "DELETE FROM customers WHERE id = $1",
                [testcustomer.id]
            );

            // Delete user last
            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [testUser.id]
            );
        });

        test('POST /payments/ - Creates payment > 201', async () => {
            const token = createTestToken(testUser);

            const response = await request(app)
                .post('/payments/')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    amount: 1500.00,
                    memberships_id: testmembership.id
                });

            expect(response.status).toBe(201);

            expect(response.body).toEqual(
                expect.objectContaining({
                    memberships_id: testmembership.id
                })
            );

            const result = await pool.query(
                `
                SELECT *
                FROM payments
                WHERE memberships_id = $1
                `,
                [testmembership.id]
            );

            expect(result.rows).toHaveLength(1);

            expect(result.rows[0]).toEqual(
                expect.objectContaining({
                    amount: 1500,
                    memberships_id: testmembership.id
                })
            );
        });
    });


    describe('no membership', () => {

        beforeEach(async () => {
            testUser = await createTestUser();
            testcustomer = await createTestCustomer(testUser);
        });

        afterEach(async () => {
            // Delete customer first
            await pool.query(
                "DELETE FROM customers WHERE id = $1",
                [testcustomer.id]
            );

            // Delete user last
            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [testUser.id]
            );
        });

        test('POST /payments/ - no membership > 404', async () => {
            const token = createTestToken(testUser);

            const response = await request(app)
                .post('/payments/')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);

            expect(response.body).toEqual({
                error: 'Membership not found'
            });
        });
    });
}); 

//pnpm test /payments.test.js


