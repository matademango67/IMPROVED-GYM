export function translateDatabaseError(error) {
    if (error.constraint === "users_email_key") {
        throw new ConflictError(
            "A user with this email already exists"
        );
    } else if (error.constraint === "customers_user_id_key") {
        throw new ConflictError(
            "This user already has a customer profile"
        );
    } else {
        throw error;
    }
}