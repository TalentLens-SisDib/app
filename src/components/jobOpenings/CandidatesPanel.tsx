import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {
	RiArrowGoBackLine,
	RiArrowRightLine,
	RiCheckLine,
	RiCloseCircleLine,
	RiCloseLine,
	RiTeamLine,
	RiUserAddLine,
} from "@remixicon/react";
import {Alert, Avatar, Badge, Button, Dialog, Spinner} from "../ui";
import {toast} from "../ui/toastStore";
import LinkCandidatesDialog from "./LinkCandidatesDialog";
import {isApiError} from "../../api/errors";
import {useProfiles} from "../../hooks/useProfiles";
import type {ApplicationStatus, JobApplication} from "../../types/application";
import type {JobOpening} from "../../types/jobOpening";
import type {Profile} from "../../types/profile";
import type {Step} from "../../types/step";
import {
	applicationStage,
	countByStep,
	STATUS_LABEL,
	type ApplicationStage,
	type StageAction,
} from "../../utils/applicationStage";
import {formatDate} from "../../utils/format";
import {matchBehavioralCriteria, type BehavioralMatch} from "../../utils/behavioralMatch";
import {compareMatch, matchSkills, type SkillMatch} from "../../utils/skillMatch";

const GENERIC_UNLINK_ERROR = "Não foi possível desvincular o candidato. Tente novamente.";
const GENERIC_STAGE_ERROR = "Não foi possível atualizar o candidato. Tente novamente.";
const STALE_STAGE_ERROR =
	"O candidato mudou de etapa ou de status desde que a lista foi carregada. A lista foi atualizada; confira e tente de novo.";
const MISSING_STAGE_ERROR =
	"Candidatura não encontrada, ou a API ainda não oferece a mudança de etapa.";

/** `"all"`, `"not-started"`, id de etapa, `"Hired"` ou `"Rejected"`. */
type StageFilter = string;
const ALL = "all";
const NOT_STARTED = "not-started";

export type CandidatesPanelProps = {
	jobOpening: JobOpening;
	canManage: boolean;
	applications: JobApplication[];
	loading: boolean;
	error: string | null;
	reload: () => void;
	link: (profiles: {id: string; name: string}[]) => Promise<unknown>;
	unlink: (profileId: string) => Promise<void>;
	/** Etapas da vaga, em qualquer ordem. */
	steps: Step[];
	advance: (application: JobApplication) => Promise<JobApplication>;
	setStatus: (profileId: string, status: ApplicationStatus) => Promise<JobApplication>;
};

type Row = {
	application: JobApplication;
	profile: Profile | undefined;
	match: SkillMatch;
	behavioralMatch: BehavioralMatch;
	stage: ApplicationStage;
};

type PendingAction = {row: Row; action: StageAction};

/**
 * Candidatos da vaga. As candidaturas vêm da página (que também mostra a
 * contagem na navegação); os perfis são carregados aqui para nome atualizado
 * e aderência às competências.
 */
