import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {
	createJobOpening,
	deleteJobOpening,
	getJobOpenings,
	updateJobOpening,
} from "../api/services/jobOpenings";
import type {
	CreateJobOpeningInput,
	JobOpening,
	UpdateJobOpeningInput,
} from "../types/jobOpening";

const GENERIC_ERROR = "Não foi possível carregar as vagas.";

export function useJobOpenings() {
	const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
	const [mine, setMineState] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;

		getJobOpenings(mine)
			.then((data) => {
				if (!cancelled) setJobOpenings(data);
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
	}, [mine, reloadToken]);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		setReloadToken((token) => token + 1);
	}, []);

	const setMine = useCallback((value: boolean) => {
		setLoading(true);
		setError(null);
		setMineState(value);
	}, []);

	const create = useCallback(async (data: CreateJobOpeningInput) => {
		const jobOpening = await createJobOpening(data);
		setJobOpenings((prev) => [jobOpening, ...prev]);
		return jobOpening;
	}, []);

	const update = useCallback(async (id: string, data: UpdateJobOpeningInput) => {
		const jobOpening = await updateJobOpening(id, data);
		setJobOpenings((prev) => prev.map((item) => (item.id === id ? jobOpening : item)));
		return jobOpening;
	}, []);

	const remove = useCallback(async (id: string) => {
		await deleteJobOpening(id);
		setJobOpenings((prev) => prev.filter((item) => item.id !== id));
	}, []);

	return {jobOpenings, mine, setMine, loading, error, reload, create, update, remove};
}
