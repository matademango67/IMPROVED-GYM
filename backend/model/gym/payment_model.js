import {pool} from "../../db/gym.js";

export class paymentsModel{
    static async get_mypayments(user_id){
        const result = await pool.query(`
            SELECT p.* 
            FROM payments p
            JOIN memberships m on m.id = p.memberships_id
            JOIN customers c on c.id = m.customer_id
            WHERE c.user_id =$1`, [user_id])
            return result.rows;
    }

    static async get_allpayments(){
            const result = await pool.query(`
            SELECT p.*, u.email as customer_email, c.user_id
            FROM payments p
            JOIN memberships m on m.id = p.memberships_id
            JOIN customers c on c.id = m.customer_id
            JOIN users u on u.id = c.user_id`)
            return result.rows;   
    }

    static async create_payment(membership , client ){
        const amount = membership.type === 'vip'
            ? 3000 // ? means if
            : 1500; // : means else

        const result = await client.query(
            `
            INSERT INTO payments (
                memberships_id, amount
            )
            VALUES ($1, $2)
            RETURNING *;
            `,
            [membership.id, amount]
        );
   
       await client.query( `
       UPDATE memberships
SET 
expire = CASE
        WHEN expire < CURRENT_DATE
        THEN CURRENT_DATE + INTERVAL '1 month'
        ELSE expire + INTERVAL '1 month'
    END ,
   status = CASE
    WHEN expire < CURRENT_DATE
    THEN 'active'
    ELSE status
END
WHERE id = $1;`,[membership.id]
        )

        return result.rows[0];
  }
}
