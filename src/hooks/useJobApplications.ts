import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {
	createApplication,
	deleteApplication,
	getApplications,
} from "../api/services/applications";
import type {JobApplication} from "../types/application";

const GENERIC_ERROR = "Não foi possível carregar os candidatos da vaga.";

/** Candidatos vinculados a uma vaga. */
export function useJobApplications(jobOpeningId: string) {
	const [applications, setApplications] = useState<JobApplication[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;

		getApplications(jobOpeningId)
			.then((data) => {
				if (!cancelled) setApplications(data);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(isApiError(err) ? err.message : GENERIC_ERROR);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [jobOpeningId, reloadToken]);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		setReloadToken((token) => token + 1);
	}, []);

	/** Vincula em sequência; para no primeiro erro, mantendo os que já deram certo. */
	const link = useCallback(
		async (profiles: {id: string; name: string}[]) => {
			const created: JobApplication[] = [];
			try {
				for (const profile of profiles) {
					created.push(
						await createApplication(jobOpeningId, {profileId: profile.id, profileName: profile.name}),
					);
				}
			} finally {
				if (created.length > 0) setApplications((prev) => [...prev, ...created]);
			}
			return created;
		},
		[jobOpeningId],
	);

	const unlink = useCallback(
		async (profileId: string) => {
			await deleteApplication(jobOpeningId, profileId);
			setApplications((prev) => prev.filter((item) => item.profileId !== profileId));
		},
		[jobOpeningId],
	);

	return {applications, loading, error, reload, link, unlink};
}
