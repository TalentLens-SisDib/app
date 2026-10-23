import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiSearchLine, RiTeamLine} from "@remixicon/react";
import {Alert, Button, Dialog} from "../ui";
import {isApiError} from "../../api/errors";
import type {JobOpening} from "../../types/jobOpening";
import type {Profile} from "../../types/profile";
import {compareMatch, matchSkills} from "../../utils/skillMatch";

const GENERIC_ERROR = "Não foi possível vincular os candidatos. Tente novamente.";

export type LinkCandidatesDialogProps = {
	open: boolean;
	onClose: () => void;
	jobOpening: JobOpening;
	profiles: Profile[];
	/** Perfis já vinculados — não aparecem como opção. */
	linkedIds: Set<string>;
	onSubmit: (profiles: Profile[]) => Promise<unknown>;
};

/**
 * Seleção de perfis já importados para vincular à vaga. Os mais aderentes
 * às competências da vaga aparecem primeiro. Estado inicializado na
 * montagem — quem abre troca a `key`.
 */
export default function LinkCandidatesDialog({
	open,
	onClose,
	jobOpening,
	profiles,
	linkedIds,
	onSubmit,
}: LinkCandidatesDialogProps): JSX.Element {
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const hasJobSkills = (jobOpening.skills ?? []).length > 0;

	const available = useMemo(
		() =>
			profiles
				.filter((profile) => !linkedIds.has(profile.id))
				.map((profile) => ({profile, match: matchSkills(jobOpening, profile)}))
				.sort((a, b) => compareMatch(a.match, b.match) || a.profile.name.localeCompare(b.profile.name, "pt-BR")),
		[profiles, linkedIds, jobOpening],
	);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return available;
		return available.filter(
			({profile}) =>
				profile.name.toLowerCase().includes(term) ||
				profile.skills?.some((skill) => skill.skillName.toLowerCase().includes(term)),
		);
	}, [available, search]);

	function close() {
		if (!submitting) onClose();
	}

	function toggle(profileId: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(profileId)) next.delete(profileId);
			else next.add(profileId);
			return next;
		});
	}

	async function handleSubmit() {
		if (selected.size === 0 || submitting) return;
		setSubmitting(true);
		setFormError(null);
		try {
			await onSubmit(profiles.filter((profile) => selected.has(profile.id)));
			onClose();
		} catch (err) {
			setFormError(isApiError(err) ? err.message : GENERIC_ERROR);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={close}
			title="Vincular candidatos"
			actions={
				<>
					<Button variant="ghost" disabled={submitting} onClick={close}>
						Cancelar
					</Button>
					<Button loading={submitting} disabled={selected.size === 0} onClick={handleSubmit}>
						{selected.size > 1 ? `Vincular ${selected.size} candidatos` : "Vincular"}
					</Button>
				</>
			}>
			<div className="space-y-4">
				{formError && (
					<Alert variant="error" title="Não foi possível vincular">
						{formError}
					</Alert>
				)}

				{available.length === 0 ? (
					<div className="border-base-300 rounded-box flex flex-col items-center gap-2 border border-dashed px-4 py-8 text-center">
						<RiTeamLine className="text-base-content/40 size-6" />
						<p className="font-medium">
							{profiles.length === 0
								? "Nenhum candidato importado ainda"
								: "Todos os candidatos já estão nesta vaga"}
						</p>
						<Link to="/candidatos/importar" className="link link-primary text-sm">
							Importar currículos
						</Link>
					</div>
				) : (
					<>
						<label className="input bg-base-100 w-full">
							<RiSearchLine className="text-base-content/45 size-4" />
							<input
								aria-label="Buscar por nome ou competência"
								placeholder="Buscar por nome ou competência"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</label>

						{filtered.length === 0 ? (
							<p className="text-base-content/60 py-6 text-center">Nenhum candidato encontrado.</p>
						) : (
							<ul className="border-base-300 divide-base-300 rounded-box max-h-80 divide-y overflow-y-auto border">
								{filtered.map(({profile, match}) => {
									const checked = selected.has(profile.id);
									return (
										<li key={profile.id}>
											<label
												className={[
													"hover:bg-base-200/60 flex cursor-pointer items-center gap-3 px-3 py-2.5",
													checked && "bg-primary/5",
												]
													.filter(Boolean)
													.join(" ")}>
												<input
													type="checkbox"
													className="checkbox checkbox-primary checkbox-sm"
													checked={checked}
													disabled={submitting}
													onChange={() => toggle(profile.id)}
												/>
												<span className="min-w-0 flex-1">
													<span className="block truncate font-medium">{profile.name}</span>
													<span className="text-base-content/60 block truncate text-xs">
														{hasJobSkills
															? match.matchedNames.length > 0
																? `Tem: ${match.matchedNames.join(", ")}`
																: "Nenhuma competência da vaga"
															: `${profile.skills?.length ?? 0} competência(s) no perfil`}
													</span>
												</span>
												{match.requiredTotal > 0 && (
													<span className="text-base-content/60 shrink-0 text-xs tabular-nums">
														{match.requiredMatched}/{match.requiredTotal} obrig.
													</span>
												)}
											</label>
										</li>
									);
								})}
							</ul>
						)}
					</>
				)}
			</div>
		</Dialog>
	);
}
