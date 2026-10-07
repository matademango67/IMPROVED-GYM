import { Membership_model } from "../../model/gym/membership_model.js";

export class gym_membership {
    static async get_memberships(req,res){
          const memberships = await Membership_model.get_memberships()
          res.status(200).json(memberships)   
    }


    static async search_memberships(req,res){
        const user_id = req.user.id;
        const membership = await Membership_model.search_membership(user_id)
            if(membership.length > 0){
               res.status(200).json(membership)
            }     
    }

    static async create_membership (req,res){
        const user_id = req.user.id;
        const input = req.body;
        const newMembership = await Membership_model.create_membership(input, user_id);
        res.status(201).json(newMembership);
}


 static async changeStatus_membership (req,res){
 const user_id =   req.params.id ?? req.body?.user_id ?? req.user.id
 const result = await Membership_model.changeStatus_membership(user_id);
  res.status(200).json(result);

 }

 static async changeType_membership(req,res){
   const user_id = req.body.user_id
    const result = await Membership_model.changeType_membership(user_id)
    res.status(200).json(result)
 }}
