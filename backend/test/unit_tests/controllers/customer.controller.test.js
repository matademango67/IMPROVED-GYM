import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { gym_controller } from "../../../controller/gym/gym_controller.js";
import * as gymModelModule from "../../../model/gym/gym_model.js";

describe("GET / - getCustomer", () => {
  let req, res;

  beforeEach(() => {
    req = {user : { id:  "cb40b343-1c63-4e3c-baeb-e3ce225d3c21"}};
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test("should return the current customer when successful", async () => {
    const mockCustomer = [
      { id: 1, name: "John", birth: "1990-01-01", email: "john@email.com"}
    ];
    const spy = jest.spyOn(gymModelModule.gym_model, 'getCustomer').mockResolvedValue(mockCustomer);

    await gym_controller.getCustomer(req, res);

    expect(spy).toHaveBeenCalledWith("cb40b343-1c63-4e3c-baeb-e3ce225d3c21");
    expect(spy).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith(mockCustomer);
    expect(res.status).toHaveBeenCalledWith(200);
    spy.mockRestore();
  });

  test("should return 500 error when database query fails", async () => {
    const error = new Error("Database error");
    const spy = jest.spyOn(gymModelModule.gym_model, 'getCustomer').mockRejectedValue(error);

    await gym_controller.getCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    
    spy.mockRestore();
  });
});

describe("GET / - getAllCustomer", () => {
  let req, res;

  beforeEach(() => {
    req = {user : { id:  "cb40b343-1c63-4e3c-baeb-e3ce225d3c21"}};
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test("should return all customers  when successful", async () => {
    const mockCustomers = [
      { id: 1, name: "John", birth: "1990-01-01", email: "john@email.com" },
      { id: 2, name: "Jane", birth: "1995-05-05", email: "jane@email.com" },
    ];

    const spy = jest.spyOn(gymModelModule.gym_model, 'getAllCustomers').mockResolvedValue(mockCustomers);

    await gym_controller.getAllCustomers(req, res);

    expect(spy).toHaveBeenCalledTimes(1);


    expect(res.json).toHaveBeenCalledWith(mockCustomers);
    expect(res.status).toHaveBeenCalledWith(200);
    
    spy.mockRestore();
  });

  test("should return 500 error when database query fails", async () => {
    const error = new Error("Database error");
    const spy = jest.spyOn(gymModelModule.gym_model, 'getAllCustomers').mockRejectedValue(error);

    await gym_controller.getAllCustomers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    
    spy.mockRestore();
  });
});

describe("POST / - createCustomer", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user : { id:  "cb40b343-1c63-4e3c-baeb-e3ce225d3c21"},
      body: {
        name: "John",
        birth: "1990-01-01"
      }
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test("should create a customer successfully", async () => {
    const mockCustomer = {
      id: 1,
      name: "John",
      birth: "1990-01-01"
    };

    const spy = jest
      .spyOn(gymModelModule.gym_model, "createCustomer")
      .mockResolvedValue(mockCustomer);

    await gym_controller.createCustomer(req, res);

    expect(spy).toHaveBeenCalledWith( 
      req.user.id,
      {
      birth: "1990-01-01",
      name: "John" }
    );

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith( mockCustomer);

    spy.mockRestore();
  });

  test("should return 500 when customer creation fails", async () => {
    const error = new Error("Failed to create customer");

    const spy = jest
      .spyOn(gymModelModule.gym_model, "createCustomer")
      .mockRejectedValue(error);

    await gym_controller.createCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to create customer",
    });

    spy.mockRestore();
  });
});


describe("PATCH /:id - UpdateCustomer", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id:  "cb40b343-1c63-4e3c-baeb-e3ce225d3c21" },

      body: {
        name: "John Updated",
        birth: "1990-01-01"
      },
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test("should update a customer successfully", async () => {
    const spy = jest
      .spyOn(gymModelModule.gym_model, "UpdateCustomer")
      .mockResolvedValue();

    await gym_controller.UpdateCustomer(req, res);

    expect(spy).toHaveBeenCalledWith(
      "cb40b343-1c63-4e3c-baeb-e3ce225d3c21",
      {"birth": "1990-01-01", 
       "name": "John Updated"
      }
    );

    expect(res.json).toHaveBeenCalledWith({
      message: "Customer updated successfully",
    });
   
    expect(res.status).toHaveBeenCalledWith(200)

    spy.mockRestore();
  });

  test("should return 404 when customer is not found", async () => {
    const error = new Error("Customer not found");
    error.statusCode = 404;

    const spy = jest
      .spyOn(gymModelModule.gym_model, "UpdateCustomer")
      .mockRejectedValue(error);

    await gym_controller.UpdateCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      error: "Customer not found",
    });

    spy.mockRestore();
  });

  test("should return 500 when database update fails", async () => {
    const error = new Error("Database error");

    const spy = jest
      .spyOn(gymModelModule.gym_model, "UpdateCustomer")
      .mockRejectedValue(error);

    await gym_controller.UpdateCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Database error",
    });

    spy.mockRestore();
  });
});


describe("GET /search/:search - SearchCustomer", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { search: "John" },
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test("should return customers matching the search term", async () => {
    const mockCustomers = [
      { id: 1, name: "JAhn", birth: "1990-01-01", email: "joHnASH@gmail.com" },
      { id: 2, name: "JAhnny", birth: "1995-05-05", email: "jsoHnASH@gmail.com" },
    ];  

    const spy = jest
      .spyOn(gymModelModule.gym_model, "SearchCustomer")
      .mockResolvedValue(mockCustomers);

    await gym_controller.SearchCustomer(req, res);

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith("John");

    expect(res.json).toHaveBeenCalledWith(mockCustomers);
    expect(res.status).toHaveBeenCalledWith(200)

    spy.mockRestore();
  });

test("should return 404 when customer is not found", async () => {
    const spy = jest
        .spyOn(gymModelModule.gym_model, "SearchCustomer")
        .mockResolvedValue(null);

    await gym_controller.SearchCustomer(req, res);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(req.params.search);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found"
    });
  spy.mockRestore();
});

  test("should return 500 when an unexpected error happens", async () => {
    const error = new Error("Database error");

    const spy = jest
        .spyOn(gymModelModule.gym_model, "SearchCustomer")
        .mockRejectedValue(error);

    await gym_controller.SearchCustomer(req, res);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(req.params.search);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
        error: "Database error"
    });
});
})

//pnpm test /customer.controller.test.js