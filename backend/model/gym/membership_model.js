 import {pool} from "../../db/gym.js";
 import { NotFoundError , ConflictError , ValidationError} from "../../middleware/errors/ErrorsIndex.js";

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
        
        if(result.rows.length === 0){
          throw new NotFoundError("Customers not found")
        } 
             return result.rows; 
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
  throw new NotFoundError("Membership not found");
}

return result.rows;
}
   
    static async create_membership(input , customer_id , client){
         const { type } = input

  const query = `
        INSERT INTO memberships (customer_id , type , cost)
        VALUES (
         $1
         $2,
            CASE
                WHEN $2 = 'normal' THEN 1500
                WHEN $2 = 'vip' THEN 3000
            END,
           
        )
        RETURNING *`;
try {
  
    const result = await client.query(query, [customer_id , type]);

    return result.rows[0]

}catch (error) {

   if (
    error.code === "23505" &&
    error.constraint === "memberships_customer_id_key"
) {
    throw new ConflictError(
        "Account already has a membership"
    );
}

throw error;

} }

  static async changeStatus_membership(user_id){   // i have to remember to pass the customerId
  
  const customerResult = await pool.query(`
    SELECT customer_id
    FROM customers c
    WHERE user_id = $1` , 
    [user_id]
  )  

   if (customerResult.rowCount === 0) {
    throw new NotFoundError("customer not found");
  }

  const customerId = customerResult.rows[0].id;

  const membershipResult = await pool.query(
    `SELECT status FROM memberships WHERE customer_id = $1`,
    [customerId]
  );

  if (membershipResult.rowCount === 0) {
    throw new NotFoundError("Membership not found");
  }

  const status = membershipResult.rows[0].status;

  if (status !== 'active' && status !== 'paused') {
    throw new ValidationError("You can't change your membership's status due to your current membership status");
  }

   await pool.query(
  `UPDATE memberships
SET status =
  CASE
    WHEN status = 'paused' THEN 'active'
    WHEN status = 'active' THEN 'paused'
  END
WHERE customer_id = $1
  RETURNING status`,
  [customerId]
);

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
    throw new NotFoundError("Membership not found");
  }

  const status = membershipResult.rows[0].status;

        if (status !== 'active') {
    throw new ValidationError("You can't change your membership's type due to your current status");
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
 RETURNING m.type;`, [user_id]
      )
      return("membership's type changed successfully")
 }

}

//sil