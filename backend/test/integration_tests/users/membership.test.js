import {test, expect, describe , beforeEach, afterEach } from "@jest/globals";

import request from 'supertest';
import {pool} from '../../../db/gym.js';

import app from '../../../app.js';
import {createTestToken} from "../../helpers/auth_helper.js"
import { createTestUser , createTestCustomer , createTestMembership } from "../../helpers/db_helper.js";
import {randomUUID} from 'node:crypto'

describe("authorization" , () => {
           test('Get membership/me - no token > 401' , async () => {
       const response = await request(app)
       .get('/membership/me');

       expect(response.statusCode).toBe(401)
       expect(response.body).toEqual({
            message: "Access token required"
        });
    });

    test('Get membership/me - invalid token > 401' , async () => {
       const response = await request(app)
       .get('/membership/me')
       .set("Authorization", "Bearer invalid-token")

       expect(response.statusCode).toBe(401)
       expect(response.body).toEqual({
            message: "Invalid access token"
        });
    });
    });

describe('GET /membership/me' , () => {

   describe("with membership" , () => {
         let testUser;
    let testCustomer;
    let testMembership;

   beforeEach(async () => {

    testUser = await createTestUser()

   testCustomer = await createTestCustomer(testUser)

   testMembership = await createTestMembership(testCustomer)
}); 

afterEach(async () => {

    await pool.query(
        "DELETE FROM users WHERE id = $1",
        [testUser.id]
    );

});
 
    test('Get membership/me - found membership > 200' , async () => {
        const token = await createTestToken(testUser)

            const response = await request(app)
                .get("/membership/me")
                .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200)
               
        expect(response.body).toEqual(
           expect.arrayContaining([
            expect.objectContaining({
                customer_id: testCustomer.id,
                user_id: testUser.id,
                type: "normal",
                status: "active",
                cost: "1500.00",
                email: testUser.email
            })
        ])
    );
    })
   });

   describe("with no membership" , () => {
        let testUser;

        beforeEach(async () => {

         testUser = await createTestUser()

        });


        afterEach(async () => {

            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [testUser.id]
            );

        });

        test("no membership > 404" , async () => {
           const token = await createTestToken(testUser)
      
         const response = await request(app)
          .get("/membership/me")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(404);

            expect(response.body).toEqual({
                message: "Membership not found"
            });

        })
   })
 
})

describe('POST /membership/' , () => {
     let testUser;
    let testCustomer;

    beforeEach(async () => {

     testUser = await createTestUser()
     testCustomer = await createTestCustomer(testUser)

    });


    afterEach(async () => {

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );

    });

    test('POST /membership create a membership > 201' , async () =>{
       const token = await createTestToken(testUser)

       const membershipData = {
           type : "normal"
       }

       const response = await request(app)
       .post('/membership/')
       .set("Authorization" , `Bearer ${token}`)
       .send(membershipData)

        expect(response.statusCode).toBe(201);

        const result = await pool.query(`
            SELECT *
            FROM memberships
            WHERE customer_id = $1
        `, [testCustomer.id]);

        expect(result.rows).toHaveLength(1);

        expect(result.rows[0]).toEqual(
            expect.objectContaining({
                customer_id: testCustomer.id,
                type: "normal"
            })
        )

        expect(result.rows[0].cost).toBe("1500.00");
    });

    test("POST /membership - invalid type > 400", async () => {

 const token = await createTestToken(testUser)

    const response = await request(app)
        .post("/membership/")
        .set("Authorization", `Bearer ${token}`)
        .send({
            type: "premium"
        });

    expect(response.statusCode).toBe(400);

     expect(response.body).toEqual({
    message: "Invalid option: expected one of \"normal\"|\"vip\"",
});
     });

    test("POST /membership - missing type > 400", async () => {

   const token = await createTestToken(testUser)

    const response = await request(app)
        .post("/membership/")
        .set("Authorization", `Bearer ${token}`)
        .send({});

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
    message: "Invalid option: expected one of \"normal\"|\"vip\"",
});
     });

    test("POST /membership - existing membership > 409", async () => {

    const token = await createTestToken(testUser)

    const firstResponse = await request(app)
        .post("/membership/")
        .set("Authorization", `Bearer ${token}`)
        .send({
            type: "normal"
        });

    expect(firstResponse.statusCode).toBe(201);
 
    const secondResponse = await request(app)
        .post("/membership/")
        .set("Authorization", `Bearer ${token}`)
        .send({
            type: "vip"
        });

    expect(secondResponse.statusCode).toBe(409);

    expect(secondResponse.body).toEqual({
        error: "Account already has a membership"
    });

     });

     describe('no customer' , () => {
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
            `membership-post-${randomUUID()}@test.com`,
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

    test("POST /membership - no customer > 404", async () => {

  const token = await createTestToken(testUser)

    const response = await request(app)
    .post('/membership/')
    .set("Authorization", `Bearer ${token}`)
        .send({
            type: "normal"
        });

    expect(response.statusCode).toBe(404)

     expect(response.body).toEqual({
    error: "Customer not found",
});
     })

})
})

