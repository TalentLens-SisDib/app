import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {createCulturalFit, getCulturalFits} from "../api/services/culturalFits";
import type {CreateCulturalFitInput, CulturalFit} from "../types/culturalFit";

const GENERIC_ERROR = "Não foi possível carregar as características comportamentais.";

function byName(a: CulturalFit, b: CulturalFit): number {
	return a.name.localeCompare(b.name, "pt-BR");
}

/** Catálogo de características comportamentais, sempre ordenado por nome. */
export function useCulturalFits() {
	const [culturalFits, setCulturalFits] = useState<CulturalFit[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		getCulturalFits()
			.then((data) => {
				if (!cancelled) setCulturalFits([...data].sort(byName));
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
	}, []);

	const create = useCallback(async (data: CreateCulturalFitInput) => {
		const culturalFit = await createCulturalFit(data);
		setCulturalFits((prev) => [...prev, culturalFit].sort(byName));
		return culturalFit;
	}, []);

	return {culturalFits, loading, error, create};
}
