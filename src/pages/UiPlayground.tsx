import {useState, type JSX, type ReactNode} from "react";
import Layout from "../components/layout/Layout";
import PageHeader from "../components/layout/PageHeader";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Dialog from "../components/ui/Dialog";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Spinner from "../components/ui/Spinner";
import {toast} from "../components/ui/toastStore";

function Section({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}): JSX.Element {
	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-base-content text-base font-semibold">{title}</h2>
				<p className="text-base-content/60 mt-1 text-sm">Variações e estados disponíveis para este componente.</p>
			</div>
			<div className="border-base-300 rounded-box border bg-base-100 p-4 shadow-sm sm:p-5">
				<div className="flex flex-wrap items-center gap-3">{children}</div>
			</div>
		</section>
	);
}

export default function UiPlayground(): JSX.Element {
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectValue, setSelectValue] = useState("pending");

	function simulateLoading() {
		setLoading(true);
		setTimeout(() => setLoading(false), 1500);
	}

	return (
		<Layout>
			<div className="space-y-10">
			<PageHeader
				title="UI Playground"
				breadcrumbs={[
					{label: "Home", href: "/"},
					{label: "UI Playground", href: "/ui-playground"},
				]}
			/>

			<Section title="Button">
				<Button>Padrão</Button>
				<Button variant="primary">Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="success">Success</Button>
				<Button variant="error">Error</Button>
				<Button size="xs">XS</Button>
				<Button size="sm">SM</Button>
				<Button size="lg">LG</Button>
				<Button disabled>Desabilitado</Button>
				<Button loading={loading} onClick={simulateLoading}>
					{loading ? "Salvando..." : "Simular loading"}
				</Button>
			</Section>

			<Section title="Badge">
				<Badge variant="success">Aprovado</Badge>
				<Badge variant="warning">Em análise</Badge>
				<Badge variant="error">Reprovado</Badge>
				<Badge variant="info">Novo</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge size="lg" variant="primary">
					Grande
				</Badge>
			</Section>

			<Section title="Alert">
				<div className="flex w-full flex-col gap-3">
					<Alert variant="info">O processamento foi iniciado.</Alert>
					<Alert variant="success">Candidato salvo com sucesso.</Alert>
					<Alert
						variant="warning"
						title="Atenção"
						onClose={() => toast.info("Alerta fechado")}>
						Existem campos que precisam ser revisados.
					</Alert>
					<Alert variant="error">Não foi possível salvar o candidato.</Alert>
				</div>
			</Section>

			<Section title="Spinner">
				<Spinner size="xs" />
				<Spinner size="sm" />
				<Spinner size="md" />
				<Spinner size="lg" />
			</Section>

			<Section title="Input">
				<div className="grid w-full gap-4 sm:grid-cols-2">
					<Input label="Nome" placeholder="Digite o nome" />
					<Input
						label="E-mail"
						type="email"
						placeholder="nome@empresa.com"
						error="Informe um e-mail válido"
					/>
					<Input
						label="Telefone"
						placeholder="(00) 00000-0000"
						helperText="Opcional"
					/>
					<Input label="Cargo" required placeholder="Ex: Desenvolvedor" />
				</div>
			</Section>

			<Section title="Select">
				<div className="grid w-full gap-4 sm:grid-cols-2">
					<Select
						label="Status"
						value={selectValue}
						onChange={(event) => setSelectValue(event.target.value)}>
						<option value="pending">Em análise</option>
						<option value="approved">Aprovado</option>
						<option value="rejected">Reprovado</option>
					</Select>
					<Select label="Prioridade" error="Selecione uma opção">
						<option value="">Selecione...</option>
						<option value="low">Baixa</option>
						<option value="high">Alta</option>
					</Select>
				</div>
			</Section>

			<Section title="Card">
				<div className="grid w-full gap-4 sm:grid-cols-2">
					<Card
						title="Dados do candidato"
						description="Informações básicas de cadastro">
						<p className="text-sm">
							Nome, e-mail e telefone preenchidos no formulário anterior.
						</p>
					</Card>
					<Card
						title="Ações"
						actions={
							<>
								<Button variant="ghost" size="sm">
									Cancelar
								</Button>
								<Button variant="primary" size="sm">
									Salvar
								</Button>
							</>
						}>
						<p className="text-sm">Card com área de ações no rodapé.</p>
					</Card>
				</div>
			</Section>

			<Section title="Dialog">
				<Button variant="error" onClick={() => setDialogOpen(true)}>
					Excluir candidato
				</Button>
				<Dialog
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
					title="Excluir candidato?"
					actions={
						<>
							<Button variant="ghost" onClick={() => setDialogOpen(false)}>
								Cancelar
							</Button>
							<Button
								variant="error"
								onClick={() => {
									setDialogOpen(false);
									toast.success("Candidato excluído");
								}}>
								Excluir
							</Button>
						</>
					}>
					<p>Essa ação não poderá ser desfeita.</p>
				</Dialog>
			</Section>

			<Section title="Toast">
				<Button variant="success" onClick={() => toast.success("Candidato salvo com sucesso")}>
					success
				</Button>
				<Button variant="error" onClick={() => toast.error("Não foi possível salvar o candidato")}>
					error
				</Button>
				<Button variant="outline" onClick={() => toast.info("O processamento foi iniciado")}>
					info
				</Button>
				<Button variant="secondary" onClick={() => toast.warning("Alguns dados precisam ser revisados")}>
					warning
				</Button>
			</Section>
			</div>
		</Layout>
	);
}
