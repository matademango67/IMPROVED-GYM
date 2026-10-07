import request from 'supertest';
import {pool} from '../../../db/gym.js';
import {test, expect, describe } from "@jest/globals";
import app from '../../../app.js';
import jwt from "jsonwebtoken";
import {randomUUID} from 'node:crypto'

describe('GET /customer', () => {

    describe('authentication' , () => {
              test("GET /customer - no token > 401", async () => {

        const response = await request(app)
        .get("/customer/") ;

        expect(response.statusCode).toBe(401)

                expect(response.body).toEqual({
            message: "Access token required"
        });

    });

    test("GET /customer - invalid token > 401", async () => {

    const response = await request(app)
        .get("/customer/")
        .set("Authorization", "Bearer invalid-token");

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        message: "Invalid access token"
    });

});
    })

    let testUser;
    let testCustomer;

    beforeEach(async () => {

    const userResult = await pool.query(`
        INSERT INTO users (
            role,
            email,
            password_hash
        )
        VALUES ($1, $2, $3)
        RETURNING *
    `, [
        "customer",
        "integration@test.com",
        "fake-password"
    ]);

    testUser = userResult.rows[0];

    const customerResult = await pool.query(`
        INSERT INTO customers (
            name,
            birth,
            email,
            user_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [
        "Integration Test",
        "2000-01-01",
        "customer-integration@test.com",
        testUser.id
    ]);

    testCustomer = customerResult.rows[0];
});

afterEach(async () => {

    await pool.query(
        "DELETE FROM users WHERE id = $1",
        [testUser.id]
    );

});

     test("GET /customer should - found customer > 200", async () => {

        const token = jwt.sign(
    {
         id: testUser.id,
        role: "customer"
    },
    process.env.ACCESS_TOKEN_SECRET
    );

    const response = await request(app)
        .get("/customer/")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual(
    expect.arrayContaining([
        expect.objectContaining({
          user_id: testUser.id,
            name: testCustomer.name,
            email: testCustomer.email
        })
    ])
);
});

    
     test("GET /customer - nonexistent customer > 404", async () => {   
        const nonexistentUserId = randomUUID();

        const token = jwt.sign(
    {
        id: nonexistentUserId,
        role: "customer"
    },
    process.env.ACCESS_TOKEN_SECRET
    );

    const response = await request(app)
        .get("/customer/")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
    message: "Customers not found"
});
});

});

describe('POST /customer', () => {
       let testUser;
    beforeEach(async () => {
        const userResult = await pool.query(`
            INSERT INTO users (
                role,
                email,
                password_hash
            )
            VALUES ($1, $2, $3)
            RETURNING *
        `, [
            "customer",
            "post-integrations@tests.com",
            "fake-password"
        ]);

        testUser = userResult.rows[0];
    });

    afterEach(async () => {

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );

    });

    test('POST /customer - create customer > 201', async () => {

        const token = jwt.sign({
             id : testUser.id ,
            role : testUser.role
        } ,
           process.env.ACCESS_TOKEN_SECRET
    )

        const customerData = { 
            email : "post-integrations@tests.com",
            birth : "2000-01-01",
            name : "octavio",
        };

        const response = await request(app)
        .post('/customer') 
        .set("Authorization" , `Bearer ${token}`)
        .send(customerData);

        const result = await pool.query(`
            SELECT * FROM customers
            WHERE user_id = $1
             ` , [testUser.id])
      
        expect(response.statusCode).toBe(201);

expect(result.rows).toHaveLength(1);

expect(result.rows[0]).toEqual(
    expect.objectContaining({
        email: customerData.email,
        name: customerData.name,
        user_id: testUser.id
    })
);

expect(response.body).toEqual(
    expect.objectContaining({
        email: customerData.email,
        name: customerData.name,
        user_id: testUser.id
    })
);
    });

    test('POST /customer - no token> 401', async () => {
         const customerData = {
        email: "no-token@test.com",
        birth: "2000-01-01",
        name: "No Token"
    };

    const response = await request(app)
        .post("/customer/")
        .send(customerData);

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        message: "Access token required"
    });

    });

    test('POST /customer - invalid token> 401', async () => {
         const customerData = {
        email: "no-token@test.com",
        birth: "2000-01-01",
        name: "invalid token"
    };

    const response = await request(app)
        .post("/customer/")
        .set("Authorization", `Bearer no token`)
        .send(customerData);

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        message: "Invalid access token"
    });

    });

    test("POST /customer - missing name > 400", async () => {

    const token = jwt.sign(
        {
            id: testUser.id,
            role: testUser.role
        },
        process.env.ACCESS_TOKEN_SECRET
    );

    const response = await request(app)
        .post("/customer/")
        .set("Authorization", `Bearer ${token}`)
        .send({
            birth: "2000-01-01"
        });

    const result = await pool.query(
    `SELECT *
     FROM customers
     WHERE user_id = $1`,
    [testUser.id]
);

    expect(result.rows).toHaveLength(0);

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
    message: "name is required"
});

});

})
//
//pnpm test /customer.test.js