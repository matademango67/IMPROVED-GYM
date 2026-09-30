import { jest, describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { gym_membership } from '../../../controller/gym/membership_controller.js';
import * as gymModelModule from '../../../model/gym/membership_model.js'
import { afterEach } from '@jest/globals';

describe("POST / - create_membership", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "5c5f-448f-ad78-cc82ffab6a8810" },
      body: {
          type: "vip"
      },
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

 afterEach(() => {
    jest.restoreAllMocks();
});

  test("should create a membership successfully", async () => {
    const mockCustomer = {
      type: "vip"
    };

    const spy = jest
      .spyOn(gymModelModule.Membership_model, "create_membership")
      .mockResolvedValue(mockCustomer);

    await  gym_membership.create_membership(req, res);

    expect(spy).toHaveBeenCalledTimes(1)

    expect(spy).toHaveBeenCalledWith( {
      type: "vip" } , "5c5f-448f-ad78-cc82ffab6a8810"
   );

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith(mockCustomer);

  });

   test("should return 409 when customer already has an account", async () => {
   const error = new Error ("Account already has a membership") 
    error.statusCode = 409;

    const spy = jest
      .spyOn(gymModelModule.Membership_model, "create_membership")
      .mockRejectedValue(error);

    await gym_membership.create_membership(req, res);

     expect(spy).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      error: "Account already has a membership",
    });

  });

  test("should return 500 when membership creation fails", async () => {
    const error = new Error("Failed to create a membership");

    const spy = jest
      .spyOn(gymModelModule.Membership_model, "create_membership")
      .mockRejectedValue(error);

    await gym_membership.create_membership(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to create a membership",
    });

  });
});

describe("GET / - get_memberships" , () => {
  let res;

  beforeEach(() => {
      req = {
      id : 1
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });
  afterEach(() => {
    jest.restoreAllMocks();
});

  test("it should get all the membership and return 200" , async () => {
    const mockmembership = [
       { id: "26457d53-d34c-4750-bd30-102299204078",
        customer_id: "ba5e434e-0ed6-45dd-ac92-3dfb39234e43",
        status: "active" },
      { id: "26457d53-d34c-4750-bd30-102299204078",
        customer_id: "ba5e434e-0ed6-45dd-ac92-3dfb39234e43",
        status: "active" }];

      const spy = jest.spyOn(gymModelModule.Membership_model, 'get_memberships')
      .mockResolvedValue(mockmembership)

      await gym_membership.get_memberships(req,res);

      expect(spy).toHaveBeenCalledTimes(1)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockmembership)

      spy.mockRestore();
  });

  test("should return 500 error when database query fails", async () => {
    const error = new Error("Database error");
    const spy = jest.spyOn(gymModelModule.Membership_model, 'get_memberships').mockRejectedValue(error);

    await gym_membership.get_memberships(req,res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    
    
  });
  
})

describe("GET /:customer_id - search_memberships", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "26457d53-d34c-4750-bd30-102299204078" },
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
});

  test("should return matching Membership when found", async () => {
    const mockmembership = [
      { id: "26457d53-d34c-4750-bd30-102299204078",
        customer_id: "ba5e434e-0ed6-45dd-ac92-3dfb39234e43",
        type: "normal",
        expire: "2026-11-15T04:00:00.000Z",
        start: "2026-01-15T04:00:00.000Z",
        cost: "1500.00",
        status: "active" },
    ];

    const spy = jest.spyOn(gymModelModule.Membership_model, 'search_membership').mockResolvedValue(mockmembership);

    await gym_membership.search_memberships(req, res);

    expect(spy).toHaveBeenCalledWith("26457d53-d34c-4750-bd30-102299204078");
    expect(res.json).toHaveBeenCalledWith(mockmembership);
    
  });

  test("should return 404 when Membership not found", async () => {
    const error = new Error("Membership not found");
    error.statusCode = 404;

     const spy = jest.spyOn(gymModelModule.Membership_model, 'search_membership').mockRejectedValue(error);

    await gym_membership.search_memberships(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Membership not found" });
    

  });

  test("should return 500 error when database query fails", async () => {
    const error = new Error("Database error");
    const spy = jest.spyOn(gymModelModule.Membership_model, 'search_membership').mockRejectedValue(error);

    await gym_membership.search_memberships(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    
  });
});

describe("PATCH / - changeStatus_membership", () => {
    afterEach(() => {
    jest.restoreAllMocks();
});

    let req ,res;

    beforeEach(() => {
        req = {
            params :{
               id : '1'
            }
            
        };

        res = {
            json : jest.fn().mockReturnThis(),
            status : jest.fn().mockReturnThis(),
        };  
    })
    test("should change the current status of the membership" , async () => {
                 const mockMembership = {
    id: "2",
    status: "active",
    expire: "2026-08-01"
};
          const spy = jest
          .spyOn(gymModelModule.Membership_model , "changeStatus_membership")
          .mockResolvedValue(mockMembership);

          await gym_membership.changeStatus_membership(req,res)

          expect(spy).toHaveBeenCalledWith("1");

          expect(spy).toHaveBeenCalledTimes(1);

          expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith(mockMembership);

    })

    test("should return 404 when the membership does not exist" ,async () => {
      const spy = jest
      .spyOn(gymModelModule.Membership_model , "changeStatus_membership")
      .mockRejectedValue(Error("Membership not found"));

      await gym_membership.changeStatus_membership(req,res)

    expect(spy).toHaveBeenCalledTimes(1);
expect(res.status).toHaveBeenCalledWith(404);
expect(res.json).toHaveBeenCalledWith({
    message: "Membership not found"
});

    })

 test("should return 400 when the membership cannot change status" ,async () => {
        const spy = jest
        .spyOn(gymModelModule.Membership_model , "changeStatus_membership")
        .mockRejectedValue(Error("You can't change your membership's status due to your current status"))

        await gym_membership.changeStatus_membership(req,res)

        expect(spy).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(400)

})

    test("should return 500 when an unexpected error occurs" ,async () => {
        const spy = jest
        .spyOn(gymModelModule.Membership_model , "changeStatus_membership")
        .mockRejectedValue(Error("unexpected error"))

        await gym_membership.changeStatus_membership(req,res)

        expect(spy).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500)
})
});

describe("PATCH / - changeType_membership", () => {

   let req ,res;

    beforeEach(() => {
        req = {
            body :{
               user_id : '1'
            }
            
        };

        res = {
            json : jest.fn().mockReturnThis(),
            status : jest.fn().mockReturnThis()};  
})

  test("should change the type of a membership and return 200" ,async () => {
    const mockMembership = {
       id: "2",
    status: "active",
    type: "normal",
    expire: "2026-08-01"
    };

    const spy = jest
    .spyOn(gymModelModule.Membership_model , "changeType_membership")
    .mockResolvedValue(mockMembership)

    await gym_membership.changeType_membership(req,res)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('1')

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockMembership)

    spy.mockRestore();
  } );

   test("should return 500 when an unexpected error occurs" ,async () => {
        const spy = jest
        .spyOn(gymModelModule.Membership_model , "changeType_membership")
        .mockRejectedValue(Error("unexpected error"))

        await gym_membership.changeType_membership(req,res)

        expect(spy).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500)

        spy.mockRestore()
})
})


//pnpm test /membership.controller.test.js