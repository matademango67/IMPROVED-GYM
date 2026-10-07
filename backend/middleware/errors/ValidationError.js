import { AppError } from './AppError.js'

export class ValidationError extends AppError{
    constructor(errors){
        const message = Object.values(errors).flat()[0] ?? "Validation failed";
        super(400 , message)
        this.errors = errors;
    }
}
