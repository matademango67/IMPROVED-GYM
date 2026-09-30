import { AppError } from './AppError.js'

export class NotFoundError extends AppError{
    constructor(message){
        super(404,message)
    }
}