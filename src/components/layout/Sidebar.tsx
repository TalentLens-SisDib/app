import {RiHomeLine, RiUserLine} from "@remixicon/react";
import type {JSX} from "react";
import {NavLink} from "react-router-dom";

export default function Sidebar(): JSX.Element {
	return (
		<div className="drawer-side is-drawer-close:overflow-visible z-40">
			<label
				htmlFor="my-drawer-4"
				aria-label="close sidebar"
				className="drawer-overlay"></label>

			<div className="bg-base-100 border-base-300 is-drawer-close:w-16 is-drawer-open:w-64 flex min-h-full flex-col border-r shadow-sm">
				<div className="is-drawer-close:justify-center flex h-16 items-center px-4">
					<span className="text-primary is-drawer-close:hidden text-sm font-bold tracking-wide uppercase">
						Menu
					</span>
				</div>

				<ul className="menu w-full grow gap-1 px-2 py-3">
					<li className="menu-title is-drawer-close:hidden text-base-content/45 px-3 text-[0.6875rem] font-semibold tracking-wider uppercase">
						Principal
					</li>
					<li>
						<NavLink
							to="/"
							end
							className={({isActive}) =>
								[
									"is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:flex is-drawer-close:items-center is-drawer-close:justify-center p-2",
									isActive && "menu-active",
								]
									.filter(Boolean)
									.join(" ")
							}
							data-tip="Homepage">
							<RiHomeLine />
							<span className="is-drawer-close:hidden">Homepage</span>
						</NavLink>
					</li>

					<li>
						<NavLink
							to="/usuarios"
							className={({isActive}) =>
								[
									"is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:flex is-drawer-close:items-center is-drawer-close:justify-center p-2",
									isActive && "menu-active",
								]
									.filter(Boolean)
									.join(" ")
							}
							data-tip="Usuários">
							<RiUserLine />
							<span className="is-drawer-close:hidden">Usuários</span>
						</NavLink>
					</li>
				</ul>
				<p className="is-drawer-close:hidden text-base-content/50 px-4 py-3 text-xs">
					v0.1.0
				</p>
			</div>
		</div>
	);
}
