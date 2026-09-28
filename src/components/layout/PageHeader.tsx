import type {JSX, ReactNode} from "react";

type PageHeaderProps = {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
};

export default function PageHeader({
	title,
	subtitle,
	actions,
}: PageHeaderProps): JSX.Element {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="text-base-content text-2xl font-semibold tracking-tight">
					{title}
				</h1>
				{subtitle && (
					<p className="text-base-content/60 mt-1 text-sm">{subtitle}</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}
