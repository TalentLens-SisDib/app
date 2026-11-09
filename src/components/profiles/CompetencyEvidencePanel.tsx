import type {JSX} from "react";
import {Badge, Card} from "../ui";
import type {CompetencyEvidence} from "../../types/competencyEvidence";
import {groupCompetencyEvidence} from "../../utils/competencyEvidence";

export type CompetencyEvidencePanelProps = {
	evidence: CompetencyEvidence[];
};

const SOURCE_LABELS: Record<CompetencyEvidence["sourceType"], string> = {
	curriculo: "Currículo",
	entrevista: "Entrevista",
	avaliacao: "Avaliação",
	outro: "Outra fonte",
};

export default function CompetencyEvidencePanel({evidence}: CompetencyEvidencePanelProps): JSX.Element {
	const groups = groupCompetencyEvidence(evidence);

	return (
		<Card
			title="Evidências por competência"
			description="Trechos das fontes associados às competências consideradas na avaliação do candidato.">
			{groups.length === 0 ? (
				<p className="text-base-content/55 text-sm">Nenhuma evidência associada às competências deste candidato.</p>
			) : (
				<ul className="space-y-3">
					{groups.map((group) => (
						<li key={group.competencyId} className="border-base-300 rounded-box border p-4">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h3 className="font-medium">{group.competencyName}</h3>
								<Badge size="xs" variant="neutral">
									{group.evidence.length} {group.evidence.length === 1 ? "evidência" : "evidências"}
								</Badge>
							</div>
							<ul className="mt-3 space-y-2">
								{group.evidence.map((item) => (
									<li key={item.id} className="bg-base-200 rounded-field p-3">
										<div className="flex flex-wrap items-center gap-2">
											<Badge size="xs" variant="secondary">
											{SOURCE_LABELS[item.sourceType] ?? SOURCE_LABELS.outro}
											</Badge>
											<span className="text-base-content/60 text-xs">{item.sourceLabel}</span>
										</div>
										<blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm leading-6">
											{item.excerpt.trim()}
										</blockquote>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
