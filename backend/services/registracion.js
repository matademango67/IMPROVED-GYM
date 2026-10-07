import { pool } from "../db/gym";
import { auth_model } from "../model/auth_model";
import { gym_model } from "../model/gym/gym_model";
import { Membership_model } from "../model/gym/membership_model";
import { paymentsModel } from "../model/gym/payment_model";

export async function RegisterCustomerService(data) {
    const {
        email,
        hashedPassword,
        role,
        name,
        birth,
        type
    } = data;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const user = await auth_model.registerUser(
            email,
            hashedPassword,
            role,
            client
        );

        const customer = await gym_model.createCustomer(
            user.id,
            { name, birth },
            email,
            client
        );

        const membership = await Membership_model.create_membership(
            { type },
            customer.id,
            client
        );

        const payment = await paymentsModel.create_payment(
            membership,
            client
        );

        await client.query("COMMIT");

        return {
            user,
            customer,
            membership,
            payment
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}