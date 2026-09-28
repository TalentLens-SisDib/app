import Layout from "./components/layout/Layout";
import PageHeader from "./components/layout/PageHeader";

export default function App() {
	return (
		<Layout>
			<PageHeader
				title="Dashboard"
				breadcrumbs={[
					{label: "Home", href: "/"},
					{label: "Dashboard", href: "/dashboard"},
				]}
				actions={
					<button type="button" className="btn btn-primary btn-sm">
						Nova ação
					</button>
				}
			/>

			<div className="card border-base-300 bg-base-100 border shadow-sm">
				<div className="card-body gap-2 p-5 sm:p-6">
					<h2 className="card-title text-lg">Visão geral</h2>
					<p className="text-base-content/65 text-sm">Conteúdo da página.</p>
				</div>
			</div>
		</Layout>
	);
}
