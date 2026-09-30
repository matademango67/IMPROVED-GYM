import { pool } from "../db/gym";
//import { auth_model } from "../model/auth_model";
import { gym_model } from "../model/gym/gym_model";
import { Membership_model } from "../model/gym/membership_model";
import { paymentsModel } from "../model/gym/payment_model";
export async function RegisterCustomerService(data){
    const client = await pool.connect()
   try{
    await client.query("BEGIN")
   // await auth_controller.registerUser()

    await gym_model.createCustomer(client , data)   
    await Membership_model.createCustomer(client , data)
    await paymentsModel.createCustomer(client , data)

    await client.query("COMMIT")
   } catch (error){
    await client.query("ROLLBACK")
    throw error
   } finally {
    client.release()
   }
}