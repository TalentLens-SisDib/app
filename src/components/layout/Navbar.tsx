import type {JSX} from "react";

function BrandMark(): JSX.Element {
	return (
		<span className="tl-brand-mark" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
				<circle cx="10" cy="10" r="4.5" />
				<path d="m13.5 13.5 4.5 4.5" strokeLinecap="round" />
				<path d="M8 10h4M10 8v4" strokeLinecap="round" />
			</svg>
		</span>
	);
}

export default function Navbar(): JSX.Element {
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
					<div className="ml-1 flex items-center gap-2.5">
						<BrandMark />
						<span className="tl-wordmark text-lg">Talent<span className="text-primary">Lens</span></span>
					</div>
				</div>

				<div className="navbar-end gap-2">
					<button type="button" aria-label="notifications" className="btn btn-ghost btn-circle btn-sm">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="inline-block size-5">
							<path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
							<path d="M9 17v1a3 3 0 0 0 6 0v-1" />
						</svg>
					</button>

					<div className="dropdown dropdown-end">
						<button type="button" className="btn btn-ghost btn-circle avatar placeholder">
							<div className="bg-primary text-primary-content w-8 rounded-full"><span className="text-xs font-semibold">TL</span></div>
						</button>
					</div>
				</div>
			</nav>
		</header>
	);
}
