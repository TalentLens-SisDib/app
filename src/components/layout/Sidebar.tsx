import {
	RiBriefcase4Line,
	RiDashboardLine,
	RiMedalLine,
	RiTeamLine,
	RiUploadCloud2Line,
	RiUserSettingsLine,
	type RemixiconComponentType,
} from "@remixicon/react";
import type {JSX} from "react";
import {NavLink, useMatch} from "react-router-dom";

type SidebarLinkProps = {
	to: string;
	label: string;
	icon: RemixiconComponentType;
	end?: boolean;
	/** Força o estado inativo mesmo quando a rota casa (ex.: rota filha com item próprio). */
	suppressActive?: boolean;
};

function SidebarLink({to, label, icon: Icon, end, suppressActive}: SidebarLinkProps): JSX.Element {
	return (
		<li>
			<NavLink
				to={to}
				end={end}
				data-tip={label}
				className={({isActive}) =>
					[
						"relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
						"is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:justify-center",
						isActive && !suppressActive
							? "bg-primary/8 text-primary font-medium hover:bg-primary/10"
							: "text-base-content/70 hover:bg-base-200 hover:text-base-content",
					].join(" ")
				}>
				{({isActive}) => (
					<>
						{/* Indicador da página atual. É um elemento próprio porque o tooltip
						    (sidebar recolhida) usa os pseudo-elementos ::before/::after. */}
						{isActive && !suppressActive && (
							<span aria-hidden="true" className="bg-primary absolute inset-y-2 -left-3 w-0.5 rounded-full" />
						)}
						<Icon className="size-[18px] shrink-0" />
						<span className="is-drawer-close:hidden truncate">{label}</span>
					</>
				)}
			</NavLink>
		</li>
	);
}

function SidebarGroup({title}: {title: string}): JSX.Element {
	return (
		<li className="mt-4 first:mt-0" role="presentation">
			<span className="is-drawer-close:hidden text-base-content/45 block px-2.5 pb-1.5 text-[0.6875rem] font-semibold tracking-wider uppercase">
				{title}
			</span>
			<span aria-hidden="true" className="is-drawer-open:hidden bg-base-300 mx-auto mb-2 block h-px w-6" />
		</li>
	);
}

export default function Sidebar(): JSX.Element {
	// "/candidatos" casa por prefixo com a importação, que tem item próprio no menu.
	const onImport = useMatch("/candidatos/importar") !== null;

	return (
		<div className="drawer-side is-drawer-close:overflow-visible z-40">
			<label htmlFor="my-drawer-4" aria-label="Fechar menu" className="drawer-overlay"></label>

			<div className="bg-base-100 border-base-300 is-drawer-close:w-16 is-drawer-open:w-64 flex min-h-full flex-col border-r">
				<div className="border-base-300 is-drawer-close:justify-center flex h-16 items-center border-b px-5">
					<span className="is-drawer-close:hidden text-base-content/45 text-[0.6875rem] font-semibold tracking-wider uppercase">
						Navegação
					</span>
				</div>

				<nav aria-label="Principal" className="grow px-3 py-4">
					<ul className="flex flex-col gap-0.5">
						<SidebarGroup title="Principal" />
						<SidebarLink to="/" end label="Dashboard" icon={RiDashboardLine} />
						<SidebarLink to="/vagas" label="Vagas" icon={RiBriefcase4Line} />
						<SidebarLink to="/candidatos" label="Candidatos" icon={RiTeamLine} suppressActive={onImport} />

						<SidebarGroup title="Banco de talentos" />
						<SidebarLink to="/candidatos/importar" label="Importar currículos" icon={RiUploadCloud2Line} />
						<SidebarLink to="/competencias" label="Competências" icon={RiMedalLine} />

						<SidebarGroup title="Administração" />
						<SidebarLink to="/usuarios" label="Usuários" icon={RiUserSettingsLine} />
					</ul>
				</nav>

				<p className="is-drawer-close:hidden border-base-300 text-base-content/45 border-t px-5 py-3 text-xs">
					TalentLens · v0.1.0
				</p>
			</div>
		</div>
	);
}
