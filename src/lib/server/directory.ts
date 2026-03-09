import { getDirectoryClient, getDomain } from './google.js';

export interface OrgUser {
	email: string;
	name: string;
	title: string;
	department: string;
	photoUrl: string;
}

export async function listOrgUsers(): Promise<OrgUser[]> {
	const directory = getDirectoryClient();
	const domain = getDomain();

	const users: OrgUser[] = [];
	let pageToken: string | undefined;

	do {
		const res = await directory.users.list({
			domain,
			maxResults: 500,
			orderBy: 'familyName',
			pageToken,
			projection: 'full'
		});

		for (const u of res.data.users || []) {
			if (u.suspended) continue;

			users.push({
				email: u.primaryEmail || '',
				name: u.name?.fullName || u.primaryEmail || '',
				title: u.organizations?.[0]?.title || '',
				department: u.organizations?.[0]?.department || '',
				photoUrl: u.thumbnailPhotoUrl || '',
			});
		}

		pageToken = res.data.nextPageToken ?? undefined;
	} while (pageToken);

	return users;
}
