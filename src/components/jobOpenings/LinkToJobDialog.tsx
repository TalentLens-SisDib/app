import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiBriefcase4Line, RiCheckLine, RiSearchLine} from "@remixicon/react";
import {Alert, Button, Dialog, Spinner} from "../ui";
import {toast} from "../ui/toastStore";
import {isApiError} from "../../api/errors";
import {useJobOpenings} from "../../hooks/useJobOpenings";
import {useProfileApplications} from "../../hooks/useProfileApplications";
import {formatCurrency} from "../../utils/format";

const GENERIC_ERROR = "Não foi possível vincular o candidato. Tente novamente.";

export type LinkToJobDialogProps = {
	open: boolean;
	onClose: () => void;
	profile: {id: string; name: string};
	/** Chamado com o total de vagas do candidato depois de vincular. */
	onLinked?: (totalApplications: number) => void;
};

/**
 * Vincula um perfil de candidato a uma ou mais vagas. Deve ser montado com
 * `key={profile.id}` para recarregar as vagas do candidato a cada abertura.
 */
export default function LinkToJobDialog({
	open,
	onClose,
	profile,
	onLinked,
}: LinkToJobDialogProps): JSX.Element {
	const {jobOpenings, loading: jobsLoading, error: jobsError, reload} = useJobOpenings();
	const {
		applications,
		loading: applicationsLoading,
		error: applicationsError,
		link,
	} = useProfileApplications(profile.id);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const loading = jobsLoading || applicationsLoading;
	const error = jobsError ?? applicationsError;
	const linkedIds = useMemo(
		() => new Set(applications.map((application) => application.jobOpeningId)),
		[applications],
	);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		return term ? jobOpenings.filter((job) => job.name.toLowerCase().includes(term)) : jobOpenings;
	}, [jobOpenings, search]);

	function close() {
		if (!submitting) onClose();
	}

	function toggle(jobOpeningId: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(jobOpeningId)) next.delete(jobOpeningId);
			else next.add(jobOpeningId);
			return next;
		});
	}

	async function handleSubmit() {
		if (selected.size === 0 || submitting) return;
		setSubmitting(true);
		setFormError(null);
		const ids = [...selected];
		try {
			await link(ids);
			toast.success(
				ids.length === 1
					? `${profile.name} vinculado(a) à vaga`
					: `${profile.name} vinculado(a) a ${ids.length} vagas`,
			);
			onLinked?.(applications.length + ids.length);
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
			title="Vincular à vaga"
			actions={
				<>
					<Button variant="ghost" disabled={submitting} onClick={close}>
						Cancelar
					</Button>
					<Button loading={submitting} disabled={selected.size === 0} onClick={handleSubmit}>
						{selected.size > 1 ? `Vincular a ${selected.size} vagas` : "Vincular"}
					</Button>
				</>
			}>
			<div className="space-y-4">
				<p className="text-base-content/70">
					Escolha as vagas para as quais <strong className="text-base-content">{profile.name}</strong>{" "}
					vai concorrer.
				</p>

				{formError && (
					<Alert variant="error" title="Não foi possível vincular">
						{formError}
					</Alert>
				)}

				{error ? (
					<Alert variant="error" title="Não foi possível carregar as vagas">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<span>{error}</span>
							<Button size="xs" variant="ghost" onClick={reload}>
								Tentar novamente
							</Button>
						</div>
					</Alert>
				) : loading ? (
					<div className="flex items-center justify-center gap-2 py-10">
						<Spinner size="sm" />
						<span className="text-base-content/60">Carregando vagas...</span>
					</div>
				) : jobOpenings.length === 0 ? (
					<div className="border-base-300 rounded-box flex flex-col items-center gap-2 border border-dashed px-4 py-8 text-center">
						<RiBriefcase4Line className="text-base-content/40 size-6" />
						<p className="font-medium">Nenhuma vaga cadastrada</p>
						<Link to="/vagas" className="link link-primary text-sm">
							Criar uma vaga
						</Link>
					</div>
				) : (
					<>
						{jobOpenings.length > 5 && (
							<label className="input bg-base-100 w-full">
								<RiSearchLine className="text-base-content/45 size-4" />
								<input
									aria-label="Buscar vaga"
									placeholder="Buscar vaga"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
								/>
							</label>
						)}

						{filtered.length === 0 ? (
							<p className="text-base-content/60 py-6 text-center">Nenhuma vaga encontrada.</p>
						) : (
							<ul className="border-base-300 divide-base-300 rounded-box max-h-80 divide-y overflow-y-auto border">
								{filtered.map((job) => {
									const linked = linkedIds.has(job.id);
									const checked = linked || selected.has(job.id);
									return (
										<li key={job.id}>
											<label
												className={[
													"flex items-center gap-3 px-3 py-2.5",
													linked ? "cursor-default" : "hover:bg-base-200/60 cursor-pointer",
													!linked && checked && "bg-primary/5",
												]
													.filter(Boolean)
													.join(" ")}>
												<input
													type="checkbox"
													className="checkbox checkbox-primary checkbox-sm"
													checked={checked}
													disabled={linked || submitting}
													onChange={() => toggle(job.id)}
												/>
												<span className="min-w-0 flex-1">
													<span className="block truncate font-medium">{job.name}</span>
													<span className="text-base-content/60 block text-xs">
														{formatCurrency(job.expectedWage)}
													</span>
												</span>
												{linked && (
													<span className="tl-tone-ok flex shrink-0 items-center gap-1 text-xs font-medium">
														<RiCheckLine className="size-4" />
														Vinculado
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
