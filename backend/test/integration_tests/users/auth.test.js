import {test, expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken , testUserAuthorization} from "../../helpers/auth_helper.js"
import { createTestUser } from "../../helpers/db_helper.js";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken';

const saltrounds = Number(process.env.SALT_ROUNDS.trim())

describe('GET /auth/ - Authorization' ,  () => {
    testUserAuthorization('get','/auth/')
});

describe('PATCH /auth/Update - Authorization' ,  () => {
    testUserAuthorization('patch','/auth/Update')
});

describe('DELETE /auth/me - Authorization' ,  () => {
    testUserAuthorization('delete','/auth/me')
});

describe('GET /auth/' , () => {
    let testUser;

    beforeEach(async () => {
        testUser = await createTestUser()
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })

    test('GET /auth/ - it should return the user > 200', async () => {
        const token = await createTestToken(testUser)

        const response = await request(app)
        .get('/auth/')
        .set("Authorization" , `Bearer ${token}`);

       const result = await pool.query(
          'SELECT * FROM users WHERE id = $1',[testUser.id]
        );

        expect(response.statusCode).toBe(200);
        
        expect(response.body).toEqual(result.rows[0]);
   
    });

        test('GET /auth/ - it should return 404 if user not found', async () => {
            const token = await createTestToken(testUser)

            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [testUser.id]
            );

            const response = await request(app)
            .get('/auth/')
            .set("Authorization" , `Bearer ${token}`);

            expect(response.statusCode).toBe(404);
            expect(response.body).toEqual({ message : 'User not found'});
        }
        );
});

describe('POST /auth/register' , () => {
    let testuser;

    beforeEach(async () => {
        testuser = await createTestUser()
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testuser.id]
        );

        await pool.query(
            "DELETE FROM users WHERE email = $1",
            ['josejosela1@gmail.com']
        );
    })

    test('POST /auth/register - invalid email > 400', async () => {
        const response = await request(app)
        .post('/auth/register')
        .send({ email: 'josejosegmail.com', password: 'password123'});
      
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['josejosegmail.com']
        );

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid email address' });
        expect(result.rows.length).toBe(0);
   
    });

     test('POST /auth/register - invalid password > 400', async () => {
        const response = await request(app)
        .post('/auth/register')
        .send({ email: 'josejola@gmail.com', password: '3'});
      
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['josejola@gmail.com']
        );

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ error: "Password must be at least 6 characters long" });
        expect(result.rows.length).toBe(0);
   
    });

    test('POST /auth/register - user with existing email > 409', async () => {
        const existingUser = await createTestUser({
        email: 'existing1@gmail.com'
    });

        const response = await request(app)
        .post('/auth/register')
        .send({ email: existingUser.email, password: 'password123'});

          await pool.query(
        "DELETE FROM users WHERE id = $1",
        [existingUser.id]
    );
    
        expect(response.statusCode).toBe(409);
        expect(response.body).toEqual({ message: 'User with this email already exists' });
    });

    test('POST /auth/register - creates and return an user > 201', async () => {
        const response = await request(app)
        .post('/auth/register')
        .send({ email: 'josejosela1201@gmail.com', password: 'password123'});
      
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['josejosela1201@gmail.com']
        );

         await pool.query(
            "DELETE FROM users WHERE email = $1",
            [result.rows[0].email]
        );

        expect(response.statusCode).toBe(201);
     //   expect(response.body).toEqual(result.rows[0]);
     //   expect(result.rows.length).toBe(1);
      //  expect(result.rows[0].role).toBe('customer');
   
    });
});

describe('POST /auth/login' , () => {
    let testuser;

    beforeEach(async () => {
        testuser = await createTestUser()
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testuser.id]
        );
    })

    test('POST /auth/login - incorrect password > 400', async () => {

        const response = await request(app)
        .post('/auth/login')
        .send({ email: testuser.email, password: 'password123'});

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid password' , status: "fail" });
        expect(response.body).not.toHaveProperty("accessToken");
   
    });

     test('POST /auth/login - no user > 400', async () => {

        const response = await request(app)
        .post('/auth/login')
        .send({ email: 'Idontexistnomore@gmail.com', password: '333211342'});

        expect(response.statusCode).toBe(400);
        expect(response.body).not.toHaveProperty("accessToken");
   
    });

      test('POST /auth/login - inactive user > 400', async () => {
        const password = await bcrypt.hash('fake-password', saltrounds);
        const inactiveUser = await pool.query(
            "INSERT INTO users (email, password_hash, status) VALUES ($1, $2, $3) RETURNING *",
            ['pablitosa@gmail.com', password, 'inactive']
        );

        const response = await request(app)
        .post('/auth/login')
        .send({ email: inactiveUser.rows[0].email, password: 'fake-password'});

         await pool.query(
        "DELETE FROM users WHERE id = $1",
        [inactiveUser.rows[0].id]
    );
      
        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ message: "User is inactive or blocked. Please contact support.", status: "fail" });
        expect(response.body).not.toHaveProperty("accessToken");
    });

    test('POST /auth/login - logs in and return an access token > 200', async () => {

        const response = await request(app)
        .post('/auth/login')
        .send({ email: testuser.email, password: "fake-password"});

        expect(response.statusCode).toBe(200);
         expect(response.body).toEqual(
        expect.objectContaining({
            message: "Login successful",
            accessToken: expect.any(String)
        })
    );

    expect(() => {
        jwt.verify(
            response.body.accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
    }).not.toThrow();  
    });
});

// refresh route

//describe('PATCH /auth/Update' ,  () => {
    
//});

 //pnpm test /auth.test.js