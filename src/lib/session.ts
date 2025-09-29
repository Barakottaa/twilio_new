import { SignJWT, jwtVerify } from 'jose';

const NAME = 'twiliochat_session';
const TTL = 60 * 60 * 12; // 12h in seconds
const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'superlongrandomstringforjwtdevelopmentonlychangethisinproduction');

export async function issueSessionCookie(agent: {
  id: string; username: string; role: string;
  permissions?: Record<string, boolean>;
}) {
  const jwt = await new SignJWT({
    sub: agent.id,
    username: agent.username,
    role: agent.role,
    permissions: agent.permissions ?? {
      dashboard: true, agents: true, contacts: true, analytics: true, settings: true
    },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(`${TTL}s`)
    .sign(secret);

  return { name: NAME, value: jwt, maxAge: TTL };
}

export async function readSessionFrom(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return {
    isAuthenticated: true,
    agent: {
      id: payload.sub as string,
      username: payload.username as string,
      role: payload.role as string,
      permissions: payload.permissions as Record<string, boolean>,
    },
  };
}
