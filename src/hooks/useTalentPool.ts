import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {
	getTalentPool,
	getTalentPoolEntry,
	removeTalentPoolEntry,
	saveTalentPoolEntry,
} from "../api/services/talentPool";
import type {TalentPoolEntry} from "../types/talentPool";

const GENERIC_ERROR = "Não foi possível carregar o banco de talentos.";

/** Todos os candidatos do banco de talentos. */
export function useTalentPool() {
	const [entries, setEntries] = useState<TalentPoolEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		const controller = new AbortController();

		getTalentPool(controller.signal)
			.then(setEntries)
			.catch((err: unknown) => {
				if (!controller.signal.aborted) setError(isApiError(err) ? err.message : GENERIC_ERROR);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});

		return () => controller.abort();
	}, [reloadToken]);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		setReloadToken((token) => token + 1);
	}, []);

	const saveNote = useCallback(async (profileId: string, note: string | null) => {
		const updated = await saveTalentPoolEntry(profileId, {note});
		setEntries((prev) => prev.map((item) => (item.profileId === profileId ? updated : item)));
		return updated;
	}, []);

	const remove = useCallback(async (profileId: string) => {
		await removeTalentPoolEntry(profileId);
		setEntries((prev) => prev.filter((item) => item.profileId !== profileId));
	}, []);

	return {entries, loading, error, reload, saveNote, remove};
}

/** Situação de um perfil no banco de talentos (`entry: null` = fora do banco). */
export function useTalentPoolEntry(profileId: string) {
	const [result, setResult] = useState<{key: string; entry: TalentPoolEntry | null; error: string | null} | null>(null);
	const [reloadToken, setReloadToken] = useState(0);
	const key = `${profileId}:${reloadToken}`;
	const loading = result?.key !== key;

	useEffect(() => {
		const controller = new AbortController();

		getTalentPoolEntry(profileId, controller.signal)
			.then((entry) => setResult({key, entry, error: null}))
			.catch((err: unknown) => {
				if (!controller.signal.aborted) {
					setResult({key, entry: null, error: isApiError(err) ? err.message : GENERIC_ERROR});
				}
			});

		return () => controller.abort();
	}, [profileId, key]);

	const reload = useCallback(() => setReloadToken((token) => token + 1), []);

	const save = useCallback(
		async (note: string | null) => {
			const entry = await saveTalentPoolEntry(profileId, {note});
			setResult({key, entry, error: null});
			return entry;
		},
		[profileId, key],
	);

	const remove = useCallback(async () => {
		await removeTalentPoolEntry(profileId);
		setResult({key, entry: null, error: null});
	}, [profileId, key]);

	return {
		entry: loading ? null : (result?.entry ?? null),
		loading,
		error: loading ? null : (result?.error ?? null),
		reload,
		save,
		remove,
	};
}
