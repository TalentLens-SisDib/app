import type {JSX, ReactNode} from "react";
import {RiArrowRightSLine} from "@remixicon/react";
import {Link} from "react-router-dom";

type PageHeaderProps = {
	title: string;
	/** Linha curta acima do título (ex.: data de hoje). */
	eyebrow?: ReactNode;
	/** Contexto da página, abaixo do título. */
	description?: ReactNode;
	breadcrumbs?: {label: string; href: string}[];
	/** Ação principal à direita (um botão primário; secundárias antes dele). */
	actions?: ReactNode;
};

/**
 * Cabeçalho padrão das páginas: título + ação principal na mesma linha, depois o
 * caminho (breadcrumb) e a descrição. Compacto para o conteúdo começar cedo.
 */
export default function PageHeader({
	title,
	eyebrow,
	description,
	breadcrumbs = [],
	actions,
}: PageHeaderProps): JSX.Element {
	return (
		<div className="mb-5 sm:mb-6">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
				<div className="min-w-0">
					{eyebrow && <p className="text-base-content/55 mb-1 text-xs font-medium">{eyebrow}</p>}
					<h1 className="text-base-content truncate text-2xl font-semibold tracking-tight">{title}</h1>
				</div>
				{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
			</div>

			{breadcrumbs.length > 0 && (
				<nav aria-label="Breadcrumb" className="mt-1.5">
					<ol className="flex flex-wrap items-center gap-1 text-xs">
						{breadcrumbs.map((crumb, index) => {
							const isLast = index === breadcrumbs.length - 1;
							return (
								<li key={crumb.href + crumb.label} className="flex min-w-0 items-center gap-1">
									{isLast ? (
										<span aria-current="page" className="text-base-content/80 truncate font-medium">
											{crumb.label}
										</span>
									) : (
										<>
											<Link
												to={crumb.href}
												className="text-base-content/55 hover:text-base-content truncate transition-colors">
												{crumb.label}
											</Link>
											<RiArrowRightSLine aria-hidden="true" className="text-base-content/35 size-3.5 shrink-0" />
										</>
									)}
								</li>
							);
						})}
					</ol>
				</nav>
			)}

			{description && <p className="text-base-content/60 mt-2 max-w-2xl text-sm leading-6">{description}</p>}
		</div>
	);
}
