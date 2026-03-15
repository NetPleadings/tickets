import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { env } from '$env/dynamic/private';

function getKeyContent(): object | null {
	// Prefer inline JSON (for Cloud Run / Secret Manager)
	const keyJson = env.GOOGLE_SA_KEY_JSON;
	if (keyJson) {
		return JSON.parse(keyJson);
	}
	// Fall back to file path (for local dev)
	const keyPath = env.GOOGLE_SA_KEY_PATH;
	if (keyPath && existsSync(keyPath)) {
		return JSON.parse(readFileSync(keyPath, 'utf-8'));
	}
	return null;
}

export function getDirectoryClient() {
	const adminEmail = env.GOOGLE_ADMIN_EMAIL;
	if (!adminEmail) {
		throw new Error('GOOGLE_ADMIN_EMAIL not configured');
	}

	const keyContent = getKeyContent();
	if (!keyContent) {
		throw new Error('GOOGLE_SA_KEY_PATH not configured or file not found');
	}

	const key = keyContent as { client_email: string; private_key: string };

	const auth = new google.auth.JWT({
		email: key.client_email,
		key: key.private_key,
		scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
		subject: adminEmail
	});

	return google.admin({ version: 'directory_v1', auth });
}

export function getDomain(): string {
	return env.GOOGLE_DOMAIN || 'minutebox.com';
}
