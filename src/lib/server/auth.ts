import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'minutebox-marketing' });

export type Role = 'admin' | 'manager' | 'viewer';

export interface AppUser {
	email: string;
	role: Role;
}

// Cache roles for 60s to avoid hitting BigQuery on every request
let rolesCache: Map<string, Role> | null = null;
let rolesCacheTime = 0;
const CACHE_TTL = 60_000;

async function getRolesMap(): Promise<Map<string, Role>> {
	const now = Date.now();
	if (rolesCache && now - rolesCacheTime < CACHE_TTL) return rolesCache;

	const [rows] = await bq.query({
		query: 'SELECT email, role FROM `minutebox-marketing.tickets.roles`',
	});

	const map = new Map<string, Role>();
	for (const row of rows) {
		map.set(row.email as string, row.role as Role);
	}

	rolesCache = map;
	rolesCacheTime = now;
	return map;
}

export function invalidateRolesCache() {
	rolesCache = null;
}

/**
 * Extract user from IAP headers. On Cloud Run with IAP,
 * X-Goog-Authenticated-User-Email contains "accounts.google.com:user@domain.com"
 */
export async function getUserFromRequest(request: Request): Promise<AppUser> {
	const header = request.headers.get('x-goog-authenticated-user-email') ?? '';
	// IAP prefixes with "accounts.google.com:"
	const email = header.replace(/^accounts\.google\.com:/, '').toLowerCase().trim();

	if (!email) {
		// Local dev fallback — no IAP headers. Only safe because Cloud Run always has IAP.
		if (process.env.NODE_ENV === 'production') {
			return { email: 'anonymous', role: 'viewer' };
		}
		return { email: 'dev@localhost', role: 'admin' };
	}

	const roles = await getRolesMap();
	const role = roles.get(email) ?? 'viewer';

	return { email, role };
}

export function requireRole(user: AppUser, ...allowed: Role[]): void {
	if (!allowed.includes(user.role)) {
		throw new Error(`Forbidden: requires ${allowed.join(' or ')}`);
	}
}

// --- Roles CRUD ---

export async function loadRoles(): Promise<{ email: string; role: Role }[]> {
	const [rows] = await bq.query({
		query: 'SELECT email, role FROM `minutebox-marketing.tickets.roles` ORDER BY email',
	});
	return rows.map((r) => ({ email: r.email as string, role: r.role as Role }));
}

export async function upsertRole(email: string, role: Role, updatedBy: string): Promise<void> {
	// Delete existing then insert (BigQuery doesn't have UPSERT)
	await bq.query({
		query: 'DELETE FROM `minutebox-marketing.tickets.roles` WHERE email = @email',
		params: { email },
	});
	await bq.query({
		query: 'INSERT INTO `minutebox-marketing.tickets.roles` (email, role, updated_at, updated_by) VALUES (@email, @role, CURRENT_TIMESTAMP(), @updatedBy)',
		params: { email, role, updatedBy },
	});
	invalidateRolesCache();
}

export async function deleteRole(email: string): Promise<void> {
	await bq.query({
		query: 'DELETE FROM `minutebox-marketing.tickets.roles` WHERE email = @email',
		params: { email },
	});
	invalidateRolesCache();
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
	const [rows] = await bq.query({
		query: 'SELECT value FROM `minutebox-marketing.tickets.settings` WHERE `key` = @key LIMIT 1',
		params: { key },
	});
	return rows.length > 0 ? (rows[0].value as string) : null;
}

export async function setSetting(key: string, value: string, updatedBy: string): Promise<void> {
	await bq.query({
		query: 'DELETE FROM `minutebox-marketing.tickets.settings` WHERE `key` = @key',
		params: { key },
	});
	await bq.query({
		query: 'INSERT INTO `minutebox-marketing.tickets.settings` (`key`, value, updated_at, updated_by) VALUES (@key, @value, CURRENT_TIMESTAMP(), @updatedBy)',
		params: { key, value, updatedBy },
	});
}

export async function getBookingWindowDays(): Promise<number> {
	const val = await getSetting('booking_window_days');
	return val ? parseInt(val, 10) : 60;
}
