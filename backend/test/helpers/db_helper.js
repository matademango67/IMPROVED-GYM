import { randomUUID } from "node:crypto";
import { pool } from "../../db/gym.js";
import bcrypt from "bcrypt";

const saltrounds = Number(process.env.SALT_ROUNDS.trim())

export async function createTestUser(overrides = {}) {
    const password = await bcrypt.hash('fake-password', saltrounds);
    const userResult = await pool.query(`
        INSERT INTO users (
            role,
            email,
            password_hash
        )
        VALUES ($1, $2, $3)
        RETURNING *
    `, [
        overrides.role ?? "customer",
        overrides.email ?? `${randomUUID()}@test.com`,
        overrides.password_hash ?? password
    ]);

    return userResult.rows[0];
}

export async function createTestCustomer(user) {
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
        `${randomUUID()}@test.com`,
        user.id
    ]);

    return customerResult.rows[0];
}

export async function createTestMembership(testCustomer){
       const membershipResult = await pool.query(`INSERT INTO memberships (
        type,
        cost,
        customer_id
        )
        VALUES ($1 , $2 , $3)
        RETURNING *`, [
            "normal",
            "1500",
            testCustomer.id
        ]);

       return membershipResult.rows[0];
}

export async function createTestPayment(testmembership){
     const paymentResult = await pool.query(`INSERT INTO PAYMENTS (
                 memberships_id,
                  amount)
                  VALUES ($1 , $2)
                  RETURNING *` ,
                [testmembership.id , 1500])

    return paymentResult.rows[0]
    
}
