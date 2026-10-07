import { paymentsModel } from "../../model/gym/payment_model.js"

 export class paymentController{

  static async get_mypayments(req,res){
        const user_id = req.user.id;
       const result = await paymentsModel.get_mypayments(user_id)
     return res.status(200).json(result);
    }


 static async get_allpayments(req,res){
        const result = await paymentsModel.get_allpayments()
        return res.status(200).json(result);
    }


 static async create_payment(req,res){
    const user_id = req.user.id;
    const newpayment = await paymentsModel.create_payment(user_id)
    return res.status(201).json(newpayment);
 }
 }