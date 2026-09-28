import type {JSX} from "react";

export default function Sidebar(): JSX.Element {
	return (
		<div className="drawer-side is-drawer-close:overflow-visible z-40">
			<label
				htmlFor="my-drawer-4"
				aria-label="close sidebar"
				className="drawer-overlay"></label>

			<div className="bg-base-200 border-base-300 is-drawer-close:w-16 is-drawer-open:w-64 flex min-h-full flex-col border-r">
				<div className="is-drawer-close:justify-center flex h-16 items-center px-4">
					<span className="text-primary is-drawer-close:hidden text-sm font-bold tracking-wide uppercase">
						Menu
					</span>
				</div>

				<ul className="menu w-full grow gap-1 px-2">
					<li className="menu-title is-drawer-close:hidden">Principal</li>
					<li>
						<a
							aria-current="page"
							className="menu-active is-drawer-close:tooltip is-drawer-close:tooltip-right"
							data-tip="Homepage">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								strokeLinejoin="round"
								strokeLinecap="round"
								strokeWidth="2"
								fill="none"
								stroke="currentColor"
								className="inline-block size-4 shrink-0">
								<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
								<path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
							</svg>
							<span className="is-drawer-close:hidden">Homepage</span>
						</a>
					</li>

					<li>
						<a
							className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
							data-tip="Settings">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								strokeLinejoin="round"
								strokeLinecap="round"
								strokeWidth="2"
								fill="none"
								stroke="currentColor"
								className="inline-block size-4 shrink-0">
								<path d="M20 7h-9"></path>
								<path d="M14 17H5"></path>
								<circle cx="17" cy="17" r="3"></circle>
								<circle cx="7" cy="7" r="3"></circle>
							</svg>
							<span className="is-drawer-close:hidden">Settings</span>
						</a>
					</li>
				</ul>

				<div className="divider my-0"></div>
				<p className="is-drawer-close:hidden text-base-content/50 px-4 py-3 text-xs">
					v0.1.0
				</p>
			</div>
		</div>
	);
}
