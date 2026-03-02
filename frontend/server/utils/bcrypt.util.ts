import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash un mot de passe avec bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare un mot de passe en clair avec un hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};
