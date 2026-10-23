import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {deleteJobOpening, getJobOpening, updateJobOpening} from "../api/services/jobOpenings";
import {createStep, deleteStep, getSteps, updateStep} from "../api/services/steps";
import type {JobOpening, UpdateJobOpeningInput} from "../types/jobOpening";
import type {CreateStepInput, Step, UpdateStepInput} from "../types/step";

const GENERIC_ERROR = "Não foi possível carregar a vaga.";

function byOrder(a: Step, b: Step): number {
	return a.order - b.order;
}

/** Vaga + etapas do processo seletivo, carregadas juntas para a tela de detalhe. */
export function useJobOpening(id: string) {
	const [jobOpening, setJobOpening] = useState<JobOpening | null>(null);
	const [steps, setSteps] = useState<Step[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;

		Promise.all([getJobOpening(id), getSteps(id)])
			.then(([job, jobSteps]) => {
				if (cancelled) return;
				setJobOpening(job);
				setSteps([...jobSteps].sort(byOrder));
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				if (isApiError(err) && (err.kind === "not_found" || err.status === 400)) {
					setNotFound(true);
				} else {
					setError(isApiError(err) ? err.message : GENERIC_ERROR);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [id, reloadToken]);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		setNotFound(false);
		setReloadToken((token) => token + 1);
	}, []);

	const update = useCallback(
		async (data: UpdateJobOpeningInput) => {
			const job = await updateJobOpening(id, data);
			setJobOpening(job);
			return job;
		},
		[id],
	);

	const remove = useCallback(() => deleteJobOpening(id), [id]);

	const addStep = useCallback(
		async (data: CreateStepInput) => {
			const step = await createStep(id, data);
			setSteps((prev) => [...prev, step].sort(byOrder));
			return step;
		},
		[id],
	);

	const editStep = useCallback(
		async (stepId: string, data: UpdateStepInput) => {
			const step = await updateStep(id, stepId, data);
			setSteps((prev) => prev.map((item) => (item.id === stepId ? step : item)).sort(byOrder));
			return step;
		},
		[id],
	);

	const removeStep = useCallback(
		async (stepId: string) => {
			await deleteStep(id, stepId);
			setSteps((prev) => prev.filter((item) => item.id !== stepId));
		},
		[id],
	);

	return {
		jobOpening,
		steps,
		loading,
		error,
		notFound,
		reload,
		update,
		remove,
		addStep,
		editStep,
		removeStep,
	};
}
