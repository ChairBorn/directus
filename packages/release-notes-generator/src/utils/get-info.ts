import { getInfo as getGithubInfo } from '@changesets/get-github-info';
import { MAIN_PACKAGE, PACKAGE_ORDER, REPO, TYPE_MAP, UNTYPED_PACKAGES } from '../constants';
import type { Change, ChangesetsWithoutId, Type, UntypedPackage } from '../types';
import { sortByExternalOrder, sortByObjectValues } from './sort';

export async function getInfo(changesets: ChangesetsWithoutId): Promise<{
	types: Type[];
	untypedPackages: UntypedPackage[];
}> {
	const types: Type[] = [];
	const untypedPackages: UntypedPackage[] = [];

	for (const { summary, commit, releases } of changesets.values()) {
		let githubInfo;

		if (commit) {
			githubInfo = await getGithubInfo({
				repo: REPO,
				commit: commit,
			});
		}

		for (const { type, name } of releases) {
			const change: Change = { summary, commit, githubInfo };

			if (name === MAIN_PACKAGE || !summary) {
				continue;
			}

			if (isUntypedPackage(name)) {
				const untypedPackageName = UNTYPED_PACKAGES[name];

				const packageInUntypedPackages = untypedPackages.find((p) => p.name === untypedPackageName);

				if (packageInUntypedPackages) {
					packageInUntypedPackages.changes.push(change);
				} else {
					untypedPackages.push({
						name: untypedPackageName,
						changes: [change],
					});
				}

				continue;
			}

			const typeTitle = TYPE_MAP[type];
			const typeInTypes = types.find((t) => t.title === typeTitle);

			if (typeInTypes) {
				const packageInPackages = typeInTypes.packages.find((p) => p.name === name);

				if (packageInPackages) {
					packageInPackages.changes.push(change);
				} else {
					typeInTypes.packages.push({
						name,
						changes: [change],
					});
				}
			} else {
				types.push({ title: typeTitle, packages: [{ name, changes: [change] }] });
			}
		}
	}

	types.sort(sortByObjectValues(TYPE_MAP, 'title'));

	for (const { packages } of types) {
		packages.sort(sortByExternalOrder(PACKAGE_ORDER, 'name'));
	}

	untypedPackages.sort(sortByObjectValues(UNTYPED_PACKAGES, 'name'));

	return { types, untypedPackages };
}

function isUntypedPackage(name: string): name is keyof typeof UNTYPED_PACKAGES {
	return Object.prototype.hasOwnProperty.call(UNTYPED_PACKAGES, name);
}
