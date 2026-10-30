import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {getJobOpenings} from "../api/services/jobOpenings";
import {getProfiles} from "../api/services/profiles";
import type {JobOpening} from "../types/jobOpening";
import type {Profile} from "../types/profile";

const GENERIC_ERROR = "Não foi possível carregar os dados do dashboard.";

/** Perfis (com candidaturas e entrevistas embutidas) e vagas: tudo que o dashboard precisa. */
export function useDashboardData() {
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;

		Promise.all([getProfiles(), getJobOpenings()])
			.then(([profileData, jobData]) => {
				if (cancelled) return;
				setProfiles(profileData);
				setJobOpenings(jobData);
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
	}, [reloadToken]);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		setReloadToken((token) => token + 1);
	}, []);

	return {profiles, jobOpenings, loading, error, reload};
}