export default function CandidatesPanel({
	jobOpening,
	canManage,
	applications,
	loading,
	error,
	reload,
	link,
	unlink,
	steps,
	advance,
	setStatus,
}: CandidatesPanelProps): JSX.Element {
	const {profiles, loading: profilesLoading, error: profilesError, reload: reloadProfiles} =
		useProfiles();
	const [linkOpen, setLinkOpen] = useState(false);
	const [linkKey, setLinkKey] = useState(0);
	const [unlinkTarget, setUnlinkTarget] = useState<Row | null>(null);
	const [unlinking, setUnlinking] = useState(false);
	const [pending, setPending] = useState<PendingAction | null>(null);
	const [applying, setApplying] = useState(false);
	const [filter, setFilter] = useState<StageFilter>(ALL);

	const profilesById = useMemo(
		() => new Map(profiles.map((profile) => [profile.id, profile])),
		[profiles],
	);
	const linkedIds = useMemo(
		() => new Set(applications.map((application) => application.profileId)),
		[applications],
	);
	const hasJobSkills = (jobOpening.skills ?? []).length > 0;
	const hasBehavioralCriteria = (jobOpening.culturalFits ?? []).length > 0;

	// Mais aderentes primeiro; reprovados no fim; empate pela candidatura mais recente.
	const rows = useMemo<Row[]>(
		() =>
			applications
				.map((application) => {
					const profile = profilesById.get(application.profileId);
					return {
						application,
						profile,
						match: matchSkills(jobOpening, profile),
						behavioralMatch: matchBehavioralCriteria(jobOpening, profile),
						stage: applicationStage(application, steps),
					};
				})
				.sort(
					(a, b) =>
						Number(a.application.status === "Rejected") -
							Number(b.application.status === "Rejected") ||
						compareMatch(a.match, b.match) ||
						b.application.appliedAt.localeCompare(a.application.appliedAt),
				),
		[applications, profilesById, jobOpening, steps],
	);

	const orderedSteps = useMemo(() => [...steps].sort((a, b) => a.order - b.order), [steps]);
	const funnel = useMemo(() => {
		const counts = countByStep(applications);
		const closed = (status: ApplicationStatus) =>
			applications.filter((application) => application.status === status).length;
		return [
			{key: NOT_STARTED, label: "Não iniciado", count: counts.get(null) ?? 0},
			...orderedSteps.map((step) => ({key: step.id, label: step.name, count: counts.get(step.id) ?? 0})),
			{key: "Hired", label: STATUS_LABEL.Hired, count: closed("Hired")},
			{key: "Rejected", label: STATUS_LABEL.Rejected, count: closed("Rejected")},
		];
	}, [applications, orderedSteps]);

	// Filtro que deixou de existir (etapa removida) volta para "Todos".
	const activeFilter = filter === ALL || funnel.some((item) => item.key === filter) ? filter : ALL;
	const visibleRows = useMemo(() => {
		if (activeFilter === ALL) return rows;
		return rows.filter(({application}) => {
			if (activeFilter === "Hired" || activeFilter === "Rejected") {
				return application.status === activeFilter;
			}
			if (application.status !== "InProgress") return false;
			return (application.currentStep?.id ?? NOT_STARTED) === activeFilter;
		});
	}, [rows, activeFilter]);

	function openLink() {
		setLinkKey((key) => key + 1);
		setLinkOpen(true);
	}

	async function handleLink(selected: Profile[]) {
		await link(selected);
		toast.success(
			selected.length === 1
				? `${selected[0].name} vinculado(a) à vaga`
				: `${selected.length} candidatos vinculados à vaga`,
		);
	}

	async function confirmUnlink() {
		if (!unlinkTarget) return;
		setUnlinking(true);
		try {
			await unlink(unlinkTarget.application.profileId);
			toast.success("Candidato desvinculado da vaga");
			setUnlinkTarget(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_UNLINK_ERROR);
		} finally {
			setUnlinking(false);
		}
	}

	async function confirmAction() {
		if (!pending) return;
		const {row, action} = pending;
		const name = row.profile?.name ?? row.application.profileName;
		setApplying(true);
		try {
			if (action.kind === "advance") {
				await advance(row.application);
				toast.success(`${name} encaminhado(a) para ${action.to.name}`);
			} else {
				const status: ApplicationStatus =
					action.kind === "hire" ? "Hired" : action.kind === "reject" ? "Rejected" : "InProgress";
				await setStatus(row.application.profileId, status);
				toast.success(
					action.kind === "hire"
						? `${name} aprovado(a) no processo`
						: action.kind === "reject"
							? `${name} reprovado(a) no processo`
							: `Candidatura de ${name} reaberta`,
				);
			}
			setPending(null);
		} catch (err) {
			if (isApiError(err) && err.status === 409) {
				toast.error(STALE_STAGE_ERROR);
				setPending(null);
				reload();
			} else if (isApiError(err) && err.status === 404) {
				toast.error(MISSING_STAGE_ERROR);
			} else {
				toast.error(isApiError(err) ? err.message : GENERIC_STAGE_ERROR);
			}
		} finally {
			setApplying(false);
		}
	}

	const anyError = error ?? profilesError;
	const isLoading = loading || profilesLoading;

	return (
		<section aria-labelledby="job-candidates-title" className="space-y-4">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<p className="text-primary text-xs font-semibold tracking-wider uppercase">
						Processo seletivo
					</p>
					<h2 id="job-candidates-title" className="mt-0.5 text-lg font-semibold">
						Candidatos
					</h2>
					{hasJobSkills && rows.length > 0 && (
						<p className="text-base-content/60 mt-1 text-sm">
							Ordenados pela aderência às competências da vaga; reprovados ao final.
						</p>
					)}
				</div>
				{canManage && !isLoading && !anyError && (
					<Button size="sm" className="shrink-0" onClick={openLink}>
						<RiUserAddLine className="size-4" />
						Vincular candidatos
					</Button>
				)}
			</header>

			{anyError ? (
				<Alert variant="error" title="Não foi possível carregar os candidatos">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>{anyError}</span>
						<Button
							size="xs"
							variant="ghost"
							onClick={() => {
								if (error) reload();
								if (profilesError) reloadProfiles();
							}}>
							Tentar novamente
						</Button>
					</div>
				</Alert>
			) : isLoading ? (
				<div className="flex flex-col items-center justify-center gap-3 py-12">
					<Spinner />
					<p className="text-base-content/60 text-sm">Carregando candidatos...</p>
				</div>
			) : rows.length === 0 ? (
				<div className="border-base-300 rounded-box flex flex-col items-center gap-3 border border-dashed px-4 py-10 text-center">
					<span className="bg-base-200 text-base-content/50 grid size-11 place-items-center rounded-full">
						<RiTeamLine className="size-5" />
					</span>
					<div>
						<p className="text-sm font-medium">Nenhum candidato nesta vaga</p>
						<p className="text-base-content/60 mt-1 text-sm">
							Vincule perfis já importados aqui ou direto do resultado da importação de currículos.
						</p>
					</div>
				</div>
			) : (
				<>
					<StageFunnel
						items={funnel}
						total={rows.length}
						active={activeFilter}
						onSelect={(key) => setFilter((current) => (current === key ? ALL : key))}
					/>
					{orderedSteps.length === 0 && canManage && (
						<p className="text-base-content/60 text-sm">
							Cadastre as etapas da vaga para encaminhar os candidatos no processo.
						</p>
					)}
					{visibleRows.length === 0 ? (
						<div className="border-base-300 rounded-box flex flex-col items-center gap-2 border border-dashed px-4 py-8 text-center">
							<p className="text-sm font-medium">Nenhum candidato neste filtro</p>
							<Button size="xs" variant="ghost" onClick={() => setFilter(ALL)}>
								Mostrar todos
							</Button>
						</div>
					) : (
						<ul className="border-base-300 divide-base-300 rounded-box divide-y border">
							{visibleRows.map((row) => (
								<CandidateRow
									key={row.application.profileId}
									row={row}
									showMatch={hasJobSkills}
									showBehavioralMatch={hasBehavioralCriteria}
									canManage={canManage}
									onUnlink={() => setUnlinkTarget(row)}
									onAction={(action) => setPending({row, action})}
								/>
							))}
						</ul>
					)}
				</>
			)}

			<LinkCandidatesDialog
				key={linkKey}
				open={linkOpen}
				onClose={() => setLinkOpen(false)}
				jobOpening={jobOpening}
				profiles={profiles}
				linkedIds={linkedIds}
				onSubmit={handleLink}
			/>

			<StageActionDialog
				pending={pending}
				jobName={jobOpening.name}
				applying={applying}
				onCancel={() => !applying && setPending(null)}
				onConfirm={confirmAction}
			/>

			<Dialog
				open={unlinkTarget !== null}
				onClose={() => !unlinking && setUnlinkTarget(null)}
				title="Desvincular candidato?"
				actions={
					<>
						<Button variant="ghost" disabled={unlinking} onClick={() => setUnlinkTarget(null)}>
							Cancelar
						</Button>
						<Button variant="error" loading={unlinking} onClick={confirmUnlink}>
							Desvincular
						</Button>
					</>
				}>
				<p>
					<strong>{unlinkTarget?.profile?.name ?? unlinkTarget?.application.profileName}</strong>{" "}
					deixará de concorrer à vaga <strong>{jobOpening.name}</strong>. O perfil do candidato
					continua cadastrado.
				</p>
			</Dialog>
		</section>
	);
}

