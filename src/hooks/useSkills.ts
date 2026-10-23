import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {createSkill, deleteSkill, getSkills, updateSkill} from "../api/services/skills";
import type {CreateSkillInput, Skill, UpdateSkillInput} from "../types/skill";

const GENERIC_ERROR = "Não foi possível carregar as competências.";

function byName(a: Skill, b: Skill): number {
	return a.name.localeCompare(b.name, "pt-BR");
}

/** Catálogo de competências, sempre ordenado por nome. */
export function useSkills() {
	const [skills, setSkills] = useState<Skill[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;

		getSkills()
			.then((data) => {
				if (!cancelled) setSkills([...data].sort(byName));
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

	const create = useCallback(async (data: CreateSkillInput) => {
		const skill = await createSkill(data);
		setSkills((prev) => [...prev, skill].sort(byName));
		return skill;
	}, []);

	const update = useCallback(async (id: string, data: UpdateSkillInput) => {
		const skill = await updateSkill(id, data);
		setSkills((prev) => prev.map((item) => (item.id === id ? skill : item)).sort(byName));
		return skill;
	}, []);

	const remove = useCallback(async (id: string) => {
		await deleteSkill(id);
		setSkills((prev) => prev.filter((item) => item.id !== id));
	}, []);

	return {skills, loading, error, reload, create, update, remove};
}
