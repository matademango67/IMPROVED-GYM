import { AppError } from "./errors/ErrorsIndex.js";

export function errorHandler(error, req, res, next) {
    if(error instanceof AppError){
        return   res
        .status(error.statusCode)
        .json({
            message: error.message
       });

    } else {
         console.error(error)
        if(process.env.NODE_ENV === "development"){
            return res.status(500).json({
                message: error.message,
                stack: error.stack     
            })

        } else {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }       
    }



