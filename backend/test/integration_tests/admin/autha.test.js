import {test, expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken , testAdminAuthorization} from "../../helpers/auth_helper.js"
import { createTestUser } from "../../helpers/db_helper.js";
import {randomUUID} from 'node:crypto'
import bcrypt from "bcrypt";

describe('GET /admin/ - Authorization' ,  () => {
    testAdminAuthorization('get','/admin/')
});

describe('POST /admin/register - Authorization' ,  () => {
    testAdminAuthorization('post','/admin/register')
});

describe('POST /admin/register/employee - Authorization' ,  () => {
    testAdminAuthorization('post','/admin/register/employee')
});

describe('PATCH /admin/setUserStatus - Authorization' ,  () => {
    testAdminAuthorization('patch','/admin/setUserStatus')
});

describe('PATCH /admin/Update - Authorization' ,  () => {
    testAdminAuthorization('patch','/admin/Update')
});

describe('GET /admin/' , () => {
    let testAdmin;

    beforeEach(async () => {
        testAdmin = await createTestUser({role: 'admin'})
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );
    })

    test('GET /admin/ - it should return all users > 200', async () => {
        const token = await createTestToken(testAdmin)

        const response = await request(app)
        .get('/admin/')
        .set("Authorization" , `Bearer ${token}`);

       const result = await pool.query(
          'SELECT * FROM users '
        );

        const expected = JSON.parse(JSON.stringify(result.rows));

        expect(response.statusCode).toBe(200);
        
       // expect(response.body).toEqual(expected);
   
    });
});

describe('POST /admin/register' , () => {
    let testAdmin;
    let existingUser;

    beforeEach(async () => {
        testAdmin = await createTestUser({role: 'admin'})

        existingUser = await createTestUser({
        email: 'existing11@gmail.com'
    });

    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

        await pool.query(
            "DELETE FROM users WHERE email = $1",
            ['josejosela1@gmail.com']
        );

           await pool.query(
        "DELETE FROM users WHERE id = $1",
        [existingUser.id]
    );
    })

    test('POST /admin/register - invalid email > 400', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .post('/admin/register')
        .set("Authorization" , `Bearer ${token}`)
        .send({ email: 'josejosegmail.com', password: 'password123'});
      
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['josejosegmail.com']
        );

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid email address' });
        expect(result.rows.length).toBe(0);
   
    });

     test('POST /admin/register - invalid password > 400', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .post('/admin/register')
        .set("Authorization" , `Bearer ${token}`)
        .send({ email: 'josejola@gmail.com', password: '3'});
      
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['josejola@gmail.com']
        );

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ error: "Password must be at least 6 characters long" });
        expect(result.rows.length).toBe(0);
   
    });

    test('POST /admin/register - user with existing email > 409', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .post('/admin/register')
        .set("Authorization" , `Bearer ${token}`)
        .send({ email: existingUser.email, password: 'password123'});

    
        expect(response.statusCode).toBe(409);
        expect(response.body).toEqual({ message: 'User with this email already exists' });

       
   
    });

    test('POST /admin/register - creates and return an admin > 201', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .post('/admin/register')
        .set("Authorization" , `Bearer ${token}`)
       .send({ email: 'josejosela1@gmail.com', password: 'password123'});
      
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['josejosela1@gmail.com']
        );

        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual(result.rows[0]);
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].role).toBe('admin');
    });
});

describe('POST /admin/register/employee' , () => {
    let testAdmin;

    beforeEach(async () => {
        testAdmin = await createTestUser({role: 'admin'})
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

        await pool.query(
            "DELETE FROM users WHERE email = $1",
            ['josejosela11@gmail.com']
        );
    })

    test('POST /admin/register/employee - creates and return an employee > 201', async () => {
        const token = await createTestToken(testAdmin)

        const response = await request(app)
        .post('/admin/register/employee')
        .set("Authorization" , `Bearer ${token}`)
        .send({ email: 'josejosela11@gmail.com', password: 'password123'});
      
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['josejosela11@gmail.com']
        );

        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual(result.rows[0]);
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].role).toBe('employee');
   
    });
});

