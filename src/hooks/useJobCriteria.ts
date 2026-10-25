import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {
	createJobCriterion,
	deleteJobCriterion,
	getJobCriteria,
	updateJobCriterion,
} from "../api/services/jobCriteria";
import type {JobCriterion, JobCriterionInput} from "../types/jobCriterion";

const GENERIC_ERROR = "Não foi possível carregar os critérios da vaga.";

export function useJobCriteria(jobOpeningId: string) {
	const [criteria, setCriteria] = useState<JobCriterion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;
		getJobCriteria(jobOpeningId)
			.then((data) => {
				if (!cancelled) setCriteria(data);
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

	const create = useCallback(
		async (input: JobCriterionInput) => {
			const criterion = await createJobCriterion(jobOpeningId, input);
			setCriteria((current) => [...current, criterion]);
			return criterion;
		},
		[jobOpeningId],
	);

	const update = useCallback(
		async (id: string, input: JobCriterionInput) => {
			const criterion = await updateJobCriterion(jobOpeningId, id, input);
			setCriteria((current) => current.map((item) => (item.id === id ? criterion : item)));
			return criterion;
		},
		[jobOpeningId],
	);

	const remove = useCallback(
		async (id: string) => {
			await deleteJobCriterion(jobOpeningId, id);
			setCriteria((current) => current.filter((item) => item.id !== id));
		},
		[jobOpeningId],
	);

	return {criteria, loading, error, reload, create, update, remove};
}
