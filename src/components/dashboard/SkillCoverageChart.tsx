import type {JSX} from "react";
import {Link} from "react-router-dom";
import {RiArrowRightLine, RiMedalLine} from "@remixicon/react";
import type {SkillCoverage} from "../../utils/dashboardMetrics";
import ChartCard from "./ChartCard";
import ChartEmpty from "./ChartEmpty";
import ChartLegend from "./ChartLegend";
import {formatNumber} from "./chartTheme";

type Tier = "ok" | "attn" | "err";

/** Faixas de leitura do percentual — apresentação apenas, não vêm da API. */
const TIERS: Record<Tier, {label: string; bar: string; text: string; min: number}> = {
	ok: {label: "Boa (≥ 70%)", bar: "bg-success", text: "tl-tone-ok", min: 70},
	attn: {label: "Atenção (30–69%)", bar: "bg-warning", text: "tl-tone-attn", min: 30},
	err: {label: "Baixa (< 30%)", bar: "bg-error", text: "tl-tone-err", min: 0},
};

function tierOf(percent: number): Tier {
	if (percent >= TIERS.ok.min) return "ok";
	if (percent >= TIERS.attn.min) return "attn";
	return "err";
}

type SkillCoverageChartProps = {
	data: SkillCoverage[];
	totalCandidates: number;
	className?: string;
};

export default function SkillCoverageChart({data, totalCandidates, className}: SkillCoverageChartProps): JSX.Element {
	const lowCoverage = data.filter((skill) => tierOf(skill.percent) === "err").length;

	return (
		<ChartCard
			title="Cobertura de competências"
			description="Competências obrigatórias mais exigidas nas vagas e a parcela do banco de talentos que as possui"
			className={className}
			toolbar={
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
						<p>
							<span className="text-xl font-semibold tabular-nums">{data.length}</span>{" "}
							<span className="text-base-content/60 text-xs">competência(s) mais exigidas</span>
						</p>
						<p>
							<span className={`text-xl font-semibold tabular-nums ${lowCoverage > 0 ? "tl-tone-err" : ""}`}>
								{lowCoverage}
							</span>{" "}
							<span className="text-base-content/60 text-xs">com cobertura baixa</span>
						</p>
					</div>
					<ChartLegend
						items={(Object.keys(TIERS) as Tier[]).map((tier) => ({
							label: TIERS[tier].label,
							swatch: {className: TIERS[tier].bar},
						}))}
					/>
				</div>
			}
			empty={
				data.length > 0 ? undefined : (
					<ChartEmpty icon={<RiMedalLine className="size-5" />} title="Nenhuma competência obrigatória">
						<Link to="/vagas" className="tl-link">
							Defina as competências obrigatórias das vagas
						</Link>{" "}
						para ver onde faltam candidatos.
					</ChartEmpty>
				)
			}
			table={{
				columns: ["Competência", "Vagas que exigem", "Candidatos com ela", "% dos candidatos"],
				rows: data.map((skill) => [skill.name, skill.jobs, skill.candidates, `${skill.percent}%`]),
			}}
			footer={
				<>
					<p className="text-base-content/60">
						Base: {formatNumber(totalCandidates)} candidato(s) cadastrados
					</p>
					<Link to="/competencias" className="tl-link shrink-0">
						Ver competências
						<RiArrowRightLine className="size-3.5" />
					</Link>
				</>
			}>
			<ul className="space-y-3.5">
				{data.map((skill) => {
					const tier = TIERS[tierOf(skill.percent)];
					return (
						<li key={skill.skillId}>
							<div className="flex items-baseline justify-between gap-3">
								<p className="min-w-0 truncate text-sm">
									<span className="font-medium" title={skill.name}>
										{skill.name}
									</span>
									<span className="text-base-content/50 ml-2 text-xs">
										{skill.jobs} vaga(s)
									</span>
								</p>
								<p className="shrink-0 text-xs tabular-nums">
									<span className="text-base-content/50 mr-2">
										{skill.candidates}/{totalCandidates}
									</span>
									<span className={`inline-block w-9 text-right text-sm font-semibold ${tier.text}`}>
										{skill.percent}%
									</span>
								</p>
							</div>
							<div
								data-tip={`${skill.candidates} de ${totalCandidates} candidatos · obrigatória em ${skill.jobs} vaga(s)`}
								className="tooltip bg-base-200 mt-1.5 block h-1.5 w-full rounded-full">
								<div
									className={`h-full rounded-full ${tier.bar}`}
									style={{width: `${skill.percent}%`}}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</ChartCard>
	);
}