type CandidateRowProps = {
	row: Row;
	showMatch: boolean;
	showBehavioralMatch: boolean;
	canManage: boolean;
	onUnlink: () => void;
	onAction: (action: StageAction) => void;
};

function CandidateRow({
	row,
	showMatch,
	showBehavioralMatch,
	canManage,
	onUnlink,
	onAction,
}: CandidateRowProps): JSX.Element {
	const {application, profile, match, behavioralMatch, stage} = row;
	const name = profile?.name ?? application.profileName;
	const allRequired = match.requiredTotal > 0 && match.requiredMatched === match.requiredTotal;

	return (
		<li className="flex items-start gap-3 px-4 py-3">
			<Avatar name={name} />

			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<p className="truncate text-sm font-medium">
						{profile ? (
							<Link to={`/candidatos/${profile.id}`} className="hover:text-primary hover:underline">
								{name}
							</Link>
						) : name}
					</p>
					{showMatch && match.requiredTotal > 0 && (
						<Badge size="xs" variant={allRequired ? "success" : match.requiredMatched > 0 ? "warning" : "ghost"}>
							{match.requiredMatched}/{match.requiredTotal} obrigatórias
						</Badge>
					)}
					{showMatch && match.desiredTotal > 0 && (
						<Badge size="xs" variant="ghost">
							{match.desiredMatched}/{match.desiredTotal} desejáveis
						</Badge>
					)}
				</div>
				<p className="text-base-content/55 mt-0.5 text-xs">
					Vinculado em {formatDate(application.appliedAt)}
					{!profile && " · perfil não encontrado"}
				</p>
				<StageSummary application={application} stage={stage} />
				{showMatch && match.missingRequired.length > 0 && (
					<p className="text-base-content/60 mt-1 text-xs">
						Faltam: {match.missingRequired.join(", ")}
					</p>
				)}
				{showBehavioralMatch && (
					<details className="bg-base-200 rounded-field mt-3 px-3 py-2.5">
						<summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-medium">
							<span>Aderência comportamental</span>
							{profile ? (
								<span className="text-base-content/60 text-xs font-normal">
									{[
										behavioralMatch.requiredTotal > 0 &&
											`${behavioralMatch.requiredMatched}/${behavioralMatch.requiredTotal} obrigatórias`,
										behavioralMatch.desiredTotal > 0 &&
											`${behavioralMatch.desiredMatched}/${behavioralMatch.desiredTotal} desejáveis`,
									]
										.filter(Boolean)
										.join(" · ")}
								</span>
							) : (
								<span className="text-base-content/60 text-xs font-normal">Perfil indisponível</span>
							)}
						</summary>
						<div className="mt-3 space-y-3">
							<p className="text-base-content/60 text-xs leading-5">
								A comparação usa características registradas no perfil. Ela não representa uma nota
								ou uma avaliação gerada a partir da entrevista.
							</p>
							{profile ? (
								<ul className="space-y-2">
									{behavioralMatch.criteria.map((criterion) => (
										<li
											key={criterion.id}
											className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
											<span className="min-w-0 flex-1 break-words">{criterion.name}</span>
											<span className="flex flex-wrap items-center gap-1.5">
												<Badge size="xs" variant={criterion.isRequired ? "secondary" : "ghost"}>
													{criterion.isRequired ? "Obrigatória" : "Desejável"}
												</Badge>
												<Badge size="xs" variant={criterion.matched === true ? "success" : "ghost"}>
													{criterion.matched === true ? "Consta no perfil" : "Não consta no perfil"}
												</Badge>
											</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-base-content/60 text-xs">Não foi possível comparar sem o perfil do candidato.</p>
							)}
						</div>
					</details>
				)}
				{canManage && (stage.primary || stage.secondary) && (
					<div className="mt-3 flex flex-wrap items-center gap-2">
						{stage.primary && <StageActionButton action={stage.primary} onClick={onAction} primary />}
						{stage.secondary && <StageActionButton action={stage.secondary} onClick={onAction} />}
					</div>
				)}
			</div>

			{canManage && (
				<button
					type="button"
					aria-label={`Desvincular ${name}`}
					onClick={onUnlink}
					className="btn btn-ghost btn-sm btn-square -mr-2 shrink-0">
					<RiCloseLine className="size-4" />
				</button>
			)}
		</li>
	);
}

const STATUS_BADGE: Record<ApplicationStatus, "info" | "success" | "error"> = {
	InProgress: "info",
	Hired: "success",
	Rejected: "error",
};

function StageSummary({
	application,
	stage,
}: {
	application: JobApplication;
	stage: ApplicationStage;
}): JSX.Element {
	const stepLabel = stage.current
		? stage.total > 0
			? `Etapa ${stage.position} de ${stage.total} · ${stage.current.name}`
			: stage.current.name
		: "Ainda não iniciou as etapas";

	return (
		<div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
			<Badge size="xs" variant={STATUS_BADGE[application.status]}>
				{STATUS_LABEL[application.status]}
			</Badge>
			<span className="text-base-content/70">{stepLabel}</span>
			{application.stageUpdatedAt !== application.appliedAt && (
				<span className="text-base-content/50">
					· atualizado em {formatDate(application.stageUpdatedAt)}
				</span>
			)}
		</div>
	);
}

function actionLabel(action: StageAction): string {
	switch (action.kind) {
		case "advance":
			return action.from ? `Encaminhar para ${action.to.name}` : `Iniciar em ${action.to.name}`;
		case "hire":
			return "Aprovar candidato";
		case "reject":
			return "Reprovar";
		case "reopen":
			return "Reabrir candidatura";
	}
}

function StageActionButton({
	action,
	onClick,
	primary = false,
}: {
	action: StageAction;
	onClick: (action: StageAction) => void;
	primary?: boolean;
}): JSX.Element {
	const icon =
		action.kind === "advance" ? (
			<RiArrowRightLine className="size-4" />
		) : action.kind === "hire" ? (
			<RiCheckLine className="size-4" />
		) : action.kind === "reject" ? (
			<RiCloseCircleLine className="size-4" />
		) : (
			<RiArrowGoBackLine className="size-4" />
		);

	return (
		<Button
			size="xs"
			variant={primary ? (action.kind === "hire" ? "success" : "primary") : "ghost"}
			onClick={() => onClick(action)}>
			{icon}
			{actionLabel(action)}
		</Button>
	);
}

type FunnelItem = {key: string; label: string; count: number};

/** Contagem por etapa; clicar filtra a lista (clicar de novo limpa). */
function StageFunnel({
	items,
	total,
	active,
	onSelect,
}: {
	items: FunnelItem[];
	total: number;
	active: StageFilter;
	onSelect: (key: StageFilter) => void;
}): JSX.Element {
	const chip = (key: string, label: string, count: number) => {
		const selected = active === key;
		return (
			<li key={key}>
				<button
					type="button"
					aria-pressed={selected}
					onClick={() => onSelect(key)}
					className={`rounded-field flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors ${
						selected
							? "border-primary bg-primary/8 text-primary"
							: "border-base-300 text-base-content/70 hover:border-base-content/30"
					}`}>
					<span className="max-w-40 truncate">{label}</span>
					<span className="font-semibold tabular-nums">{count}</span>
				</button>
			</li>
		);
	};

	return (
		<nav aria-label="Candidatos por etapa">
			<ul className="flex flex-wrap items-center gap-1.5">
				{chip(ALL, "Todos", total)}
				{items.map((item) => chip(item.key, item.label, item.count))}
			</ul>
		</nav>
	);
}

function StageActionDialog({
	pending,
	jobName,
	applying,
	onCancel,
	onConfirm,
}: {
	pending: PendingAction | null;
	jobName: string;
	applying: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}): JSX.Element {
	const action = pending?.action;
	const name = pending ? (pending.row.profile?.name ?? pending.row.application.profileName) : "";

	const title =
		action?.kind === "advance"
			? "Encaminhar candidato?"
			: action?.kind === "hire"
				? "Aprovar candidato?"
				: action?.kind === "reject"
					? "Reprovar candidato?"
					: "Reabrir candidatura?";

	const confirmLabel =
		action?.kind === "advance"
			? "Encaminhar"
			: action?.kind === "hire"
				? "Aprovar"
				: action?.kind === "reject"
					? "Reprovar"
					: "Reabrir";

	return (
		<Dialog
			open={pending !== null}
			onClose={onCancel}
			title={title}
			actions={
				<>
					<Button variant="ghost" disabled={applying} onClick={onCancel}>
						Cancelar
					</Button>
					<Button
						variant={action?.kind === "reject" ? "error" : action?.kind === "hire" ? "success" : "primary"}
						loading={applying}
						onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</>
			}>
			{action?.kind === "advance" && (
				<div className="space-y-3">
					<p>
						<strong>{name}</strong> passará para a próxima etapa da vaga <strong>{jobName}</strong>.
					</p>
					<div className="bg-base-200 rounded-field flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
						<span className="text-base-content/70">{action.from?.name ?? "Não iniciado"}</span>
						<RiArrowRightLine className="text-base-content/50 size-4" aria-hidden />
						<span className="font-medium">{action.to.name}</span>
					</div>
				</div>
			)}
			{action?.kind === "hire" && (
				<p>
					<strong>{name}</strong> concluiu a última etapa ({action.at.name}) e será marcado(a) como
					aprovado(a) na vaga <strong>{jobName}</strong>.
				</p>
			)}
			{action?.kind === "reject" && (
				<p>
					<strong>{name}</strong> deixará de avançar na vaga <strong>{jobName}</strong>. A etapa atual
					fica registrada e a candidatura pode ser reaberta depois.
				</p>
			)}
			{action?.kind === "reopen" && (
				<p>
					A candidatura de <strong>{name}</strong> volta para <em>Em andamento</em>, na mesma etapa em
					que estava.
				</p>
			)}
		</Dialog>
	);
}
