import { gym_model } from "../../model/gym/gym_model.js";

export class gym_controller {
    static async getCustomer (req,res){
        const user_id = req.user.id
            const customers = await gym_model.getCustomer(user_id);
           return  res.status(200).json(customers);  
    }

    static async getAllCustomers (req,res){
        const customers = await gym_model.getAllCustomers();
        return  res.status(200).json(customers);    
    }

    static async SearchCustomer (req,res){
        const { search } = req.params;
        const customer = await gym_model.SearchCustomer(search);
        return res.status(200).json(customer);
    }
    static async createCustomer (req,res){
        const user_id = req.user.id
        const input = req.body
        const newCustomer = await gym_model.createCustomer(user_id,input);
        return res.status(201).json(newCustomer);       
} 
    static async UpdateCustomer (req,res){
        const user_id = req.user.id
        const input = req.body;
         await gym_model.UpdateCustomer(user_id,input);
        return  res.status(200).json({ message: "Customer updated successfully" });
}}

