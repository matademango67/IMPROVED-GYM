import { AppError } from './AppError.js'

export class ForbiddenError extends AppError{
    constructor(message){
        super(403,message)
    }
}