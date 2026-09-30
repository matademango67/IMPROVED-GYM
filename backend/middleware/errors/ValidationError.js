import { AppError } from './AppError.js'

export class ValidationError extends AppError{
    constructor(errors){
        this.errors = errors;
        super(400 , "validation failed" , errors)
    }
}