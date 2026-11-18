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
import {Alert, Avatar, Badge, Button, Dialog, Select, Spinner, Textarea} from "../ui";
import {toast} from "../ui/toastStore";
import LinkCandidatesDialog from "./LinkCandidatesDialog";
import {isApiError} from "../../api/errors";
import {useProfiles} from "../../hooks/useProfiles";
import type {ApplicationStatus, JobApplication, UpdateApplicationStatusInput} from "../../types/application";
import type {JobOpening} from "../../types/jobOpening";
import type {Profile} from "../../types/profile";
import type {Step} from "../../types/step";
import {formatDate} from "../../utils/format";
import {prioritizeCandidates, type PrioritizedCandidate} from "../../utils/candidatePrioritization";
import {applicationStage, countByStep, STATUS_LABEL, type StageAction} from "../../utils/applicationStage";
import {
	CLOSURE_NOTES_MAX,
	CLOSURE_REASON_LABEL,
	CLOSURE_REASONS,
	validateClosureForm,
	type ClosureForm,
	type ClosureFormErrors,
} from "../../utils/applicationClosure";

const GENERIC_UNLINK_ERROR = "Não foi possível desvincular o candidato. Tente novamente.";
const GENERIC_STAGE_ERROR = "Não foi possível atualizar o candidato. Tente novamente.";

export type CandidatesPanelProps = {
	jobOpening: JobOpening;
	canManage: boolean;
	applications: JobApplication[];
	loading: boolean;
	error: string | null;
	reload: () => void;
	link: (profiles: {id: string; name: string}[]) => Promise<unknown>;
	unlink: (profileId: string) => Promise<void>;
	steps: Step[];
	advance: (application: JobApplication) => Promise<JobApplication>;
	setStatus: (profileId: string, data: UpdateApplicationStatusInput) => Promise<JobApplication>;
};

/** `"all"`, `"not-started"`, id de etapa, `"Hired"` ou `"Rejected"`. */
type StageFilter = string;
const ALL = "all";
const NOT_STARTED = "not-started";

type Row = PrioritizedCandidate;
type PendingAction = {row: Row; action: StageAction};

