import { Membership_model } from "../../model/gym/membership_model.js";

export class gym_membership {
    static async get_memberships(req,res){
        try{
          const memberships = await Membership_model.get_memberships()
          res.status(200).json(memberships)
        } catch (error){
            return res.status(500).json({ error : error.message})
        }      
    }
    static async search_memberships(req,res){
        const user_id = req.user.id;
        try{
            const membership = await Membership_model.search_membership(user_id)
            if(membership.length > 0){
               res.status(200).json(membership)
            }     
        } catch (error){
            if(error.statusCode === 404){
                return res.status(404).json({ error : error.message})
            }
            return res.status(500).json({error: error.message})
        } 
    }
    static async create_membership (req,res){
        const user_id = req.user.id;
        const input = req.body;
        try {
            const newMembership = await Membership_model.create_membership(input, user_id);
            res.status(201).json(newMembership);
        } catch (error) {

    if (error.statusCode === 404 || error.statusCode === 409) {
    return res.status(error.statusCode).json({
        error: error.message
    });
}
    return res.status(500).json({
        error: error.message
    });
    }
}


 static async changeStatus_membership (req,res){
 const user_id =   req.params.id ?? req.body?.user_id ?? req.user.id

try {
  const result = await Membership_model.changeStatus_membership(user_id);
  res.status(200).json(result);
} catch (error) {

  if (error.message === "Customer not found" || error.message === "Membership not found") {
    return res.status(404).json({ message: error.message });
  }

  if (error.message.includes("can't change")) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Something went wrong changing the membership's status" });
}
 }

 static async changeType_membership(req,res){
   const user_id = req.body.user_id

   try {

    const result = await Membership_model.changeType_membership(user_id)
    res.status(200).json(result)

   } catch (error){
     if (error.message === "Membership not found") {
    return res.status(404).json({ message: error.message });
  }

  if (error.message === "You can't change your membership's type due to your current status") {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({
        error: error.message
    })
}
 }}
