import {useMemo, type JSX} from "react";
import {Link} from "react-router-dom";
import {
	RiArrowDownLine,
	RiArrowUpLine,
	RiBriefcase4Line,
	RiChat3Line,
	RiSubtractLine,
	RiTeamLine,
	RiUploadCloud2Line,
	RiUserUnfollowLine,
} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import ActivityChart from "../components/dashboard/ActivityChart";
import JobPipelineChart from "../components/dashboard/JobPipelineChart";
import Meter from "../components/dashboard/Meter";
import RecentCandidates from "../components/dashboard/RecentCandidates";
import SkillCoverageChart from "../components/dashboard/SkillCoverageChart";
import Sparkline from "../components/dashboard/Sparkline";
import StatTile, {type Tone} from "../components/dashboard/StatTile";
import {formatNumber, formatPercent} from "../components/dashboard/chartTheme";
import {Alert, Button} from "../components/ui";
import {useDashboardData} from "../hooks/useDashboardData";
import {
	WINDOW_DAYS,
	buildActivity,
	buildJobPipelines,
	buildOverview,
	buildSkillCoverage,
	findEmptyJobs,
	latestProfiles,
	type PeriodCount,
} from "../utils/dashboardMetrics";

/** Mais é melhor (candidatos, entrevistas): alta = positivo, queda = atenção. */
function deltaChip({current, previous}: PeriodCount): {tone: Tone; label: string; icon: JSX.Element} {
	const delta = current - previous;
	if (delta > 0) {
		return {tone: "ok", label: `+${formatNumber(delta)}`, icon: <RiArrowUpLine aria-hidden="true" className="size-3" />};
	}
	if (delta < 0) {
		return {
			tone: "attn",
			label: `−${formatNumber(Math.abs(delta))}`,
			icon: <RiArrowDownLine aria-hidden="true" className="size-3" />,
		};
	}
	return {tone: "neutral", label: "Sem variação", icon: <RiSubtractLine aria-hidden="true" className="size-3" />};
}

function todayLabel(): string {
	const label = new Date().toLocaleDateString("pt-BR", {weekday: "long", day: "numeric", month: "long"});
	return label.charAt(0).toUpperCase() + label.slice(1);
}

function DashboardSkeleton(): JSX.Element {
	return (
		<div aria-busy="true" aria-label="Carregando indicadores" className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({length: 4}, (_, index) => (
					<div key={index} className="tl-panel h-44 gap-4 p-5">
						<div className="skeleton h-4 w-24" />
						<div className="skeleton h-8 w-16" />
						<div className="skeleton mt-auto h-3 w-full" />
					</div>
				))}
			</div>
			<div className="grid gap-4 lg:grid-cols-3">
				<div className="tl-panel skeleton h-96 lg:col-span-2" />
				<div className="tl-panel skeleton h-96" />
			</div>
		</div>
	);
}