describe('PATCH /admin/setUserStatus' , () => {
    let testAdmin;
    let testUser;
    let id;

    beforeEach(async () => {
        testAdmin = await createTestUser({role: 'admin'})
        testUser = await createTestUser()
         id = randomUUID()
    })

    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })

    test('PATCH /admin/setUserStatus - changes the user status > 200', async () => {
        const token =  createTestToken(testAdmin)

        const response = await request(app)
        .patch('/admin/setUserStatus')
        .set("Authorization" , `Bearer ${token}`)
        .send({user_id: testUser.id, status: 'banned', status_reason: 'Violation of terms (was beating an old lady)' });
      
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [testUser.id]
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'user status updated successfully'});
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].status).toBe('banned');
   
    });

     test('PATCH /admin/setUserStatus - no user > 404', async () => {
        const token = await createTestToken(testAdmin)

        const response = await request(app)
        .patch('/admin/setUserStatus')
        .set("Authorization" , `Bearer ${token}`)
        .send({ user_id: id, status: 'banned', status_reason: 'Violation of terms (was beating an old lady)' });

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ message: 'user doesnt exist'});
   
    });

     test('PATCH /admin/setUserStatus - invalid user_id > 400', async () => {
        const token = await createTestToken(testAdmin)

        const response = await request(app)
        .patch('/admin/setUserStatus')
        .set("Authorization" , `Bearer ${token}`)
        .send({ user_id: '1', status: 'banned', status_reason: 'Violation of terms (was beating an old lady)' });

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ error : 'Invalid UUID'});
   
    });

      test('PATCH /admin/setUserStatus - invalid status > 400', async () => {
        const token = await createTestToken(testAdmin)

        const response = await request(app)
        .patch('/admin/setUserStatus')
        .set("Authorization" , `Bearer ${token}`)
        .send({ user_id: testUser.id, status: 'eggs', status_reason: 'Violation of terms (was beating an old lady)' });

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({ error : 'Status must be either active , banned or inactive'});
   
    });
});

describe('PATCH /admin/Update' ,  () => {
    let testUser;
    let testAdmin;

    beforeEach( async () => {
      testUser = await createTestUser()
      testAdmin = await createTestUser({role : 'admin'})
    }) 
    
    afterEach(async() => {
        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );

         await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );
    })

    test('PATCH /auth/Update - it updates the user password > 200' , async () => {
        const token = createTestToken(testAdmin)
        const updated_password =  "updated password"
        const data = {email : testUser.email ,  new_password : updated_password }

        const response = await request(app)
        .patch('/admin/Update')
        .set("Authorization" , `Bearer ${token}`)
        .send(data);

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [testUser.email])

        const passwordMatches = await bcrypt.compare(
          updated_password,
          result.rows[0].password_hash
          );

        expect(response.statusCode).toBe(200)
        expect(response.body.status).toBe('success')
        expect(response.body.user.email).toBe(testUser.email)
        expect(passwordMatches).toBe(true);
        

    })

    test('PATCH /auth/Update - new and old passwords are the same > 400' , async () => {
        const token = createTestToken(testAdmin)
        const data = {email : testUser.email ,  new_password : "fake-password" }

        const response = await request(app)
        .patch('/admin/Update')
        .set("Authorization" , `Bearer ${token}`)
        .send(data);

        expect(response.statusCode).toBe(400)
        expect(response.body).toEqual({ message: 'cant change the same password'});

    })

        test('PATCH /auth/Update - no user > 400' , async () => {
        const token = createTestToken(testAdmin)
        const updated_password =  "updated password"
        const data = {email : 'noexisto@gmail.com' ,  new_password : updated_password }

        const response = await request(app)
        .patch('/admin/Update')
        .set("Authorization" , `Bearer ${token}`)
        .send(data);

        expect(response.statusCode).toBe(400)
        expect(response.body).toEqual({ message: 'User not found'});
        

    })
})


//pnpm test /autha.test.js