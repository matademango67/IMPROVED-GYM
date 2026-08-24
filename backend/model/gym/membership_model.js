 import {pool} from "../../db/gym.js";

export class Membership_model {
    static async get_memberships(){ 
        const result = await pool.query(`
            SELECT 
                m.id,
                m.type,
                m.status,
                m.cost,
                m.customer_id,
                c.user_id,
                u.email,
                m.start as start_date,
                m.expire as end_date
            FROM memberships m
            JOIN customers c ON c.id = m.customer_id
            JOIN users u ON u.id = c.user_id
        `);
        const rows = result.rows;
        if(rows.length === 0){
            throw new Error("error")
        } else{
             return rows;
        }
    }

    static async search_membership(user_id){
         const result = await pool.query(
    `
    SELECT 
        m.id,
        m.type,
        m.status,
        m.cost,
        m.customer_id,
        c.user_id,
        u.email,
        m.start as start_date,
        m.expire as end_date
    FROM memberships m
    JOIN customers c
      ON c.id = m.customer_id
    JOIN users u ON u.id = c.user_id
    WHERE c.user_id = $1
    `,
    [user_id]
);

if(result.rowCount === 0){
   const error = new Error("Membership not found");
    error.statusCode = 404;
    throw error;
}

return result.rows;

    }
   
    static async create_membership(input , user_id){
         const { type } = input
         const customerResult = await pool.query(
 `SELECT id  from customers where user_id = $1` ,
  [user_id]); 
                               
 if (customerResult.rowCount === 0) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
}

  const customer_id = customerResult.rows[0].id;

  const query = `
        INSERT INTO memberships (cost , customer_id , type)
        VALUES (
            CASE
                WHEN $1 = 'normal' THEN 1500
                WHEN $1 = 'vip' THEN 3000
            END,
            $2,
            $1
        )
        RETURNING *;
    `;
try {
  
    const result = await pool.query(query, [type, customer_id]);

    return result.rows[0]|| null;

}catch (error) {

   if (error.code === "23505") {
        const newError = new Error(
            "Account already has a membership"
        );

        newError.statusCode = 409;

        throw newError;
    }

    throw error;
} }

  static async changeStatus_membership(user_id){
  const customerResult = await pool.query(
    `SELECT id FROM customers WHERE user_id = $1`,
    [user_id]
  );

  if (customerResult.rowCount === 0) {
    throw new Error("Customer not found");
  }

  const customerId = customerResult.rows[0].id;

  const membershipResult = await pool.query(
    `SELECT status FROM memberships WHERE customer_id = $1`,
    [customerId]
  );

  if (membershipResult.rowCount === 0) {
    throw new Error("Membership not found");
  }

  const status = membershipResult.rows[0].status;

  if (status !== 'active' && status !== 'paused') {
    throw new Error("You can't change your membership's status due to your current membership status");
  }

  const result = await pool.query(
  `UPDATE memberships
SET status =
  CASE
    WHEN status = 'paused' THEN 'active'
    WHEN status = 'active' THEN 'paused'
  END
WHERE customer_id = $1`,
  [customerId]
);

  if (result.rowCount === 0) {
    throw new Error("Membership's status could not be changed");
  }

  return { message: "Membership's status changed successfully" };
}


  static async changeType_membership(user_id){
       const membershipResult = await pool.query(`SELECT memberships.status
         from memberships
         JOIN customers on
         customers.id = memberships.customer_id
         where customers.user_id = $1`, 
         [user_id])

       if (membershipResult.rowCount === 0) {
    throw new Error("Membership not found");
  }

  const status = membershipResult.rows[0].status;

        if (status !== 'active') {
    throw new Error("You can't change your membership's type due to your current status");
  }
      await pool.query(
        `UPDATE memberships m
        SET 
        type = CASE
    WHEN m.type = 'vip' THEN 'normal'
    WHEN m.type = 'normal' THEN 'vip'
  END,
   cost = CASE
        WHEN m.type = 'normal' THEN 3000
        WHEN m.type = 'vip' THEN 1500
    END
  from customers c
 WHERE c.id = m.customer_id
 AND c.user_id = $1
 RETURNING *;`, [user_id]
      )

      const result = "membership's type changed successfully"

      return(result)
 }

}

//sil