describe('PATCH /membership/status' , () => {

    let testUser;
    let testCustomer;
    let testMembership;

    beforeEach(async () => {
        testUser = await createTestUser()
        testCustomer = await createTestCustomer(testUser)
        testMembership = await createTestMembership(testCustomer)
    });

    afterEach(async () => {

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );

    });

    test('patch /membership/status - change the membership status from active to paused> 200' , async () => {
     const token = createTestToken(testUser)

         const response = await request(app)
         .patch('/membership/status')
         .set("Authorization" , `Bearer ${token}`)

         expect(response.statusCode).toBe(200)
         expect(response.body).toEqual({
            message: "Membership's status changed successfully"
         })

         const result = await pool.query(`
            SELECT status
            FROM memberships
            WHERE customer_id = $1
        `, [testCustomer.id]);

        expect(result.rows[0].status).toBe("paused");
    })

    test('PATCH /membership/status - paused membership becomes active > 200',async () => {

        await pool.query(`
            UPDATE memberships
            SET status = 'paused'
            WHERE id = $1
        `, [testMembership.id]);

        const token = createTestToken(testUser);

        const response = await request(app)
            .patch('/membership/status')
            .set("Authorization", `Bearer ${token}`)

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            message: "Membership's status changed successfully"
        });

        const result = await pool.query(`
            SELECT status
            FROM memberships
            WHERE id = $1
        `, [testMembership.id]);

        expect(result.rows[0].status).toBe("active");
    }
);

    describe('no membership' , () => {
        let testUser;
        let testCustomer;
    
        beforeEach(async () => {
        testUser = await createTestUser()
        testCustomer = await createTestCustomer(testUser)
    });

    afterEach(async () => {

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );

    });

     test('patch /membership/status - membership not found > 404' , async () => {
           const token = createTestToken(testUser)

           const response = await request(app)
           .patch('/membership/status')
           .set('authorization' , `Bearer ${token}`)

           expect(response.statusCode).toBe(404)
           expect(response.body).toEqual({
                message: "Membership not found"
            })
        })
    })

    describe('cant change status' , () => {
            let testUser;
        let testCustomer;
    
        beforeEach(async () => {
        testUser = await createTestUser()
        testCustomer = await createTestCustomer(testUser)

         await pool.query(`INSERT INTO memberships (
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
    });

    afterEach(async () => {

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [testUser.id]
        );
    })

     test('Patch /membership/status - banned membership > 400' , async () => {
        const token = createTestToken(testUser)

        const response = await request(app)
        .patch('/membership/status')
        .set("Authorization" , `Bearer ${token}`)

         expect(response.statusCode).toBe(400)
         expect(response.body).toEqual({
            message: "You can't change your membership's status due to your current membership status"
         });
     
     }) 
    })
})


//pnpm test /membership.test.js