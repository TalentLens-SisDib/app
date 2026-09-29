import type {JSX} from "react";
import {RiLogoutBoxRLine, RiUserLine} from "@remixicon/react";
import {Link, useNavigate} from "react-router-dom";
import {logout} from "../../api/services/auth";
import {useSession} from "../../hooks/useSession";
import Brand from "./Brand";

export default function Navbar(): JSX.Element {
	const navigate = useNavigate();
	const session = useSession();

	function handleLogout() {
		logout();
		navigate("/login", {replace: true});
	}

	return (
		<header className="bg-base-100/90 border-base-300 sticky top-0 z-30 border-b backdrop-blur-xl">
			<nav className="navbar mx-auto min-h-16 max-w-7xl px-2 sm:px-4">
				<div className="navbar-start gap-1">
					<label htmlFor="my-drawer-4" aria-label="open sidebar" className="btn btn-square btn-ghost">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="inline-block size-5">
							<path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
							<path d="M9 4v16" />
							<path d="M14 10l2 2l-2 2" />
						</svg>
					</label>
					<Link to="/" className="ml-1"><Brand /></Link>
				</div>

				<div className="navbar-end gap-2">
					<button type="button" aria-label="notifications" className="btn btn-ghost btn-circle btn-sm">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="inline-block size-5">
							<path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
							<path d="M9 17v1a3 3 0 0 0 6 0v-1" />
						</svg>
					</button>

					<div className="dropdown dropdown-end">
						<button
							type="button"
							tabIndex={0}
							className="btn btn-ghost btn-circle avatar placeholder">
							<div className="bg-primary text-primary-content w-8 rounded-full"><span className="text-xs font-semibold">TL</span></div>
						</button>
						<ul
							tabIndex={0}
							className="menu dropdown-content bg-base-100 border-base-300 rounded-box z-20 mt-3 w-56 border p-2 shadow-sm">
							{session && (
								<li className="menu-title px-3 py-1.5">
									<span className="text-base-content block truncate text-sm font-medium normal-case">
										{session.user.name}
									</span>
									<span className="text-base-content/60 block truncate text-xs font-normal normal-case">
										{session.user.email}
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
