import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiCloseLine, RiTeamLine, RiUserAddLine} from "@remixicon/react";
import {Alert, Badge, Button, Dialog, Spinner} from "../ui";
import {toast} from "../ui/toastStore";
import LinkCandidatesDialog from "./LinkCandidatesDialog";
import {isApiError} from "../../api/errors";
import {useProfiles} from "../../hooks/useProfiles";
import type {JobApplication} from "../../types/application";
import type {JobOpening} from "../../types/jobOpening";
import type {Profile} from "../../types/profile";
import {formatDate} from "../../utils/format";
import {compareMatch, matchSkills, type SkillMatch} from "../../utils/skillMatch";

const GENERIC_UNLINK_ERROR = "Não foi possível desvincular o candidato. Tente novamente.";

export type CandidatesPanelProps = {
	jobOpening: JobOpening;
	canManage: boolean;
	applications: JobApplication[];
	loading: boolean;
	error: string | null;
	reload: () => void;
	link: (profiles: {id: string; name: string}[]) => Promise<unknown>;
	unlink: (profileId: string) => Promise<void>;
};

type Row = {application: JobApplication; profile: Profile | undefined; match: SkillMatch};

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
}: CandidatesPanelProps): JSX.Element {
	const {profiles, loading: profilesLoading, error: profilesError, reload: reloadProfiles} =
		useProfiles();
	const [linkOpen, setLinkOpen] = useState(false);
	const [linkKey, setLinkKey] = useState(0);
	const [unlinkTarget, setUnlinkTarget] = useState<Row | null>(null);
	const [unlinking, setUnlinking] = useState(false);

	const profilesById = useMemo(
		() => new Map(profiles.map((profile) => [profile.id, profile])),
		[profiles],
	);
	const linkedIds = useMemo(
		() => new Set(applications.map((application) => application.profileId)),
		[applications],
	);
	const hasJobSkills = (jobOpening.skills ?? []).length > 0;

	// Mais aderentes primeiro; empate pela candidatura mais recente.
	const rows = useMemo<Row[]>(
		() =>
			applications
				.map((application) => {
					const profile = profilesById.get(application.profileId);
					return {application, profile, match: matchSkills(jobOpening, profile)};
				})
				.sort(
					(a, b) =>
						compareMatch(a.match, b.match) ||
						b.application.appliedAt.localeCompare(a.application.appliedAt),
				),
		[applications, profilesById, jobOpening],
	);

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
							Ordenados pela aderência às competências da vaga.
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
				<ul className="border-base-300 divide-base-300 rounded-box divide-y border">
					{rows.map((row) => (
						<CandidateRow
							key={row.application.profileId}
							row={row}
							showMatch={hasJobSkills}
							canManage={canManage}
							onUnlink={() => setUnlinkTarget(row)}
						/>
					))}
				</ul>
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
	canManage: boolean;
	onUnlink: () => void;
};

function CandidateRow({row, showMatch, canManage, onUnlink}: CandidateRowProps): JSX.Element {
	const {application, profile, match} = row;
	const name = profile?.name ?? application.profileName;
	const allRequired = match.requiredTotal > 0 && match.requiredMatched === match.requiredTotal;

	return (
		<li className="flex items-start gap-3 px-4 py-3">
			<span
				aria-hidden="true"
				className="bg-base-200 text-base-content/70 grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold">
				{name.trim().charAt(0).toUpperCase() || "?"}
			</span>

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
				{showMatch && match.missingRequired.length > 0 && (
					<p className="text-base-content/60 mt-1 text-xs">
						Faltam: {match.missingRequired.join(", ")}
					</p>
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
