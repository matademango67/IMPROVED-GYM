import { AppError } from './AppError.js'

export class UnauthorizedError extends AppError{
    constructor(message){
        super(401,message)
    }
}