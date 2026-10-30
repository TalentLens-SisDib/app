import type {JSX, ReactNode} from "react";
import {Link} from "react-router-dom";

type PageHeaderProps = {
	title: string;
	/** Linha curta acima do título (ex.: data de hoje). */
	eyebrow?: ReactNode;
	/** Contexto da página, abaixo do título. */
	description?: ReactNode;
	breadcrumbs?: {label: string; href: string}[];
	actions?: ReactNode;
};

export default function PageHeader({
	title,
	eyebrow,
	description,
	breadcrumbs = [],
	actions,
}: PageHeaderProps): JSX.Element {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
			<div>
				{eyebrow && <p className="text-base-content/55 mb-1.5 text-xs font-medium">{eyebrow}</p>}
				<h1 className="text-base-content text-2xl font-bold tracking-tight sm:text-3xl">
					{title}
				</h1>
				{description && (
					<p className="text-base-content/60 mt-1.5 max-w-2xl text-sm leading-6">{description}</p>
				)}
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
												<Link
													to={crumb.href}
													className="text-base-content/60 hover:text-base-content">
													{crumb.label}
												</Link>
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
