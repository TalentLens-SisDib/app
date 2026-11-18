import type {JSX} from "react";
import {Link, useNavigate} from "react-router-dom";
import {RiArrowLeftLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import ProfileEditor from "../components/profiles/ProfileEditor";
import {Card} from "../components/ui";
import {toast} from "../components/ui/toastStore";
import {createProfile} from "../api/services/profiles";
import type {CreateProfileInput} from "../types/profile";

export default function CreateCandidate(): JSX.Element {
	const navigate = useNavigate();

	async function handleCreate(data: CreateProfileInput) {
		const created = await createProfile(data);
		toast.success("Candidato cadastrado");
		navigate(`/candidatos/${created.id}`);
	}

	return (
		<>
			<PageHeader
				title="Novo candidato"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Candidatos", href: "/candidatos"},
					{label: "Novo candidato", href: "/candidatos/novo"},
				]}
				actions={
					<Link to="/candidatos" className="btn btn-ghost btn-sm">
						<RiArrowLeftLine className="size-4" />
						Voltar para candidatos
					</Link>
				}
			/>

			<Card
				title="Cadastro manual"
				description="Preencha os dados do candidato. Só o nome é obrigatório; o restante pode ser completado depois.">
				<ProfileEditor
					submitLabel="Cadastrar candidato"
					onCancel={() => navigate("/candidatos")}
					onSubmit={handleCreate}
				/>
			</Card>
		</>
	);
}
