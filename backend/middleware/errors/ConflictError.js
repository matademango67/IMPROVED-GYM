import { AppError } from './AppError.js'

export class ConflictError extends AppError{
    constructor(message){
        super(409,message)
    }
}