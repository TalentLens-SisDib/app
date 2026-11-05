import {useEffect, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {isApiError} from "../../api/errors";
import {getJobOpenings} from "../../api/services/jobOpenings";
import {updateProfile} from "../../api/services/profiles";
import type {JobOpening} from "../../types/jobOpening";
import type {Profile} from "../../types/profile";
import {
	adaptationCriteria,
	adaptationUpdate,
	countMet,
	profileSelection,
	type AdaptationCriterion,
	type AdaptationDimension,
	type AdaptationSelection,
} from "../../utils/adaptation";
import {Alert, Badge, Button, Card, Select, Spinner} from "../ui";
import {toast} from "../ui/toastStore";

const GENERIC_LOAD_ERROR = "Não foi possível carregar as vagas do funcionário.";
const GENERIC_SAVE_ERROR = "Não foi possível salvar o acompanhamento. Tente novamente.";

const DIMENSIONS: {value: AdaptationDimension; title: string; hint: string; empty: string}[] = [
	{
		value: "technical",
		title: "Técnico",
		hint: "Competências da vaga que o funcionário já domina no dia a dia.",
		empty: "A vaga não tem competências definidas.",
	},
	{
		value: "behavioral",
		title: "Comportamental",
		hint: "Características comportamentais (fit cultural) da vaga já observadas no time.",
		empty: "A vaga não tem características comportamentais definidas.",
	},
];

type AdaptationPanelProps = {
	profile: Profile;
	onSaved: (profile: Profile) => void;
};

/** Acompanhamento técnico e comportamental do funcionário frente aos critérios da vaga que ocupa. */
export default function AdaptationPanel({profile, onSaved}: AdaptationPanelProps): JSX.Element {
	const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

	// Vaga mais recente primeiro: é a que o funcionário provavelmente ocupa.
	const jobIdsKey = [...(profile.applications ?? [])]
		.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
		.map((application) => application.jobOpeningId)
		.join(",");

	useEffect(() => {
		if (!jobIdsKey) return;
		const ids = jobIdsKey.split(",");
		let cancelled = false;
		getJobOpenings()
			.then((data) => {
				if (cancelled) return;
				const byId = new Map(data.map((job) => [job.id, job]));
				setJobOpenings(ids.flatMap((id) => byId.get(id) ?? []));
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(isApiError(err) ? err.message : GENERIC_LOAD_ERROR);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [jobIdsKey, reloadToken]);

	function reload() {
		setLoading(true);
		setError(null);
		setReloadToken((token) => token + 1);
	}

	const jobOpening = jobOpenings.find((job) => job.id === selectedJobId) ?? jobOpenings[0];

	let content: JSX.Element;
	if (!jobIdsKey) {
		content = (
			<div className="rounded-box border-base-300 border border-dashed px-4 py-8 text-center">
				<p className="text-base-content/60 mx-auto max-w-md text-sm">
					O candidato não está vinculado a nenhuma vaga. Vincule-o à vaga que ele ocupa, na página da vaga, para
					acompanhar a adaptação conforme os critérios dela.
				</p>
			</div>
		);
	} else if (error) {
		content = (
			<Alert variant="error" title="Não foi possível carregar o acompanhamento">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<span>{error}</span>
					<Button size="xs" variant="ghost" onClick={reload}>
						Tentar novamente
					</Button>
				</div>
			</Alert>
		);
	} else if (loading) {
		content = (
			<div className="flex items-center gap-3 py-6">
				<Spinner />
				<p className="text-base-content/60 text-sm">Carregando acompanhamento...</p>
			</div>
		);
	} else if (!jobOpening) {
		content = <p className="text-base-content/55 text-sm">As vagas vinculadas ao candidato não estão mais disponíveis.</p>;
	} else {
		content = (
			<div className="space-y-5">
				{jobOpenings.length > 1 ? (
					<div className="max-w-sm">
						<Select
							label="Vaga ocupada"
							value={jobOpening.id}
							onChange={(event) => setSelectedJobId(event.target.value)}>
							{jobOpenings.map((job) => (
								<option key={job.id} value={job.id}>
									{job.name}
								</option>
							))}
						</Select>
					</div>
				) : (
					<p className="text-sm">
						<span className="text-base-content/55">Vaga ocupada: </span>
						<Link to={`/vagas/${jobOpening.id}`} className="link link-hover font-medium">
							{jobOpening.name}
						</Link>
					</p>
				)}
				<AdaptationChecklist
					key={`${jobOpening.id}:${profile.updatedAt}`}
					profile={profile}
					jobOpening={jobOpening}
					onSaved={onSaved}
				/>
			</div>
		);
	}

	return (
		<Card
			title="Acompanhamento da adaptação"
			description="Evolução técnica e comportamental do funcionário frente aos critérios da vaga que ocupa.">
			{content}
		</Card>
	);
}

type AdaptationChecklistProps = {
	profile: Profile;
	jobOpening: JobOpening;
	onSaved: (profile: Profile) => void;
};

/** Parte do perfil salvo: remontado (`key`) quando a vaga ou o perfil mudam. */
function AdaptationChecklist({profile, jobOpening, onSaved}: AdaptationChecklistProps): JSX.Element {
	const criteria = adaptationCriteria(jobOpening);
	const [selection, setSelection] = useState<AdaptationSelection>(() => profileSelection(profile));
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const saved = profileSelection(profile);
	const dirty = DIMENSIONS.some(({value}) =>
		criteria[value].some((criterion) => selection[value].has(criterion.id) !== saved[value].has(criterion.id)),
	);

	function toggle(dimension: AdaptationDimension, criterion: AdaptationCriterion) {
		setSelection((current) => {
			const next = new Set(current[dimension]);
			if (next.has(criterion.id)) next.delete(criterion.id);
			else next.add(criterion.id);
			return {...current, [dimension]: next};
		});
	}

	async function handleSave() {
		setSaving(true);
		setSaveError(null);
		try {
			const updated = await updateProfile(profile.id, adaptationUpdate(profile, jobOpening, selection));
			onSaved(updated);
			toast.success("Acompanhamento da adaptação salvo");
		} catch (err) {
			setSaveError(isApiError(err) ? err.message : GENERIC_SAVE_ERROR);
		} finally {
			setSaving(false);
		}
	}

	if (criteria.technical.length === 0 && criteria.behavioral.length === 0) {
		return (
			<p className="text-base-content/55 text-sm">
				A vaga não tem competências nem características comportamentais definidas. Defina os critérios na página da
				vaga para acompanhar a adaptação.
			</p>
		);
	}

	return (
		<div className="space-y-5">
			<div className="grid gap-4 lg:grid-cols-2">
				{DIMENSIONS.map(({value, title, hint, empty}) => {
					const met = countMet(criteria[value], selection[value]);
					const total = met.requiredTotal + met.desiredTotal;
					const metTotal = met.requiredMet + met.desiredMet;
					return (
						<fieldset key={value} aria-label={title} className="rounded-box border-base-300 min-w-0 space-y-3 border p-4">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div className="min-w-0">
									<h3 className="font-medium">{title}</h3>
									<p className="text-base-content/60 text-xs leading-5">{hint}</p>
								</div>
								{met.requiredTotal > 0 && (
									<Badge size="sm" variant={met.requiredMet === met.requiredTotal ? "success" : "warning"}>
										{met.requiredMet}/{met.requiredTotal} obrigatórios
									</Badge>
								)}
							</div>

							{total === 0 ? (
								<p className="text-base-content/55 text-sm">{empty}</p>
							) : (
								<>
									<progress
										className={`progress h-2 w-full ${metTotal === total ? "progress-success" : "progress-primary"}`}
										value={metTotal}
										max={total}
										aria-label={`${title}: ${metTotal} de ${total} critérios atendidos`}
									/>
									<ul className="space-y-1">
										{criteria[value].map((criterion) => (
											<li key={criterion.id}>
												<label className="hover:bg-base-200/60 rounded-field flex cursor-pointer items-center gap-3 px-2 py-1.5">
													<input
														type="checkbox"
														className="checkbox checkbox-primary checkbox-sm"
														checked={selection[value].has(criterion.id)}
														disabled={saving}
														onChange={() => toggle(value, criterion)}
													/>
													<span className="min-w-0 flex-1 text-sm break-words">{criterion.name}</span>
													<Badge size="xs" variant={criterion.isRequired ? "primary" : "outline"}>
														{criterion.isRequired ? "Obrigatório" : "Desejável"}
													</Badge>
												</label>
											</li>
										))}
									</ul>
								</>
							)}
						</fieldset>
					);
				})}
			</div>

			{saveError && (
				<Alert variant="error" title="Não foi possível salvar">
					{saveError}
				</Alert>
			)}

			<div className="flex flex-wrap items-center justify-end gap-2">
				{dirty && <span className="text-base-content/55 mr-auto text-xs">Alterações não salvas</span>}
				<Button variant="ghost" size="sm" disabled={!dirty || saving} onClick={() => setSelection(profileSelection(profile))}>
					Descartar
				</Button>
				<Button size="sm" disabled={!dirty} loading={saving} onClick={handleSave}>
					Salvar acompanhamento
				</Button>
			</div>
		</div>
	);
}
