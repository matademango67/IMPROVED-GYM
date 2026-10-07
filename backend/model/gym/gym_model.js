import {pool} from "../../db/gym.js";
import { NotFoundError , ConflictError} from "../../middleware/errors/ErrorsIndex.js";

export class gym_model {
    static async getCustomer (user_id){
        const result = await pool.query(`SELECT * 
                                       FROM customers c
                                       WHERE c.user_id = $1`,[user_id]);
        const rows = result.rows;
        if(rows.length === 0){
            throw new NotFoundError("Customers not found")
        } 
             return rows;
    };

    static async getAllCustomers() {
        const result = await pool.query(`SELECT * FROM customers ORDER BY id`);
         const rows = result.rows;
        if(rows.length === 0){
            throw new NotFoundError("Customers not found")
        } else{
             return rows;
        }
    }

   static async SearchCustomer(search) {
    const result = await pool.query(
        `
        SELECT *
        FROM customers
        WHERE name ILIKE $1
           OR email ILIKE $1
        `,
        [`%${search}%`]
    );

    if(result.rowCount === 0){
       throw new NotFoundError("Customer not found")
    }
}

  static async createCustomer(user_id , input , email , client) {
    try {
      const { name, birth } = input;
    
      const result = await client.query(
        `
        INSERT INTO customers (name, birth, email, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING customers.id;
        `,
        [name, birth, email, user_id]
      );

      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
    if (error.constraint === "customers_user_id_key") {
        throw new ConflictError(
            "This user already has a customer profile"
        );
    }
    throw error;
}

    }
  }
  

 static async UpdateCustomer(user_id, input) {
    const { name, birth } = input;
    const result = await pool.query(
         `
    UPDATE customers
    SET name = $1,
        birth = $2
    WHERE user_id = $3
    `,
    [name, birth, user_id]
    );
   if (result.rowCount === 0) {
   throw new NotFoundError("Customer not found");
}
throw error
} }