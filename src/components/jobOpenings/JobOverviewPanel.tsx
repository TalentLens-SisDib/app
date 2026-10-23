import type {JSX} from "react";
import {RiCalendarLine, RiMoneyDollarCircleLine, RiUserLine} from "@remixicon/react";
import {Badge, RichText} from "../ui";
import type {JobOpening, JobOpeningSkill} from "../../types/jobOpening";
import {formatCurrency, formatDate} from "../../utils/format";

export type JobOverviewPanelProps = {
	jobOpening: JobOpening;
	ownerName: string;
};

/** Painel "Sobre a vaga" — mesmo formato de cabeçalho do painel de cada etapa. */
export default function JobOverviewPanel({jobOpening, ownerName}: JobOverviewPanelProps): JSX.Element {
	const skills = jobOpening.skills ?? [];
	const requiredSkills = skills.filter((skill) => skill.isRequired);
	const desiredSkills = skills.filter((skill) => !skill.isRequired);

	return (
		<section aria-labelledby="job-overview-title" className="space-y-5">
			<header>
				<p className="text-primary text-xs font-semibold tracking-wider uppercase">Visão geral</p>
				<h2 id="job-overview-title" className="mt-0.5 text-lg font-semibold">
					Sobre a vaga
				</h2>
			</header>

			<dl className="grid gap-3 sm:grid-cols-3">
				<Meta icon={RiMoneyDollarCircleLine} label="Remuneração">
					{formatCurrency(jobOpening.expectedWage)}
				</Meta>
				<Meta icon={RiUserLine} label="Responsável">
					{ownerName}
				</Meta>
				<Meta icon={RiCalendarLine} label="Criada em">
					{formatDate(jobOpening.createdAt)}
				</Meta>
			</dl>

			{skills.length > 0 && (
				<div className="space-y-2">
					<SkillGroup label="Obrigatórias" skills={requiredSkills} variant="primary" />
					<SkillGroup label="Desejáveis" skills={desiredSkills} variant="ghost" />
				</div>
			)}

			<div className="border-base-300 border-t pt-5">
				<RichText value={jobOpening.description} className="text-sm" />
			</div>
		</section>
	);
}

function SkillGroup({
	label,
	skills,
	variant,
}: {
	label: string;
	skills: JobOpeningSkill[];
	variant: "primary" | "ghost";
}): JSX.Element | null {
	if (skills.length === 0) return null;
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className="text-base-content/55 mr-1 text-xs font-medium">{label}:</span>
			{skills.map((skill) => (
				<Badge key={skill.skillId} size="sm" variant={variant}>
					{skill.skillName}
				</Badge>
			))}
		</div>
	);
}

function Meta({
	icon: Icon,
	label,
	children,
}: {
	icon: typeof RiUserLine;
	label: string;
	children: string;
}): JSX.Element {
	return (
		<div className="bg-base-200/60 rounded-field flex items-start gap-2.5 px-3 py-2.5">
			<Icon className="text-base-content/45 mt-0.5 size-4 shrink-0" />
			<div className="min-w-0">
				<dt className="text-base-content/55 text-xs">{label}</dt>
				<dd className="truncate text-sm font-medium">{children}</dd>
			</div>
		</div>
	);
}
