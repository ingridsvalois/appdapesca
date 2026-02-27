import argon2 from "argon2";

const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 2,
};

/**
 * Gera hash da senha com argon2.
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, HASH_OPTIONS);
}

/**
 * Verifica se a senha em texto plano corresponde ao hash.
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
