import type {JSX, ReactNode} from "react";

type PageHeaderProps = {
	title: string;
	breadcrumbs?: {label: string; href: string}[];
	actions?: ReactNode;
};

export default function PageHeader({
	title,
	breadcrumbs = [],
	actions,
}: PageHeaderProps): JSX.Element {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="text-base-content text-2xl font-bold tracking-tight sm:text-3xl">
					{title}
				</h1>
				{breadcrumbs.length > 0 && (
					<nav aria-label="Breadcrumb" className="mt-2">
						<ol className="flex flex-wrap items-center gap-2 text-sm">
							{breadcrumbs.map(
								(crumb: {label: string; href: string}, index: number) => {
									const isLast = index === breadcrumbs.length - 1;
									return (
										<li key={index} className="flex items-center gap-2">
											{isLast ? (
												<span
													aria-current="page"
													className="text-base-content font-medium">
													{crumb.label}
												</span>
											) : (
												<a
													href={crumb.href}
													className="text-base-content/60 hover:text-base-content">
													{crumb.label}
												</a>
											)}
											{!isLast && (
												<span className="text-base-content/45">/</span>
											)}
										</li>
									);
								},
							)}
						</ol>
					</nav>
				)}
			</div>
			{actions && (
				<div className="flex items-center gap-2 sm:justify-end">{actions}</div>
			)}
		</div>
	);
}
