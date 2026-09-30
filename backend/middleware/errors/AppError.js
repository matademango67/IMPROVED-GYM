export class AppError extends Error {
        constructor(statusCode , message , details = null){
            super(message);

            if( typeof statusCode !== "number" || statusCode > 599 || statusCode < 100 ){
                throw new Error("Invalid status code")
            }

            this.statusCode = statusCode
            this.details = details    
        }   
    }