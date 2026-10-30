import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiCalendarLine, RiTeamLine, RiUploadCloud2Line} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {Alert, Badge, Button, Card, Input, Spinner} from "../components/ui";
import {useProfiles} from "../hooks/useProfiles";
import {formatDate} from "../utils/format";

const VISIBLE_SKILLS = 4;

export default function Candidates(): JSX.Element {
	const {profiles, loading, error, reload} = useProfiles();
	const [search, setSearch] = useState("");

	const sorted = useMemo(
		() => [...profiles].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
		[profiles],
	);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return sorted;
		return sorted.filter(
			(profile) =>
				profile.name.toLowerCase().includes(term) ||
				profile.skills?.some((skill) => skill.skillName.toLowerCase().includes(term)),
		);
	}, [sorted, search]);

	return (
		<>
			<PageHeader
				title="Candidatos"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Candidatos", href: "/candidatos"},
				]}
				actions={
					<Link to="/candidatos/importar" className="btn btn-primary btn-sm">
						<RiUploadCloud2Line className="size-4" />
						Importar currículos
					</Link>
				}
			/>

			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="sm:w-72">
					<Input
						aria-label="Buscar por nome ou competência"
						placeholder="Buscar por nome ou competência"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				{!loading && !error && (
					<p className="text-base-content/60 shrink-0 text-sm">
						{filtered.length} de {profiles.length} candidato(s)
					</p>
				)}
			</div>

			{error ? (
				<Alert variant="error" title="Não foi possível carregar os candidatos">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span>{error}</span>
						<Button size="xs" variant="ghost" onClick={reload}>
							Tentar novamente
						</Button>
					</div>
				</Alert>
			) : loading ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16">
					<Spinner />
					<p className="text-base-content/60 text-sm">Carregando candidatos...</p>
				</div>
			) : profiles.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
						<span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-full">
							<RiTeamLine className="size-6" />
						</span>
						<div>
							<p className="font-medium">Nenhum candidato cadastrado</p>
							<p className="text-base-content/60 mt-1 text-sm">
								Importe currículos para criar os perfis estruturados dos candidatos.
							</p>
						</div>
						<Link to="/candidatos/importar" className="btn btn-primary btn-sm">
							<RiUploadCloud2Line className="size-4" />
							Importar currículos
						</Link>
					</div>
				</Card>
			) : filtered.length === 0 ? (
				<p className="text-base-content/60 py-10 text-center text-sm">
					Nenhum candidato encontrado para essa busca.
				</p>
			) : (
				<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{filtered.map((profile) => {
						const skills = profile.skills ?? [];
						return (
							<li
								key={profile.id}
								className="card border-base-300 bg-base-100 hover:border-primary/40 group relative border shadow-sm transition-colors">
								<div className="card-body gap-3 p-5">
									<div className="flex items-center gap-3">
										<span
											aria-hidden="true"
											className="bg-base-200 text-base-content/70 grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold">
											{profile.name.trim().charAt(0).toUpperCase() || "?"}
										</span>
										<h2 className="min-w-0 truncate text-base leading-6 font-semibold">
											{/* O link cobre o card inteiro. */}
											<Link
												to={`/candidatos/${profile.id}`}
												className="group-hover:text-primary after:absolute after:inset-0 after:rounded-box">
												{profile.name}
											</Link>
										</h2>
									</div>

									{profile.description?.trim() && (
										<p className="text-base-content/70 line-clamp-2 text-sm leading-6">
											{profile.description}
										</p>
									)}

									{skills.length > 0 && (
										<div className="flex flex-wrap gap-1.5">
											{skills.slice(0, VISIBLE_SKILLS).map((skill) => (
												<Badge key={skill.skillId} size="sm" variant="ghost">
													{skill.skillName}
												</Badge>
											))}
											{skills.length > VISIBLE_SKILLS && (
												<Badge size="sm" variant="outline">
													+{skills.length - VISIBLE_SKILLS}
												</Badge>
											)}
										</div>
									)}

									<div className="text-base-content/60 border-base-300 mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
										<span className="flex items-center gap-1.5">
											<RiCalendarLine className="size-4" />
											Cadastrado em {formatDate(profile.createdAt)}
										</span>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</>
	);
}
