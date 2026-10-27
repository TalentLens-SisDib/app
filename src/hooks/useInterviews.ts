import {useCallback, useEffect, useRef, useState} from "react";
import {isApiError} from "../api/errors";
import {
	createInterview,
	deleteInterview,
	getInterviews,
	updateInterview,
} from "../api/services/interviews";
import type {
	CreateInterviewInput,
	Interview,
	UpdateInterviewInput,
} from "../types/interview";

const GENERIC_ERROR = "Não foi possível carregar as entrevistas.";

/**
 * Entrevistas de uma etapa. Quem troca de etapa remonta o componente
 * (`key={stepId}`), então o hook não precisa reiniciar o estado sozinho.
 */
export function useInterviews(stepId: string) {
	const [interviews, setInterviews] = useState<Interview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);
	// Update/remove precisam do registro completo (ids do perfil e da entrevista).
	const interviewsRef = useRef(interviews);
	useEffect(() => {
		interviewsRef.current = interviews;
	}, [interviews]);

	useEffect(() => {
		let cancelled = false;

		getInterviews(stepId)
			.then((data) => {
				if (!cancelled) setInterviews(data);
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
	}, [stepId, reloadToken]);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		setReloadToken((token) => token + 1);
	}, []);

	const create = useCallback(
		async (data: CreateInterviewInput) => {
			const interview = await createInterview(stepId, data);
			setInterviews((prev) => [interview, ...prev]);
			return interview;
		},
		[stepId],
	);

	const update = useCallback(async (id: string, data: UpdateInterviewInput) => {
		const current = interviewsRef.current.find((item) => item.id === id);
		if (!current) throw new Error(`Registro ${id} não encontrado.`);
		const interview = await updateInterview(current, data);
		setInterviews((prev) => prev.map((item) => (item.id === id ? interview : item)));
		return interview;
	}, []);

	const remove = useCallback(async (id: string) => {
		const current = interviewsRef.current.find((item) => item.id === id);
		if (!current) return;
		const siblings = interviewsRef.current.filter(
			(item) => item.interviewId === current.interviewId && item.id !== id,
		);
		await deleteInterview(current, siblings.length === 0);
		setInterviews((prev) => prev.filter((item) => item.id !== id));
	}, []);

	return {interviews, loading, error, reload, create, update, remove};
}
