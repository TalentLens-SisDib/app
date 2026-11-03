import {useState, type JSX, type SubmitEvent} from "react";
import {Link} from "react-router-dom";
import {RiArrowLeftLine, RiLinkedinLine, RiRefreshLine, RiUserAddLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {Alert, Badge, Button, Card, Input, Spinner} from "../components/ui";
import {isApiError} from "../api/errors";
import {importLinkedInProfile} from "../api/services/profiles";
import type {Profile} from "../types/profile";

const LINKEDIN_PROFILE_URL =
	/^https:\/\/(?:(?:[a-z]{2,3}\.)?linkedin\.com|www\.linkedin\.com)\/in\/[a-zA-Z0-9_-]+\/?(?:\?[^#]*)?$/i;

export default function ImportLinkedIn(): JSX.Element {
	const [url, setUrl] = useState("");
	const [profile, setProfile] = useState<Profile | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [urlError, setUrlError] = useState<string | undefined>();
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const normalizedUrl = url.trim();
		if (!LINKEDIN_PROFILE_URL.test(normalizedUrl)) {
			setUrlError("Informe um link público válido no formato linkedin.com/in/usuario.");
			return;
		}

		setUrlError(undefined);
		setError(null);
		setProfile(null);
		setSubmitting(true);
		try {
			const imported = await importLinkedInProfile(normalizedUrl);
			setProfile(imported);
		} catch (reason) {
			setError(isApiError(reason) ? reason.message : "Não foi possível importar este perfil. Tente novamente.");
		} finally {
			setSubmitting(false);
		}
	}

	function reset() {
		setUrl("");
		setProfile(null);
		setError(null);
		setUrlError(undefined);
	}

	return (
		<>
			<PageHeader
				title="Importar do LinkedIn"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Candidatos", href: "/candidatos"},
					{label: "Importar do LinkedIn", href: "/candidatos/importar-linkedin"},
				]}
				actions={
					<Link to="/candidatos" className="btn btn-ghost btn-sm">
						<RiArrowLeftLine className="size-4" />
						Voltar para candidatos
					</Link>
				}
			/>

			<Card
				title="Importar perfil público"
				description="Cole o link do perfil para criar um cadastro de candidato no TalentLens.">
				<form className="space-y-4" noValidate onSubmit={handleSubmit}>
					{error && (
						<Alert variant="error" title="A integração não concluiu a importação">
							{error}
						</Alert>
					)}

					<Input
						label="Link do perfil no LinkedIn"
						type="url"
						required
						placeholder="https://www.linkedin.com/in/usuario"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						disabled={submitting || profile !== null}
						error={urlError}
						helperText="O perfil precisa estar acessível publicamente para a integração conseguir ler os dados."
					/>

					<div className="flex flex-wrap items-center gap-2">
						<Button type="submit" loading={submitting} disabled={submitting || profile !== null}>
							<RiLinkedinLine className="size-4" />
							Importar perfil
						</Button>
						{profile && (
							<Button type="button" variant="outline" onClick={reset}>
								<RiRefreshLine className="size-4" />
								Importar outro perfil
							</Button>
						)}
					</div>
				</form>
			</Card>

			{submitting && (
				<Card className="mt-5">
					<div className="flex items-center gap-3">
						<Spinner />
						<div>
							<p className="font-medium">Importando perfil...</p>
							<p className="text-base-content/60 mt-0.5 text-sm">
								A integração está consultando o perfil e preparando o cadastro do candidato.
							</p>
						</div>
					</div>
				</Card>
			)}

			{profile && (
				<Card
					className="mt-5"
					title="Perfil importado"
					description="O cadastro foi criado. Revise as informações antes de usar o perfil no processo seletivo."
					actions={
						<Link to={`/candidatos/${profile.id}`} className="btn btn-primary btn-sm">
							<RiUserAddLine className="size-4" />
							Revisar perfil
						</Link>
					}>
					<div className="space-y-4">
						<div>
							<h3 className="text-lg font-semibold">{profile.name}</h3>
							<p className="text-base-content/60 mt-1 text-sm whitespace-pre-line">
								{profile.description?.trim() || "Nenhum resumo profissional foi identificado."}
							</p>
						</div>

						{(profile.skills?.length ?? 0) > 0 && (
							<div>
								<h3 className="text-base-content/60 mb-2 text-xs font-semibold tracking-wide uppercase">
									Competências identificadas
								</h3>
								<div className="flex flex-wrap gap-2">
									{profile.skills?.map((skill) => (
										<Badge key={skill.skillId} variant="primary">{skill.skillName}</Badge>
									))}
								</div>
							</div>
						)}

						{(profile.qualityIssues?.length ?? 0) > 0 && (
							<Alert variant="warning" title="Revise alguns campos do perfil">
								<ul className="list-inside list-disc space-y-1">
									{profile.qualityIssues?.map((issue) => <li key={issue}>{issue}</li>)}
								</ul>
							</Alert>
						)}
					</div>
				</Card>
			)}
		</>
	);
}
