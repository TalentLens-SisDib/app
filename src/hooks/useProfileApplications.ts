import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {createApplication, getProfileApplications} from "../api/services/applications";
import type {JobApplication} from "../types/application";

const GENERIC_ERROR = "Não foi possível carregar as vagas do candidato.";

/** Vagas às quais um perfil já está vinculado, com a ação de vincular a novas. */
export function useProfileApplications(profileId: string) {
	const [applications, setApplications] = useState<JobApplication[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		getProfileApplications(profileId)
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
	}, [profileId]);

	/**
	 * Vincula a várias vagas em sequência. Para no primeiro erro, mas mantém
	 * as que já deram certo — o chamador recebe as criadas pelo estado.
	 */
	const link = useCallback(
		async (jobOpeningIds: string[]) => {
			const created: JobApplication[] = [];
			try {
				for (const jobOpeningId of jobOpeningIds) {
					created.push(await createApplication(jobOpeningId, {profileId}));
				}
			} finally {
				if (created.length > 0) setApplications((prev) => [...prev, ...created]);
			}
			return created;
		},
		[profileId],
	);

	return {applications, loading, error, link};
}
