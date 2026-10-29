import {useEffect, useState, type JSX} from "react";
import {Link, useParams} from "react-router-dom";
import {RiArrowLeftLine, RiEditLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import ProfileEditor from "../components/profiles/ProfileEditor";
import {Alert, Badge, Button, Card, RichText, Spinner} from "../components/ui";
import {isApiError} from "../api/errors";
import {getProfile, updateProfile} from "../api/services/profiles";
import {toast} from "../components/ui/toastStore";
import type {Profile, UpdateProfileInput} from "../types/profile";
import {formatDateTime} from "../utils/format";
import {parseKeyTakeaways} from "../utils/profile";

function formatEducationDate(value: string): string {
	const [year, month, day] = value.slice(0, 10).split("-").map(Number);
	if (!year || !month || !day) return "—";
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "—";
	return date.toLocaleDateString("pt-BR", {day: "2-digit", month: "short", year: "numeric"});
}

export default function ProfileDetail(): JSX.Element {
	const {id = ""} = useParams();
	const [loadResult, setLoadResult] = useState<{
		key: string;
		profile: Profile | null;
		error: unknown;
	} | null>(null);
	const [editing, setEditing] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const loadKey = `${id}:${reloadToken}`;
	const loading = loadResult?.key !== loadKey;
	const profile = loading ? null : (loadResult?.profile ?? null);
	const error = loading ? null : (loadResult?.error ?? null);

	useEffect(() => {
		const controller = new AbortController();
		let active = true;

		getProfile(id, controller.signal)
			.then((result) => {
				if (active) setLoadResult({key: loadKey, profile: result, error: null});
			})
			.catch((reason: unknown) => {
				if (active && !controller.signal.aborted) {
					setLoadResult({key: loadKey, profile: null, error: reason});
				}
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, [id, loadKey]);

	async function handleSave(data: UpdateProfileInput) {
		if (!profile) return;
		const updated = await updateProfile(profile.id, data);
		setLoadResult({key: loadKey, profile: updated, error: null});
		setEditing(false);
		toast.success("Perfil do candidato atualizado");
	}

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-24">
				<Spinner />
				<p className="text-base-content/60 text-sm">Carregando perfil...</p>
			</div>
		);
	}

	if (error || !profile) {
		const notFound = isApiError(error) && error.kind === "not_found";
		return (
			<Card>
				{notFound ? (
					<div className="space-y-3 text-center">
						<p className="font-semibold">Perfil não encontrado</p>
						<p className="text-base-content/60 text-sm">O candidato pode ter sido removido ou o link está incorreto.</p>
						<Link to="/vagas" className="btn btn-ghost btn-sm">
							<RiArrowLeftLine className="size-4" />
							Voltar para vagas
						</Link>
					</div>
				) : (
					<Alert variant="error" title="Não foi possível carregar o perfil">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<span>{isApiError(error) ? error.message : "Tente novamente."}</span>
							<Button size="xs" variant="ghost" onClick={() => setReloadToken((value) => value + 1)}>
								Tentar novamente
							</Button>
						</div>
					</Alert>
				)}
			</Card>
		);
	}

	return (
		<>
			<PageHeader
				title={profile.name}
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Vagas", href: "/vagas"},
					{label: "Perfil do candidato", href: `/candidatos/${profile.id}`},
				]}
				actions={
					<>
						<Link to="/vagas" className="btn btn-ghost btn-sm">
							<RiArrowLeftLine className="size-4" />
							Voltar
						</Link>
						{!editing && (
							<Button size="sm" onClick={() => setEditing(true)}>
								<RiEditLine className="size-4" />
								Editar perfil
							</Button>
						)}
					</>
				}
			/>

			{editing ? (
				<Card title="Editar perfil" description="Revise os dados estruturados do candidato.">
					<ProfileEditor
						key={`${profile.id}-${profile.updatedAt}`}
						profile={profile}
						onCancel={() => setEditing(false)}
						onSubmit={handleSave}
					/>
				</Card>
			) : (
				<div className="space-y-5">
					<Card
						title="Resumo do perfil"
						description="Use as entrevistas como evidência. O perfil estruturado só muda depois de revisar e salvar as alterações.">
						{profile.description?.trim() ? (
							<p className="whitespace-pre-line leading-7">{profile.description}</p>
						) : (
							<p className="text-base-content/55 text-sm">Nenhum resumo cadastrado.</p>
						)}
					</Card>

					<div className="grid gap-5 lg:grid-cols-2">
						<Card title="Competências">
							{(profile.skills?.length ?? 0) > 0 ? (
								<div className="flex flex-wrap gap-2">
									{profile.skills?.map((skill) => <Badge key={skill.skillId} variant="primary">{skill.skillName}</Badge>)}
								</div>
							) : <p className="text-base-content/55 text-sm">Nenhuma competência cadastrada.</p>}
						</Card>
						<Card title="Características comportamentais">
							{(profile.culturalFits?.length ?? 0) > 0 ? (
								<div className="flex flex-wrap gap-2">
									{profile.culturalFits?.map((fit) => <Badge key={fit.culturalFitId} variant="secondary">{fit.culturalFitName}</Badge>)}
								</div>
							) : <p className="text-base-content/55 text-sm">Nenhuma característica cadastrada.</p>}
						</Card>
					</div>

					<Card title="Formação">
						{(profile.educationalBackground?.length ?? 0) > 0 ? (
							<ul className="divide-base-300 divide-y">
								{profile.educationalBackground?.map((education) => (
									<li key={education.id} className="py-3 first:pt-0 last:pb-0">
										<p className="font-medium">{education.degree}</p>
										<p className="text-base-content/65 text-sm">{education.institution}</p>
										<p className="text-base-content/55 mt-1 text-xs">
											{formatEducationDate(education.startDate)} – {education.endDate ? formatEducationDate(education.endDate) : "em andamento"}
										</p>
									</li>
								))}
							</ul>
						) : <p className="text-base-content/55 text-sm">Nenhuma formação cadastrada.</p>}
					</Card>

					<Card title="Histórico de entrevistas" description="Transcrições e pontos-chave ficam associados ao candidato como evidências para revisar o perfil.">
						{(profile.profileInterviews?.length ?? 0) > 0 ? (
							<ul className="space-y-4">
								{[...(profile.profileInterviews ?? [])]
									.sort((a, b) => b.startDate.localeCompare(a.startDate))
									.map((interview) => {
										const takeaways = parseKeyTakeaways(interview.keyTakeaways);
										return (
											<li key={interview.id} className="border-base-300 rounded-box border p-4">
												<p className="text-base-content/60 text-xs">Entrevista em {formatDateTime(interview.startDate)}</p>
												{takeaways.length > 0 && (
													<ul className="mt-3 grid gap-1.5" aria-label="Pontos-chave da entrevista">
														{takeaways.map((takeaway, index) => (
															<li key={`${interview.id}-${index}`} className="flex items-start gap-2 text-sm leading-5">
																<Badge size="xs" variant="secondary">Ponto-chave</Badge>
																<span className="min-w-0 break-words">{takeaway}</span>
															</li>
														))}
													</ul>
												)}
												<details className="bg-base-200 rounded-field mt-3 px-3 py-2.5">
													<summary className="cursor-pointer text-sm font-medium">Ver transcrição</summary>
													<div className="mt-3"><RichText value={interview.transcript} className="text-sm" /></div>
												</details>
											</li>
										);
									})}
							</ul>
						) : <p className="text-base-content/55 text-sm">Nenhuma entrevista associada a este perfil.</p>}
					</Card>
				</div>
			)}
		</>
	);
}
