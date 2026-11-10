import type {CompetencyEvidence, CompetencyEvidenceGroup} from "../types/competencyEvidence";

/** Groups non-empty evidence snippets by competency and sorts them for display. */
export function groupCompetencyEvidence(evidence: CompetencyEvidence[]): CompetencyEvidenceGroup[] {
	const groups = new Map<string, CompetencyEvidenceGroup>();
	for (const item of evidence) {
		if (!item.excerpt.trim()) continue;
		const group = groups.get(item.competencyId) ?? {
			competencyId: item.competencyId,
			competencyName: item.competencyName,
			evidence: [],
		};
		group.evidence.push(item);
		groups.set(item.competencyId, group);
	}

	return [...groups.values()]
		.map((group) => ({
			...group,
			evidence: [...group.evidence].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
		}))
		.sort((a, b) => a.competencyName.localeCompare(b.competencyName, "pt-BR"));
}
