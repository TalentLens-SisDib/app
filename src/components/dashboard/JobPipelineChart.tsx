import type {JSX} from "react";
import {Link} from "react-router-dom";
import {RiArrowRightLine, RiBriefcase4Line} from "@remixicon/react";
import type {JobOpening} from "../../types/jobOpening";
import type {JobPipeline} from "../../utils/dashboardMetrics";
import ChartCard from "./ChartCard";
import ChartEmpty from "./ChartEmpty";
import ChartLegend, {type ChartLegendItem} from "./ChartLegend";
import {formatNumber, formatPercent} from "./chartTheme";

const VISIBLE_JOBS = 6;
const VISIBLE_EMPTY_JOBS = 3;

// Verde = atende, âmbar = falta algo: o significado vem do tom, e o número está sempre escrito ao lado.
const QUALIFIED = {label: "Atendem às obrigatórias", className: "bg-success"};
const MISSING = {label: "Faltam obrigatórias", className: "bg-warning"};
const UNSCORED = {label: "Vaga sem obrigatórias", className: "bg-base-content/20"};

type JobPipelineChartProps = {
	data: JobPipeline[];
	/** Vagas sem nenhum candidato, mostradas no rodapé. */
	emptyJobs: JobOpening[];
	className?: string;
};

function JobRow({job, max}: {job: JobPipeline; max: number}): JSX.Element {
	const segments = job.hasRequiredSkills
		? [
				{key: "qualified", value: job.qualified, tip: `${job.qualified} atendem às obrigatórias`, ...QUALIFIED},
				{key: "missing", value: job.missing, tip: `${job.missing} sem todas as obrigatórias`, ...MISSING},
			]
		: [{key: "unscored", value: job.total, tip: "A vaga não define competências obrigatórias", ...UNSCORED}];

	return (
		<li>
			<div className="flex items-baseline justify-between gap-3">
				<Link
					to={`/vagas/${job.id}?secao=candidatos`}
					title={job.name}
					className="hover:text-primary min-w-0 truncate text-sm font-medium transition-colors">
					{job.name}
				</Link>
				<span className="text-base-content/55 shrink-0 text-xs tabular-nums">
					{job.hasRequiredSkills ? (
						<>
							<span className="text-base-content font-semibold">{job.qualified}</span> de {job.total} atendem
						</>
					) : (
						<>
							<span className="text-base-content font-semibold">{job.total}</span> candidato(s)
						</>
					)}
				</span>
			</div>
			{/* A largura da barra é proporcional ao total da vaga com mais candidatos. */}
			<div className="bg-base-200 mt-2 h-2 rounded-full">
				<div className="flex h-full gap-0.5" style={{width: `${(job.total / max) * 100}%`}}>
					{segments
						.filter((segment) => segment.value > 0)
						.map((segment) => (
							<div
								key={segment.key}
								data-tip={segment.tip}
								className={`tooltip h-full min-w-1 rounded-full ${segment.className}`}
								style={{flexGrow: segment.value}}
							/>
						))}
				</div>
			</div>
		</li>
	);
}

export default function JobPipelineChart({data, emptyJobs, className}: JobPipelineChartProps): JSX.Element {
	const visible = data.slice(0, VISIBLE_JOBS);
	const max = Math.max(1, ...visible.map((job) => job.total));
	const scored = data.filter((job) => job.hasRequiredSkills);
	const scoredTotal = scored.reduce((sum, job) => sum + job.total, 0);
	const scoredQualified = scored.reduce((sum, job) => sum + job.qualified, 0);
	const applications = data.reduce((sum, job) => sum + job.total, 0);

	const legend: ChartLegendItem[] = [QUALIFIED, MISSING, ...(data.some((job) => !job.hasRequiredSkills) ? [UNSCORED] : [])].map(
		(item) => ({label: item.label, swatch: {className: item.className}}),
	);

	return (
		<ChartCard
			title="Candidatos por vaga"
			description="Aderência dos candidatos vinculados às competências obrigatórias de cada vaga"
			className={className}
			toolbar={
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
						<p>
							<span className="text-xl font-semibold tabular-nums">{formatNumber(applications)}</span>{" "}
							<span className="text-base-content/60 text-xs">candidatura(s) em {data.length} vaga(s)</span>
						</p>
						{scoredTotal > 0 && (
							<p>
								<span className="text-xl font-semibold tabular-nums">
									{formatPercent(scoredQualified, scoredTotal)}
								</span>{" "}
								<span className="text-base-content/60 text-xs">atendem a todas as obrigatórias</span>
							</p>
						)}
					</div>
					<ChartLegend items={legend} />
				</div>
			}
			empty={
				data.length > 0 ? undefined : (
					<ChartEmpty icon={<RiBriefcase4Line className="size-5" />} title="Nenhuma vaga com candidatos">
						<Link to="/vagas" className="tl-link">
							Vincule candidatos às vagas
						</Link>{" "}
						para comparar a aderência de cada uma.
					</ChartEmpty>
				)
			}
			table={{
				columns: ["Vaga", "Atendem", "Faltam obrigatórias", "Total"],
				rows: data.map((job) =>
					job.hasRequiredSkills ? [job.name, job.qualified, job.missing, job.total] : [job.name, "—", "—", job.total],
				),
			}}
			footer={
				<>
					{emptyJobs.length > 0 ? (
						<p className="text-base-content/60 flex min-w-0 items-center gap-2">
							<span aria-hidden="true" className="bg-warning size-1.5 shrink-0 rounded-full" />
							<span className="min-w-0 truncate">
								<span className="text-base-content font-medium">{emptyJobs.length} vaga(s) sem candidatos</span>
								{": "}
								{emptyJobs.slice(0, VISIBLE_EMPTY_JOBS).map((job, index) => (
									<span key={job.id}>
										{index > 0 && ", "}
										<Link to={`/vagas/${job.id}?secao=candidatos`} className="hover:text-primary hover:underline">
											{job.name}
										</Link>
									</span>
								))}
								{emptyJobs.length > VISIBLE_EMPTY_JOBS && ` e mais ${emptyJobs.length - VISIBLE_EMPTY_JOBS}`}
							</span>
						</p>
					) : (
						<p className="text-base-content/60">
							{data.length > VISIBLE_JOBS
								? `Mostrando ${VISIBLE_JOBS} de ${data.length} vagas com candidatos`
								: "Todas as vagas têm candidatos vinculados"}
						</p>
					)}
					<Link to="/vagas" className="tl-link shrink-0">
						Ver vagas
						<RiArrowRightLine className="size-3.5" />
					</Link>
				</>
			}>
			<ul className="space-y-4">
				{visible.map((job) => (
					<JobRow key={job.id} job={job} max={max} />
				))}
			</ul>
		</ChartCard>
	);
}
