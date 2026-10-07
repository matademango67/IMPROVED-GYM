import {test, expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken} from "../../helpers/auth_helper.js"
import { createTestUser , createTestCustomer } from "../../helpers/db_helper.js";

describe('Authorization' , () => {
      test('no Access token > 401', async () => {
        const response = await request(app)
        .get('/admin/customers');

        expect(response.statusCode).toBe(401)
         expect(response.body).toEqual({
            message: "Access token required"
        });
      }) ;

       test('Invalid Access token > 401' , async () => {
        const response = await request(app)
        .get('/admin/customers')
        .set('Authorization' , "Bearer invalid-token");

        expect(response.statusCode).toBe(401)
        expect(response.body).toEqual({
            message: "Invalid access token"
        });
      })

      test('Unauthorize > 403' , async () => {
        let testUser = await createTestUser()
        const token = await createTestToken(testUser)

        const response = await request(app)
        .get('/admin/customers')
        .set('Authorization' , `Bearer ${token}`);

        expect(response.statusCode).toBe(403)
        expect(response.body).toEqual({
            message: "Forbidden"
        });
      })
})

describe('GET /admin/customers' , () => {
    let testAdmin;
    let testCustomer;

    beforeEach(async () => {
        testAdmin = await createTestUser({role: 'admin'})
        testCustomer = await createTestCustomer(testAdmin)
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testCustomer.id]
        );
    })

    test('GET /admin/customers - it should return all customers > 200', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .get('/admin/customers')
        .set("Authorization" , `Bearer ${token}`);

        expect(response.statusCode).toBe(200)

      expect(response.body).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ id: testCustomer.id, email: testCustomer.email })
        ])
    );
})
})

describe('GET /admin/findcustomer/:search' , () => {
    let testAdmin;
    let testCustomer;

    beforeEach(async () => {
        testAdmin = await createTestUser({role: 'admin'})
        testCustomer = await createTestCustomer(testAdmin)
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );
    })

       afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testCustomer.id]
        );
    })

    test('GET /admin/findcustomer/:search - return all the customers matching the name > 200', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .get('/admin/findcustomer/Integration Test')
        .set("Authorization" , `Bearer ${token}`);

        const result = await pool.query(`
        SELECT *
        FROM customers
        WHERE name ILIKE $1
           OR email ILIKE $1
        ` , [`${testCustomer.email}`])

       const expected = JSON.parse(JSON.stringify(result.rows));

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual(
    expect.arrayContaining(expected)
);
    })


    test('GET /admin/findcustomer/:search - customer not found > 404', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .get('/admin/findcustomer/Integration Testas12121212122')
        .set("Authorization" , `Bearer ${token}`);

        expect(response.statusCode).toBe(404)

        expect(response.body).toEqual(
        {message : "Customer not found"}
);
    });

     
})

//pnpm test /customera.test.js