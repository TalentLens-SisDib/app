import type {JSX} from "react";
import {Link} from "react-router-dom";
import {RiArrowRightLine, RiArrowRightSLine, RiChat3Line, RiTeamLine} from "@remixicon/react";
import type {Profile} from "../../types/profile";
import {formatDate} from "../../utils/format";
import ChartEmpty from "./ChartEmpty";
import {formatNumber} from "./chartTheme";

const relativeFormat = new Intl.RelativeTimeFormat("pt-BR", {numeric: "auto"});

/** "hoje", "ontem", "há 3 dias"; a partir de 30 dias, a data. */
function formatRelative(iso: string, now = Date.now()): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	const startOfToday = new Date(now);
	startOfToday.setHours(0, 0, 0, 0);
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	const days = Math.round((startOfToday.getTime() - startOfDay.getTime()) / (24 * 60 * 60 * 1000));
	if (days < 0 || days >= 30) return formatDate(iso);
	return relativeFormat.format(-days, "day");
}

type RecentCandidatesProps = {
	profiles: Profile[];
	total: number;
	/** Vagas visíveis ao usuário: só elas contam como vínculo. */
	jobIds: Set<string>;
	className?: string;
};

export default function RecentCandidates({profiles, total, jobIds, className}: RecentCandidatesProps): JSX.Element {
	return (
		<section aria-label="Últimos candidatos" className={["tl-panel", className].filter(Boolean).join(" ")}>
			<header className="tl-panel-header">
				<div>
					<h2 className="tl-panel-title">Últimos candidatos</h2>
					<p className="tl-panel-description">Perfis cadastrados mais recentemente</p>
				</div>
				<span className="tl-chip tl-chip-neutral">{formatNumber(total)} no total</span>
			</header>

			<div className="flex grow flex-col px-3 pt-3 pb-3">
				{profiles.length === 0 ? (
					<div className="flex grow px-2 pb-2">
						<ChartEmpty icon={<RiTeamLine className="size-5" />} title="Nenhum candidato ainda">
							<Link to="/candidatos/importar" className="tl-link">
								Importe currículos
							</Link>{" "}
							para montar o banco de talentos.
						</ChartEmpty>
					</div>
				) : (
					<ul className="flex flex-col gap-0.5">
						{profiles.map((profile) => {
							const applications = (profile.applications ?? []).filter((application) =>
								jobIds.has(application.jobOpeningId),
							).length;
							const interviews = profile.profileInterviews?.length ?? 0;
							const skills = profile.skills?.length ?? 0;
							return (
								<li key={profile.id}>
									<Link
										to={`/candidatos/${profile.id}`}
										className="group hover:bg-base-200/70 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors">
										<span
											aria-hidden="true"
											className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold">
											{profile.name.trim().charAt(0).toUpperCase() || "?"}
										</span>
										<div className="min-w-0 flex-1">
											<p className="group-hover:text-primary truncate text-sm font-medium transition-colors">
												{profile.name}
											</p>
											<p className="text-base-content/55 truncate text-xs">
												<time dateTime={profile.createdAt} title={formatDate(profile.createdAt)}>
													{formatRelative(profile.createdAt)}
												</time>
												{" · "}
												{skills} competência(s)
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1.5">
											{interviews > 0 && (
												<span
													className="tl-chip tl-chip-neutral"
													title={`${interviews} entrevista(s) registrada(s)`}>
													<RiChat3Line aria-hidden="true" className="size-3" />
													{interviews}
													<span className="sr-only"> entrevista(s)</span>
												</span>
											)}
											{applications > 0 ? (
												<span className="tl-chip tl-chip-neutral">{applications} vaga(s)</span>
											) : (
												<span className="tl-chip tl-chip-attn">Sem vaga</span>
											)}
											<RiArrowRightSLine
												aria-hidden="true"
												className="text-base-content/25 group-hover:text-base-content/60 size-4 transition-colors"
											/>
										</div>
									</Link>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<footer className="tl-panel-footer">
				<span className="text-base-content/55">Ordenado por data de cadastro</span>
				<Link to="/candidatos" className="tl-link">
					Ver todos os candidatos
					<RiArrowRightLine className="size-3.5" />
				</Link>
			</footer>
		</section>
	);
}
