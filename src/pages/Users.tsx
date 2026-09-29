import type {JSX} from "react";
import PageHeader from "../components/layout/PageHeader";
import {Button, Card} from "../components/ui";

export default function Users(): JSX.Element {
	return (
		<>
			<PageHeader
				title="Usuários"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Usuários", href: "/usuarios"},
				]}
				actions={<Button size="sm">Criar usuário</Button>}
			/>

			<Card>tabela</Card>
		</>
	);
}
