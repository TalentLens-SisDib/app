import {useMemo, useState, type JSX} from "react";
import {Link} from "react-router-dom";
import {RiCalendarLine, RiMedalLine, RiSearchLine, RiTeamLine, RiUploadCloud2Line} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {
	Avatar,
	CardGridSkeleton,
	EmptyState,
	ErrorState,
	ListToolbar,
	SearchInput,
	TagList,
} from "../components/ui";
import {useProfiles} from "../hooks/useProfiles";
import type {Profile} from "../types/profile";
import {formatDate} from "../utils/format";

const VISIBLE_SKILLS = 4;

/** Formação mais recente (a sem data de término conta como atual). */
function latestEducation(profile: Profile): string | null {
	const education = [...(profile.educationalBackground ?? [])].sort((a, b) =>
		(b.endDate ?? "9999").localeCompare(a.endDate ?? "9999"),
	)[0];
	if (!education) return null;
	return [education.degree, education.institution].filter(Boolean).join(" · ");
}

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

	const importAction = (
		<Link to="/candidatos/importar" className="btn btn-primary btn-sm font-semibold">
			<RiUploadCloud2Line className="size-4" />
			Importar currículos
		</Link>
	);

	return (
		<>
			<PageHeader
				title="Candidatos"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Candidatos", href: "/candidatos"},
				]}
				actions={importAction}
			/>

			<ListToolbar
				count={
					!loading && !error
						? search.trim()
							? `${filtered.length} de ${profiles.length} candidatos`
							: `${profiles.length} ${profiles.length === 1 ? "candidato" : "candidatos"}`
						: undefined
				}>
				<SearchInput
					label="Buscar por nome ou competência"
					value={search}
					onChange={setSearch}
					className="sm:w-80"
				/>
			</ListToolbar>

			{error ? (
				<ErrorState title="Não foi possível carregar os candidatos" message={error} onRetry={reload} />
			) : loading ? (
				<CardGridSkeleton label="Carregando candidatos" />
			) : profiles.length === 0 ? (
				<EmptyState
					icon={<RiTeamLine className="size-5" />}
					title="Nenhum candidato no banco de talentos"
					description="Importe currículos para criar os perfis estruturados dos candidatos."
					action={importAction}
				/>
			) : filtered.length === 0 ? (
				<EmptyState
					icon={<RiSearchLine className="size-5" />}
					title="Nenhum candidato encontrado"
					description={<>Nenhum candidato corresponde a “{search.trim()}”. Tente outro nome ou competência.</>}
					action={
						<button type="button" className="btn btn-ghost btn-sm" onClick={() => setSearch("")}>
							Limpar busca
						</button>
					}
				/>
			) : (
				<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{filtered.map((profile) => {
						const skills = profile.skills ?? [];
						const education = latestEducation(profile);
						const summary = profile.description?.trim();
						return (
							<li key={profile.id} className="tl-entity-card group">
								<div className="flex items-center gap-3">
									<Avatar name={profile.name} size="lg" />
									<div className="min-w-0">
										<h2 className="truncate text-[0.9375rem] leading-6 font-semibold">
											{/* O link cobre o card inteiro. */}
											<Link
												to={`/candidatos/${profile.id}`}
												className="group-hover:text-primary transition-colors after:absolute after:inset-0 after:rounded-box">
												{profile.name}
											</Link>
										</h2>
										<p className="text-base-content/55 truncate text-xs">
											{education ?? "Formação não informada"}
										</p>
									</div>
								</div>

								<p className="text-base-content/65 mt-3 line-clamp-2 text-sm leading-5">
									{summary || <span className="text-base-content/40 italic">Sem resumo profissional</span>}
								</p>

								{skills.length > 0 && (
									<div className="mt-3">
										<TagList
											max={VISIBLE_SKILLS}
											items={skills.map((skill) => ({id: skill.skillId, label: skill.skillName}))}
										/>
									</div>
								)}

								<div className="mt-auto pt-4">
									<div className="border-base-300 text-base-content/55 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs">
										<span className="flex items-center gap-1.5">
											<RiMedalLine aria-hidden="true" className="text-base-content/45 size-4" />
											{skills.length} {skills.length === 1 ? "competência" : "competências"}
										</span>
										<span className="flex items-center gap-1.5">
											<RiCalendarLine aria-hidden="true" className="text-base-content/45 size-4" />
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
