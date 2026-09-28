import Layout from "./components/layout/Layout";
import PageHeader from "./components/layout/PageHeader";
import {Button, Card} from "./components/ui";

export default function App() {
	return (
		<Layout>
			<PageHeader
				title="Dashboard"
				breadcrumbs={[
					{label: "Home", href: "/"},
					{label: "Dashboard", href: "/dashboard"},
				]}
				actions={<Button size="sm">Nova ação</Button>}
			/>

			<Card
				title="Visão geral"
				description="Acompanhe as informações e atividades mais relevantes da sua conta.">
				<p className="text-base-content/70 text-sm leading-6">
					Conteúdo da página.
				</p>
			</Card>
		</Layout>
	);
}
