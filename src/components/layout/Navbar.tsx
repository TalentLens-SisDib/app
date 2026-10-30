import type {JSX} from "react";
import {
	RiArrowDownSLine,
	RiLayoutLeftLine,
	RiLogoutBoxRLine,
	RiNotification3Line,
	RiUserLine,
} from "@remixicon/react";
import {Link, useNavigate} from "react-router-dom";
import {logout} from "../../api/services/auth";
import {useSession} from "../../hooks/useSession";
import type {UserRole} from "../../types/user";
import {initialsOf} from "../../utils/initials";
import Brand from "./Brand";

const ROLE_LABEL: Record<UserRole, string> = {
	Admin: "Administrador",
	Recruiter: "Recrutador",
};

export default function Navbar(): JSX.Element {
	const navigate = useNavigate();
	const session = useSession();
	const user = session?.user;

	function handleLogout() {
		logout();
		navigate("/login", {replace: true});
	}

	return (
		<header className="bg-base-100/90 border-base-300 sticky top-0 z-30 border-b backdrop-blur-xl">
			<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
				<div className="flex items-center gap-2">
					<label
						htmlFor="my-drawer-4"
						aria-label="Abrir ou recolher o menu"
						className="btn btn-ghost btn-square btn-sm text-base-content/70 hover:text-base-content">
						<RiLayoutLeftLine className="size-[18px]" />
					</label>
					<Link to="/" className="rounded-lg">
						<Brand />
					</Link>
				</div>

				<div className="flex items-center gap-1.5">
					<button
						type="button"
						aria-label="Notificações"
						className="btn btn-ghost btn-square btn-sm text-base-content/70 hover:text-base-content">
						<RiNotification3Line className="size-[18px]" />
					</button>

					<span aria-hidden="true" className="bg-base-300 mx-1.5 h-6 w-px" />

					<div className="dropdown dropdown-end">
						<button
							type="button"
							tabIndex={0}
							aria-label="Menu da conta"
							className="hover:bg-base-200 flex items-center gap-2.5 rounded-lg py-1 pr-1.5 pl-1 transition-colors">
							<span className="bg-primary/10 text-primary ring-primary/15 grid size-8 place-items-center rounded-full text-xs font-semibold ring-1">
								{initialsOf(user?.name, "TL")}
							</span>
							{user && (
								<span className="hidden min-w-0 text-left md:block">
									<span className="block max-w-36 truncate text-sm leading-5 font-medium">{user.name}</span>
									<span className="text-base-content/55 block text-xs leading-4">
										{ROLE_LABEL[user.role] ?? user.role}
									</span>
								</span>
							)}
							<RiArrowDownSLine className="text-base-content/50 hidden size-4 md:block" />
						</button>
						<ul
							tabIndex={0}
							className="menu dropdown-content bg-base-100 border-base-300 rounded-box z-20 mt-2 w-60 border p-1.5 shadow-lg shadow-black/5">
							{user && (
								<li className="menu-title border-base-300 mb-1 border-b px-3 pt-2 pb-2.5">
									<span className="text-base-content block truncate text-sm font-medium normal-case">
										{user.name}
									</span>
									<span className="text-base-content/60 block truncate text-xs font-normal normal-case">
										{user.email}
									</span>
								</li>
							)}
							<li>
								<button type="button">
									<RiUserLine className="size-4" />
									Editar conta
								</button>
							</li>
							<li>
								<button type="button" onClick={handleLogout} className="text-error">
									<RiLogoutBoxRLine className="size-4" />
									Sair
								</button>
							</li>
						</ul>
					</div>
				</div>
			</nav>
		</header>
	);
}
