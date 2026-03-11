import { cookies } from "next/headers";
import { getDb } from "./db";
import { UserDataMapper } from "../adapters/UserDataMapper";
import { SessionDataMapper } from "../adapters/SessionDataMapper";
import { BcryptHasher } from "../adapters/BcryptHasher";
import { RegisterUserInteractor } from "../core/use-cases/RegisterUserInteractor";
import { AuthenticateUserInteractor } from "../core/use-cases/AuthenticateUserInteractor";
import { ValidateSessionInteractor } from "../core/use-cases/ValidateSessionInteractor";
import type { RoleName, User as SessionUser } from "../core/entities/user";
import type { AuthResult } from "../core/use-cases/RegisterUserInteractor";

export type { RoleName, SessionUser, AuthResult };

// ── Composition root: wire interactors to concrete adapters ──

function getAuthInteractors() {
  const db = getDb();
  const userRepo = new UserDataMapper(db);
  const sessionRepo = new SessionDataMapper(db);
  const hasher = new BcryptHasher();

  return {
    register: new RegisterUserInteractor(userRepo, hasher, sessionRepo),
    authenticate: new AuthenticateUserInteractor(userRepo, hasher, sessionRepo),
    validateSession: new ValidateSessionInteractor(sessionRepo, userRepo),
    sessionRepo,
  };
}

// ── New auth convenience functions ──

export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResult> {
  const { register: interactor } = getAuthInteractors();
  return interactor.execute(input);
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { authenticate } = getAuthInteractors();
  return authenticate.execute(input);
}

export async function logout(sessionToken: string): Promise<void> {
  const { sessionRepo } = getAuthInteractors();
  await sessionRepo.delete(sessionToken);
}

export async function validateSession(
  token: string,
): Promise<SessionUser> {
  const { validateSession: interactor } = getAuthInteractors();
  return interactor.execute({ token });
}

// ── Preserved mock auth functions (used by existing code until Sprint 2) ──

const MOCK_SESSION_COOKIE_NAME = "lms_mock_session_role";

/**
 * Mocks setting an authentication session by writing a cookie containing the active role.
 * In a real application, this would be handled by NextAuth and signed JWTs.
 */
export async function setMockSession(role: RoleName) {
  const cookieStore = await cookies();
  cookieStore.set(MOCK_SESSION_COOKIE_NAME, role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Identifies the current mock user by reading the active cookie role,
 * looking up the mock user bound to that role in SQLite, and computing their roles array.
 */
export async function getSessionUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get(MOCK_SESSION_COOKIE_NAME)?.value as
    | RoleName
    | undefined;

  // Default to ANONYMOUS if no explicit cookie is set
  const activeRoleName = rawRole || "ANONYMOUS";

  const db = getDb();
  const mapper = new UserDataMapper(db);

  const user = mapper.findByActiveRole(activeRoleName);

  if (!user) {
    return {
      id: "usr_anonymous",
      email: "anonymous@example.com",
      name: "Anonymous User",
      roles: ["ANONYMOUS"],
    };
  }

  return user;
}

/**
 * Helper to block access if the user lacks the required RBAC role.
 */
export async function requireRole(allowedRoles: RoleName[]) {
  const user = await getSessionUser();
  const hasAccess = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    throw new Error(
      `Unauthorized. Requires one of: ${allowedRoles.join(", ")}`,
    );
  }
}
