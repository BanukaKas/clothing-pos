import bcrypt from 'bcryptjs';
import { query, get, run } from '../connection';
import type { DbUser, DbRole } from '../types';

export interface SafeUser {
  id: string;
  name: string;
  username: string;
  role: string;
  email: string | null;
  status: string;
  last_login: string | null;
  created_at: string;
}

export interface CreateUserInput {
  name: string;
  username: string;
  password: string;
  role: string;
  email?: string;
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  password?: string;
  role?: string;
  email?: string;
  status?: string;
}

function toSafeUser(user: DbUser): SafeUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    email: user.email,
    status: user.status,
    last_login: user.last_login,
    created_at: user.created_at,
  };
}

export function getAllUsers(): SafeUser[] {
  const users = query<DbUser>('SELECT * FROM users ORDER BY name ASC;');
  return users.map(toSafeUser);
}

export function getUserById(id: string): SafeUser | undefined {
  const user = get<DbUser>('SELECT * FROM users WHERE id = ?;', [id]);
  return user ? toSafeUser(user) : undefined;
}

export function getUserByUsername(username: string): DbUser | undefined {
  return get<DbUser>('SELECT * FROM users WHERE LOWER(username) = LOWER(?);', [username]);
}

export function authenticateUser(username: string, password: string): SafeUser | null {
  const user = getUserByUsername(username);
  if (!user) return null;

  if (user.status !== 'active') {
    throw new Error('This user account has been deactivated.');
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) return null;

  // Update last_login
  run("UPDATE users SET last_login = datetime('now') WHERE id = ?;", [user.id]);

  return toSafeUser({
    ...user,
    last_login: new Date().toISOString(),
  });
}

export function createUser(input: CreateUserInput): SafeUser {
  const existing = getUserByUsername(input.username);
  if (existing) {
    throw new Error(`Username "${input.username}" is already in use.`);
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(input.password, salt);

  run(
    `INSERT INTO users (
      id, name, username, password_hash, role, email, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'));`,
    [
      id,
      input.name,
      input.username,
      passwordHash,
      input.role,
      input.email || null,
    ]
  );

  return getUserById(id)!;
}

export function updateUser(id: string, input: UpdateUserInput): SafeUser {
  const user = get<DbUser>('SELECT * FROM users WHERE id = ?;', [id]);
  if (!user) {
    throw new Error(`User with ID ${id} not found.`);
  }

  if (input.username && input.username.toLowerCase() !== user.username.toLowerCase()) {
    const existing = getUserByUsername(input.username);
    if (existing && existing.id !== id) {
      throw new Error(`Username "${input.username}" is already in use.`);
    }
  }

  let passwordHash = user.password_hash;
  if (input.password && input.password.trim().length > 0) {
    const salt = bcrypt.genSaltSync(10);
    passwordHash = bcrypt.hashSync(input.password, salt);
  }

  run(
    `UPDATE users SET
      name = COALESCE(?, name),
      username = COALESCE(?, username),
      password_hash = ?,
      role = COALESCE(?, role),
      email = COALESCE(?, email),
      status = COALESCE(?, status)
     WHERE id = ?;`,
    [
      input.name ?? null,
      input.username ?? null,
      passwordHash,
      input.role ?? null,
      input.email ?? null,
      input.status ?? null,
      id,
    ]
  );

  return getUserById(id)!;
}

export function deleteUser(id: string): boolean {
  // Prevent deleting the last admin
  const admins = query<DbUser>("SELECT * FROM users WHERE role = 'admin' AND status = 'active';");
  const target = get<DbUser>('SELECT * FROM users WHERE id = ?;', [id]);

  if (target?.role === 'admin' && admins.length <= 1) {
    throw new Error('Cannot delete the only active administrator.');
  }

  const result = run('DELETE FROM users WHERE id = ?;', [id]);
  return result.changes > 0;
}

export function getAllRoles(): DbRole[] {
  return query<DbRole>('SELECT * FROM roles ORDER BY name ASC;');
}
