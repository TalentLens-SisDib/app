import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {getProfiles} from "../api/services/profiles";
import type {Profile} from "../types/profile";

const GENERIC_ERROR = "Não foi possível carregar os candidatos.";

export function useProfiles() {
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;

		getProfiles()
			.then((data) => {
				if (!cancelled) setProfiles(data);
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

	return {profiles, loading, error, reload};
}
