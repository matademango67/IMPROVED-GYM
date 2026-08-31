import {test, expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken , testAdminAuthorization} from "../../helpers/auth_helper.js"
import { createTestUser , createTestCustomer , createTestMembership, createTestPayment } from "../../helpers/db_helper.js";

describe('GET /admin/payments - Authorization' ,  () => {
    testAdminAuthorization('get','/admin/payments')
})

describe('GET /admin/payment' , () => {
    let testUser;
    let testAdmin;
    let testCustomer;
    let testMembership;
    let testPayment;

    beforeEach(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestUser({role : 'admin'})
        testCustomer = await createTestCustomer(testUser)
        testMembership = await createTestMembership(testCustomer)
        testPayment = await createTestPayment(testMembership)
    });

    afterEach(async () => {
        // children before parents: payments references memberships,
        // and memberships → customers → users cascades, so payments
        // has to go first or the user delete gets blocked (FK RESTRICT).
        await pool.query("DELETE FROM payments WHERE id = $1", [testPayment.id]);
        await pool.query("DELETE FROM users WHERE id = $1", [testUser.id]);
        await pool.query("DELETE FROM users WHERE id = $1", [testAdmin.id]);
    })

    test('returns all payments > 200' , async () => {
        const token = createTestToken(testAdmin)

        const response = await request(app)
            .get('/admin/payments')
            .set("Authorization" , `Bearer ${token}`);

        const result = await pool.query(`
            SELECT p.*, u.email as customer_email, c.user_id
            FROM payments p
            JOIN memberships m on m.id = p.memberships_id
            JOIN customers c on c.id = m.customer_id
            JOIN users u on u.id = c.user_id
        `)

        const expected = JSON.parse(JSON.stringify(result.rows));

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual(
            expect.arrayContaining(expected)
        );
    })
})

//pnpm test /paymenta.test.js    

//pnpm test /paymenta.test.js