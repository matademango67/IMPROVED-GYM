import {test, expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken , testAdminAuthorization} from "../../helpers/auth_helper.js"
import { createTestUser , createTestCustomer , createTestMembership } from "../../helpers/db_helper.js";

describe('GET /admin/memberships - Authorization' ,  () => {
    testAdminAuthorization('get','/admin/memberships')
})

describe('PATCH /admin/memberships/type - Authorization' ,  () => {
    testAdminAuthorization('patch','/admin/memberships/type')
})

describe('PATCH /admin/memberships/status - Authorization' ,  () => {
    testAdminAuthorization('patch','/admin/memberships/status')
})

describe('GET /admin/memberships' , () => {
    let testAdmin;
    let testUser;
    let testCustomer;
    let testMembership;

    beforeEach(async () => {
        testAdmin = await createTestUser({role: 'admin'})
        testUser = await createTestUser()
        testCustomer = await createTestCustomer(testUser)
        testMembership = await createTestMembership(testCustomer)
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

    test('GET /admin/memberships - it should return all memberships > 200', async () => {
        const token = await createTestToken(testAdmin)

        const response = await request(app)
            .get('/admin/memberships')
            .set("Authorization" , `Bearer ${token}`)
            
        expect(response.statusCode).toBe(200);
       
    });
})

describe('PATCH /admin/memberships/type' ,  () => {
let testAdmin;
let testUser;
let testCustomer;
let testMembership;

    beforeEach(async () => {
       testAdmin = await createTestUser({role : 'admin'})
       testUser = await createTestUser()
       testCustomer = await createTestCustomer(testUser)
       testMembership = await createTestMembership(testCustomer)
    });

    afterEach(async () => {
          await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })

   test('change memberships type > 200' , async () => {
    const token = await createTestToken(testAdmin)

    const response = await request(app)
    .patch('/admin/memberships/type')
    .set("Authorization" , `Bearer ${token}`)
    .send({ user_id : testUser.id});

    const result = await pool.query(`
        SELECT * 
        FROM memberships
        WHERE id = $1 ` , [testMembership.id])

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual("membership's type changed successfully")
    expect(result.rows[0].type).toEqual('vip');
    
})

  describe('invalid status > cant change memberships type' , () => {
        let testAdmin;
        let testUser;
        let testCustomer;
        let testMembership;

         beforeEach(async () => {
       testAdmin = await createTestUser({role : 'admin'})
       testUser = await createTestUser()
       testCustomer = await createTestCustomer(testUser)

        const MembershipResult = await pool.query(`INSERT INTO memberships (
        type,
        cost,
        customer_id,
        status
        )
        VALUES ($1 , $2 , $3 , $4)
        RETURNING *`, [
            "normal",
            "1500",
            testCustomer.id,
            "banned"
        ]);

        testMembership = MembershipResult.rows[0]
             });

       afterEach(async () => {
          await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

         await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })  

    test('cant chnage membership > 400' , async () => {
        const token = await createTestToken(testAdmin)

       const response = await request(app)
    .patch('/admin/memberships/type')
    .set("Authorization" , `Bearer ${token}`)
    .send({ user_id : testUser.id});

    const result = await pool.query(`
        SELECT * 
        FROM memberships
        WHERE id = $1 ` , [testMembership.id])

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({ message: "You can't change your membership's type due to your current status"})
    expect(result.rows[0].type).toEqual("normal")
   })
});

  describe('no membership' , () => {
        let testAdmin;
        let testUser;
        let testCustomer;

         beforeEach(async () => {
       testAdmin = await createTestUser({role : 'admin'})
       testUser = await createTestUser()
       testCustomer = await createTestCustomer(testUser)
             });

       afterEach(async () => {
          await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

         await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })  

    test('no membership > 404' , async () => {
            const token = await createTestToken(testAdmin)

       const response = await request(app)
    .patch('/admin/memberships/type')
    .set("Authorization" , `Bearer ${token}`)
    .send({ user_id : testUser.id});

    expect(response.statusCode).toBe(404)
    expect(response.body).toEqual({ message: "Membership not found"})
   })
});

})


describe('PATCH /admin/memberships/status' ,  () => {
let testAdmin;
let testUser;
let testCustomer;
let testMembership;

    beforeEach(async () => {
       testAdmin = await createTestUser({role : 'admin'})
       testUser = await createTestUser()
       testCustomer = await createTestCustomer(testUser)
       testMembership = await createTestMembership(testCustomer)
    });

    afterEach(async () => {
          await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );
         await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })

   test('change memberships status > 200' , async () => {
    const token = await createTestToken(testAdmin)

    const response = await request(app)
    .patch('/admin/memberships/status')
    .set("Authorization" , `Bearer ${token}`)
    .send({ user_id : testUser.id});

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({ message: "Membership's status changed successfully"})
   });


    describe('no membership' , () => {
        let testAdmin;
        let testUser;
        let testCustomer;

         beforeEach(async () => {
       testAdmin = await createTestUser({role : 'admin'})
       testUser = await createTestUser()
       testCustomer = await createTestCustomer(testUser)
             });

       afterEach(async () => {
          await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

         await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })  

    test('no membership > 404' , async () => {
            const token = await createTestToken(testAdmin)

       const response = await request(app)
    .patch('/admin/memberships/status')
    .set("Authorization" , `Bearer ${token}`)
    .send({ user_id : testUser.id});

    expect(response.statusCode).toBe(404)
    expect(response.body).toEqual({ message: "Membership not found"})
   })
});
  
    describe('invalid current membership status' , () => {
        let testAdmin;
        let testUser;
        let testCustomer;

         beforeEach(async () => {
       testAdmin = await createTestUser({role : 'admin'})
       testUser = await createTestUser()
       testCustomer = await createTestCustomer(testUser)

        const membershipResult = await pool.query(`INSERT INTO memberships (
        type,
        cost,
        customer_id,
        status
        )
        VALUES ($1 , $2 , $3 , $4)
        RETURNING *`, [
            "normal",
            "1500",
            testCustomer.id,
            'expired'
        ]);
    });

      afterEach(async () => {
          await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testAdmin.id]
        );

         await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })

    test('cant change status > 400' , async () => {
         const token =  createTestToken(testAdmin)

       const response = await request(app)
    .patch('/admin/memberships/status')
    .set("Authorization" , `Bearer ${token}`)
    .send({ user_id : testUser.id});

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({ message: "You can't change your membership's status due to your current membership status"})
   })
    });

})


//pnpm test /membershipa.test.js