const EMPTY_CLOSURE_FORM: ClosureForm = {reason: "", notes: ""};

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
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
	const [applying, setApplying] = useState(false);
	const [closureForm, setClosureForm] = useState<ClosureForm>(EMPTY_CLOSURE_FORM);
	const [closureErrors, setClosureErrors] = useState<ClosureFormErrors>({});
	const [filter, setFilter] = useState<StageFilter>(ALL);

	const linkedIds = useMemo(
		() => new Set(applications.map((application) => application.profileId)),
		[applications],
	);
	const hasJobSkills = (jobOpening.skills ?? []).length > 0;
	const hasBehavioralCriteria = (jobOpening.culturalFits ?? []).length > 0;

	const prioritization = useMemo(
		() => prioritizeCandidates(jobOpening, applications, profiles),
		[applications, profiles, jobOpening],
	);
	// Encerrados vão para o fim, mantendo a ordem de prioridade entre os demais.
	const rows = useMemo(
		() => [
			...prioritization.rows.filter((row) => row.application.status !== "Rejected"),
			...prioritization.rows.filter((row) => row.application.status === "Rejected"),
		],
		[prioritization],
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
	// Se a etapa filtrada foi removida, volta para "Todos".
	const activeFilter = filter === ALL || funnel.some((item) => item.key === filter) ? filter : ALL;
	const visibleRows = useMemo(() => {
		if (activeFilter === ALL) return rows;
		return rows.filter(({application}) => {
			if (activeFilter === "Hired" || activeFilter === "Rejected") return application.status === activeFilter;
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

	function openStageAction(row: Row, action: StageAction) {
		setClosureForm(EMPTY_CLOSURE_FORM);
		setClosureErrors({});
		setPendingAction({row, action});
	}

	function changeClosureForm(patch: Partial<ClosureForm>) {
		setClosureForm((current) => ({...current, ...patch}));
		// Limpa o erro do campo editado; os demais continuam até o próximo envio.
		setClosureErrors((current) => {
			const next = {...current};
			for (const key of Object.keys(patch) as (keyof ClosureForm)[]) delete next[key];
			// Trocar o motivo pode tornar as observações (des)obrigatórias.
			if ("reason" in patch) delete next.notes;
			return next;
		});
	}

	async function confirmStageAction() {
		if (!pendingAction) return;
		const {row, action} = pendingAction;
		const name = row.profile?.name ?? row.application.profileName;

		let closureData: UpdateApplicationStatusInput | null = null;
		if (action.kind === "reject") {
			const result = validateClosureForm(closureForm);
			if (!result.ok) {
				setClosureErrors(result.errors);
				return;
			}
			closureData = {status: "Rejected", closure: result.closure};
		}

		setApplying(true);
		try {
			if (action.kind === "advance") {
				await advance(row.application);
				toast.success(`${name} encaminhado(a) para ${action.to.name}`);
			} else if (closureData) {
				await setStatus(row.application.profileId, closureData);
				toast.success(`Avaliação de ${name} encerrada`);
			} else {
				const hire = action.kind === "hire";
				await setStatus(row.application.profileId, {status: hire ? "Hired" : "InProgress"});
				toast.success(hire ? `${name} aprovado(a) no processo` : `Candidatura de ${name} reaberta`);
			}
			setPendingAction(null);
		} catch (err) {
			if (isApiError(err) && err.status === 409) {
				toast.error("O candidato mudou desde que a lista foi carregada. Confira a situação atual e tente de novo.");
				setPendingAction(null);
				reload();
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
					{rows.length > 0 && (
						<p className="text-base-content/60 mt-1 text-sm">
							{prioritization.hasCriteria
								? "Ordem: competências obrigatórias, critérios comportamentais obrigatórios, competências desejáveis e critérios comportamentais desejáveis; empates pela candidatura mais recente. Encerrados ficam no fim."
								: "A vaga não tem critérios de avaliação; candidatos em ordem de inscrição, encerrados no fim."}
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
									showPriority={prioritization.hasCriteria}
									canManage={canManage}
									steps={steps}
									onAction={(action) => openStageAction(row, action)}
									onUnlink={() => setUnlinkTarget(row)}
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
				pending={pendingAction}
				jobName={jobOpening.name}
				applying={applying}
				closureForm={closureForm}
				closureErrors={closureErrors}
				onClosureChange={changeClosureForm}
				onCancel={() => !applying && setPendingAction(null)}
				onConfirm={confirmStageAction}
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
	showPriority: boolean;
	canManage: boolean;
	steps: Step[];
	onAction: (action: StageAction) => void;
	onUnlink: () => void;
};

function CandidateRow({row, showMatch, showBehavioralMatch, showPriority, canManage, steps, onAction, onUnlink}: CandidateRowProps): JSX.Element {
	const {application, profile, skillMatch: match, behavioralMatch, priority} = row;
	const name = profile?.name ?? application.profileName;
	const displayedPriority = application.priority === undefined ? priority : application.priority;
	const stage = applicationStage(application, steps);
	const allRequired = match.requiredTotal > 0 && match.requiredMatched === match.requiredTotal;
	const allRequiredBehavioral =
		behavioralMatch.requiredTotal > 0 && behavioralMatch.requiredMatched === behavioralMatch.requiredTotal;

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
					{showPriority && displayedPriority !== null && (
						<Badge size="xs" variant="primary">
							Prioridade {displayedPriority}
						</Badge>
					)}
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
					{showBehavioralMatch && profile && behavioralMatch.requiredTotal > 0 && (
						<Badge
							size="xs"
							variant={allRequiredBehavioral ? "success" : behavioralMatch.requiredMatched > 0 ? "warning" : "ghost"}>
							{behavioralMatch.requiredMatched}/{behavioralMatch.requiredTotal} comportamentais obrigatórias
						</Badge>
					)}
					{showBehavioralMatch && profile && behavioralMatch.desiredTotal > 0 && (
						<Badge size="xs" variant="ghost">
							{behavioralMatch.desiredMatched}/{behavioralMatch.desiredTotal} comportamentais desejáveis
						</Badge>
					)}
				</div>
				<p className="text-base-content/55 mt-0.5 text-xs">
					Vinculado em {formatDate(application.appliedAt)}
					{!profile && " · perfil não encontrado"}
				</p>
				<div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
					<Badge size="xs" variant={application.status === "Hired" ? "success" : application.status === "Rejected" ? "error" : "info"}>
						{STATUS_LABEL[application.status]}
					</Badge>
					<span className="text-base-content/70">
						{stage.current
							? `Etapa ${stage.position} de ${stage.total} · ${stage.current.name}`
							: "Ainda não iniciou as etapas"}
					</span>
					{application.stageUpdatedAt !== application.appliedAt && (
						<span className="text-base-content/50">· atualizado em {formatDate(application.stageUpdatedAt)}</span>
					)}
				</div>
				{application.status === "Rejected" && application.closure && (
					<ClosureSummary closure={application.closure} />
				)}
				{canManage && (stage.primary || stage.secondary) && (
					<div className="mt-3 flex flex-wrap items-center gap-2">
						{stage.primary && (
							<Button size="sm" onClick={() => onAction(stage.primary!)}>
								{stage.primary.kind === "advance" ? <RiArrowRightLine className="size-4" /> : <RiCheckLine className="size-4" />}
								{actionLabel(stage.primary)}
							</Button>
						)}
						{stage.secondary && (
							<Button
								size="sm"
								variant={stage.secondary.kind === "reject" ? "error" : "ghost"}
								onClick={() => onAction(stage.secondary)}>
								{stage.secondary.kind === "reject" ? <RiCloseCircleLine className="size-4" /> : <RiArrowGoBackLine className="size-4" />}
								{actionLabel(stage.secondary)}
							</Button>
						)}
					</div>
				)}
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

function actionLabel(action: StageAction): string {
	switch (action.kind) {
		case "advance":
			return action.from ? `Encaminhar para ${action.to.name}` : `Iniciar em ${action.to.name}`;
		case "hire":
			return "Aprovar candidato";
		case "reject":
			return "Encerrar avaliação";
		case "reopen":
			return "Reabrir candidatura";
	}
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

function ClosureSummary({closure}: {closure: NonNullable<JobApplication["closure"]>}): JSX.Element {
	return (
		<div className="bg-base-200 rounded-field mt-2 px-3 py-2 text-xs">
			<p>
				<span className="text-base-content/60">Motivo: </span>
				<span className="font-medium">{CLOSURE_REASON_LABEL[closure.reason] ?? closure.reason}</span>
			</p>
			{closure.notes && <p className="text-base-content/80 mt-1 break-words whitespace-pre-line">{closure.notes}</p>}
			<p className="text-base-content/50 mt-1">
				Encerrada em {formatDate(closure.closedAt)}
				{closure.closedBy?.name && ` por ${closure.closedBy.name}`}
			</p>
		</div>
	);
}

function StageActionDialog({
	pending,
	jobName,
	applying,
	closureForm,
	closureErrors,
	onClosureChange,
	onCancel,
	onConfirm,
}: {
	pending: PendingAction | null;
	jobName: string;
	applying: boolean;
	closureForm: ClosureForm;
	closureErrors: ClosureFormErrors;
	onClosureChange: (patch: Partial<ClosureForm>) => void;
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
					? "Encerrar avaliação?"
					: "Reabrir candidatura?";

	const confirmLabel =
		action?.kind === "advance"
			? "Encaminhar"
			: action?.kind === "hire"
				? "Aprovar"
				: action?.kind === "reject"
					? "Encerrar avaliação"
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
				<form
					noValidate
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (!applying) onConfirm();
					}}>
					<p>
						<strong>{name}</strong> deixará de avançar na vaga <strong>{jobName}</strong>. A etapa atual
						e o motivo ficam registrados, e a candidatura pode ser reaberta depois.
					</p>
					<Select
						label="Motivo do encerramento"
						required
						value={closureForm.reason}
						error={closureErrors.reason}
						disabled={applying}
						onChange={(event) => onClosureChange({reason: event.target.value as ClosureForm["reason"]})}>
						<option value="" disabled>
							Selecione um motivo
						</option>
						{CLOSURE_REASONS.map((reason) => (
							<option key={reason} value={reason}>
								{CLOSURE_REASON_LABEL[reason]}
							</option>
						))}
					</Select>
					<Textarea
						label="Observações"
						required={closureForm.reason === "Other"}
						rows={4}
						maxLength={CLOSURE_NOTES_MAX}
						value={closureForm.notes}
						error={closureErrors.notes}
						disabled={applying}
						placeholder="Detalhes que ajudem a equipe a entender a decisão"
						helperText={`${closureForm.notes.length}/${CLOSURE_NOTES_MAX} caracteres${
							closureForm.reason === "Other" ? "" : " · opcional"
						}`}
						onChange={(event) => onClosureChange({notes: event.target.value})}
					/>
				</form>
			)}
			{action?.kind === "reopen" && (
				<p>
					A candidatura de <strong>{name}</strong> volta para <em>Em andamento</em>, na mesma etapa em
					que estava.
					{pending?.row.application.closure && " O motivo do encerramento registrado será removido."}
				</p>
			)}
		</Dialog>
	);
}