export default function Dashboard(): JSX.Element {
	const {profiles, jobOpenings, loading, error, reload} = useDashboardData();

	const metrics = useMemo(
		() => ({
			overview: buildOverview(profiles, jobOpenings),
			activity: buildActivity(profiles),
			pipelines: buildJobPipelines(profiles, jobOpenings),
			skills: buildSkillCoverage(profiles, jobOpenings),
			emptyJobs: findEmptyJobs(profiles, jobOpenings),
			latest: latestProfiles(profiles),
			jobIds: new Set(jobOpenings.map((job) => job.id)),
		}),
		[profiles, jobOpenings],
	);
	const {overview} = metrics;
	const jobsWithCandidates = overview.jobOpenings - metrics.emptyJobs.length;

	return (
		<>
			<PageHeader
				eyebrow={todayLabel()}
				title="Dashboard"
				description="Panorama do recrutamento: banco de talentos, vagas em andamento e ritmo das entrevistas."
				actions={
					<Link to="/candidatos/importar" className="btn btn-primary btn-sm h-9 gap-2 px-4">
						<RiUploadCloud2Line className="size-4" />
						Importar currículos
					</Link>
				}
			/>

			{error ? (
				<Alert variant="error" title="Não foi possível carregar o dashboard">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>{error}</span>
						<Button size="xs" variant="ghost" onClick={reload}>
							Tentar novamente
						</Button>
					</div>
				</Alert>
			) : loading ? (
				<DashboardSkeleton />
			) : (
				<div className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<StatTile
							label="Candidatos"
							value={formatNumber(overview.candidates)}
							icon={<RiTeamLine className="size-4" />}
							visual={
								<Sparkline
									values={metrics.activity.map((week) => week.candidates)}
									label="Novos candidatos por semana, últimas 12 semanas"
									className="text-primary"
								/>
							}
							chip={deltaChip(overview.newCandidates)}
							chipCaption={`vs. ${WINDOW_DAYS} dias anteriores`}
							detail={`${formatNumber(overview.newCandidates.current)} novo(s) nos últimos ${WINDOW_DAYS} dias`}
							href="/candidatos"
						/>
						<StatTile
							label="Vagas"
							value={formatNumber(overview.jobOpenings)}
							icon={<RiBriefcase4Line className="size-4" />}
							visual={
								overview.jobOpenings > 0 ? (
									<Meter
										value={jobsWithCandidates}
										total={overview.jobOpenings}
										fillClassName="bg-primary"
										label="Vagas com candidatos vinculados"
									/>
								) : undefined
							}
							chip={
								overview.jobOpenings === 0
									? {tone: "neutral", label: "Nenhuma vaga"}
									: metrics.emptyJobs.length > 0
										? {tone: "attn", label: `${metrics.emptyJobs.length} sem candidatos`}
										: {tone: "ok", label: "Todas com candidatos"}
							}
							detail={
								overview.jobOpenings > 0
									? `${formatNumber(overview.applications)} candidatura(s) · média de ${(
											overview.applications / overview.jobOpenings
										).toLocaleString("pt-BR", {maximumFractionDigits: 1})} por vaga`
									: "Crie uma vaga para começar o processo"
							}
							href="/vagas"
						/>
						<StatTile
							label={`Entrevistas · ${WINDOW_DAYS} dias`}
							value={formatNumber(overview.recentInterviews.current)}
							icon={<RiChat3Line className="size-4" />}
							visual={
								<Sparkline
									values={metrics.activity.map((week) => week.interviews)}
									label="Entrevistas por semana, últimas 12 semanas"
									className="text-accent"
								/>
							}
							chip={deltaChip(overview.recentInterviews)}
							chipCaption={`vs. ${WINDOW_DAYS} dias anteriores`}
							detail={`${formatNumber(overview.interviews)} entrevista(s) registradas no total`}
						/>
						<StatTile
							label="Candidatos sem vaga"
							value={formatNumber(overview.unlinkedCandidates)}
							icon={<RiUserUnfollowLine className="size-4" />}
							visual={
								overview.candidates > 0 ? (
									<Meter
										value={overview.unlinkedCandidates}
										total={overview.candidates}
										fillClassName="bg-warning"
										label="Candidatos sem vaga no banco de talentos"
									/>
								) : undefined
							}
							chip={
								overview.candidates === 0
									? {tone: "neutral", label: "Sem candidatos"}
									: overview.unlinkedCandidates > 0
										? {tone: "attn", label: `${formatPercent(overview.unlinkedCandidates, overview.candidates)} do banco`}
										: {tone: "ok", label: "Todos vinculados"}
							}
							detail="Perfis que ainda não participam de nenhum processo seletivo"
						/>
					</div>

					<div className="grid gap-4 lg:grid-cols-3">
						<ActivityChart data={metrics.activity} className="lg:col-span-2" />
						<RecentCandidates
							profiles={metrics.latest}
							total={overview.candidates}
							jobIds={metrics.jobIds}
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<JobPipelineChart data={metrics.pipelines} emptyJobs={metrics.emptyJobs} />
						<SkillCoverageChart data={metrics.skills} totalCandidates={overview.candidates} />
					</div>
				</div>
			)}
		</>
	);
}
