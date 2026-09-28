import type {JSX} from "react";
import PageHeader from "../components/layout/PageHeader";
import {Button, Card} from "../components/ui";

export default function Dashboard(): JSX.Element {
	return (
		<>
			<PageHeader
				title="Dashboard"
				breadcrumbs={[{label: "Home", href: "/"}]}
				actions={<Button size="sm">Nova ação</Button>}
			/>

			<Card
				title="Visão geral"
				description="Acompanhe as informações e atividades mais relevantes da sua conta.">
				<p className="text-base-content/70 text-sm leading-6">
					Conteúdo da página.
				</p>
			</Card>
		</>
	);
}
