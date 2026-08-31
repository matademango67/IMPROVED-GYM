import {test, expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken , testUserAuthorization} from "../../helpers/auth_helper.js"
import { createTestUser } from "../../helpers/db_helper.js";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken';
import {randomUUID} from 'node:crypto';
import { hashToken , generateRefreshToken} from "../../../config/refresh_token.js";

const saltrounds = Number(process.env.SALT_ROUNDS.trim())

describe('GET /auth/ - Authorization' ,  () => {
    testUserAuthorization('get','/auth/')
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
        const token =  createTestToken(testUser)

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
        expect(response.body).toEqual(result.rows[0]);
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].role).toBe('customer');
   
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

describe('post /auth/refresh' ,  () => {
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

       test('POST /auth/refresh - return a new access token > 200', async () => {
        const loginResponse = await request(app)
         .post('/auth/login')
         .send({
             email: testuser.email,
             password: "fake-password"
            });

        const cookies = loginResponse.headers['set-cookie'];

       const response = await request(app)
        .post('/auth/refresh')
        .set("Cookie", cookies);

       const result = await pool.query(`SELECT * FROM refresh_tokens WHERE user_id = $1` , [testuser.id])

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');

        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.headers['set-cookie'].join(';')).toContain('refreshToken');

        expect(result.rows.length).toBe(2)
        
        await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1` , [testuser.id])

    });

       test('POST /auth/refresh - no refresh token > 401', async () => {
    const response = await request(app)
        .post('/auth/refresh')

   

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        message: 'No refresh token provided'
    });

    expect(response.headers['set-cookie']).toBeFalsy();

    });

       test('POST /auth/refresh - invalid refresh token > 401', async () => {
    const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-refresh-token']);

    const result = await pool.query(
        `SELECT * FROM refresh_tokens WHERE user_id = $1`,
        [testuser.id]
    );

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        message: 'Invalid refresh token'
    });

    expect(response.headers['set-cookie']).toBeFalsy();

    expect(result.rows.length).toBe(0);
    });

      test('POST /auth/refresh - expired refresh token > 401', async () => {
    const refreshToken = generateRefreshToken();
    const token_hash = hashToken(refreshToken);
    const token_id = crypto.randomUUID();

    await pool.query(`
        INSERT INTO refresh_tokens(
            user_id,
            token_hash,
            token_id,
            expires_at
        )
        VALUES($1, $2, $3, $4)
    `, [
        testuser.id,
        token_hash,
        token_id,
        '2026-07-10 21:07:54.944'
    ]);

    const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

    const result = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_id = $1`,
    [token_id]
);


    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
        message: 'Refresh token expired'
    });

    expect(response.headers['set-cookie']).toBeFalsy();
    expect(result.rows.length).toBe(0);
});





    describe('treated as login' , () => {
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

            test('POST /auth/refresh - logs in the user > 200', async () => {
     const response = await request(app)
        .post('/auth/refresh')
        .send({ email: testuser.email, password: "fake-password"});

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');

        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.headers['set-cookie'][0]).toContain('refreshToken');

    });

   test('POST /auth/refresh - logs in the user with an incorrect password > 401', async () => {
     const response = await request(app)
        .post('/auth/refresh')
        .send({ email: testuser.email, password: "fake-passwords"});

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({message : "Invalid password"});
    });
    })
});

describe('DELETE /auth/logout' ,  () => {
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

   test('POST /auth/logout - user logged out successfully > 200', async () => {

    const agent = request.agent(app);

    const loginResponse = await agent
        .post('/auth/login')
        .send({
            email: testuser.email,
            password: 'fake-password'
        });

    expect(loginResponse.statusCode).toBe(200);

    expect(loginResponse.body).toEqual(
        expect.objectContaining({
            message: 'Login successful',
            accessToken: expect.any(String)
        })
    );

    const logoutResponse = await agent
        .delete('/auth/logout');

    expect(logoutResponse.statusCode).toBe(200);

    expect(logoutResponse.body).toEqual({
        message: 'Logged out successfully'
    });

    expect(logoutResponse.body).not.toHaveProperty('accessToken');
    });

   test('POST /auth/logout - no user logged in > 400', async () => {
    const logoutResponse = await request(app)
        .delete('/auth/logout');

    expect(logoutResponse.statusCode).toBe(400);

    expect(logoutResponse.body).toEqual({
        message: 'No refresh token provided'
    });
   });

   test('POST /auth/logout - Invalid refresh token > 400', async () => {
    const logoutResponse = await request(app)
        .delete('/auth/logout')
         .send({
                refreshToken: 'invalid-refresh-token'
            });

    expect(logoutResponse.statusCode).toBe(400);

    expect(logoutResponse.body).toEqual({
        message: 'invalid refreshToken'
    });
   });

});

describe('DELETE /auth/me' ,  () => {
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

   test('Delete /auth/me - inactivates the user > 200', async () => {
    const token = createTestToken(testuser)

    const Response = await request(app)
        .delete('/auth/me')
        .set("Authorization" , `Bearer ${token}`)
        .send({
            status_reason: 'i dont like it anymore'
        });

    const result = await pool.query(
    "SELECT status, status_reason FROM users WHERE id = $1",
    [testuser.id]
    );

    expect(Response.statusCode).toBe(200);
    expect(Response.body).toEqual({message: 'Account inactivated successfully',});
    expect(result.rows[0].status).toBe('inactive');
    expect(result.rows[0].status_reason).toBe('i dont like it anymore');
    expect(Response.body).not.toHaveProperty('accessToken');

    });

    describe('no user', () => {
         test('Delete /auth/me - no user > 404', async () => {
    const testuser = {id : randomUUID() , role : 'user'}
    const token = createTestToken(testuser)

    const Response = await request(app)
        .delete('/auth/me')
        .set("Authorization" , `Bearer ${token}`)
        .send({
            status_reason: 'i dont like it anymore'
        });

    expect(Response.statusCode).toBe(404);

    expect(Response.body).toEqual({message: 'User not found'});

    });
    })

});


// refresh route



 //pnpm test /auth.test.js

