// Admin-only app: there is no public account system (docs/03 §Users).

/** What the session carries after sign-in. */
export type SessionUser = { id: string; email: string; isAdmin: boolean };

/** A user loaded WITH its password field — only for verification, never in a DTO. */
export type UserWithPassword = SessionUser & { password: string };

export type UserRepository = {
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  findByIdWithPassword(id: string): Promise<UserWithPassword | null>;
  setPassword(id: string, stored: string): Promise<boolean>;
};

export type PasswordHasher = {
  verify(stored: string, supplied: string): Promise<boolean>;
  hash(password: string): Promise<string>;
};
