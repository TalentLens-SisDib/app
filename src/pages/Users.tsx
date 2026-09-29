import {useMemo, useState, type FormEvent, type JSX} from "react";
import {RiAddLine, RiDeleteBinLine, RiEditLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {Badge, Button, Card, Dialog, Input, Select} from "../components/ui";
import {toast} from "../components/ui/toastStore";

type UserRole = "admin" | "recruiter" | "manager";
type UserStatus = "active" | "inactive";

type UserRecord = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	status: UserStatus;
};

type FormState = {
	name: string;
	email: string;
	role: UserRole;
	status: UserStatus;
};

type FormErrors = Partial<Record<"name" | "email", string>>;

const roleLabel: Record<UserRole, string> = {
	admin: "Administrador",
	recruiter: "Recrutador",
	manager: "Gestor",
};

const emptyForm: FormState = {
	name: "",
	email: "",
	role: "recruiter",
	status: "active",
};

const initialUsers: UserRecord[] = [
	{
		id: "1",
		name: "Ana Souza",
		email: "ana.souza@talentlens.com",
		role: "admin",
		status: "active",
	},
	{
		id: "2",
		name: "Bruno Lima",
		email: "bruno.lima@talentlens.com",
		role: "recruiter",
		status: "active",
	},
	{
		id: "3",
		name: "Carla Mendes",
		email: "carla.mendes@talentlens.com",
		role: "manager",
		status: "inactive",
	},
];

export default function Users(): JSX.Element {
	const [users, setUsers] = useState<UserRecord[]>(initialUsers);
	const [search, setSearch] = useState("");

	const [formOpen, setFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [errors, setErrors] = useState<FormErrors>({});
	const [submitting, setSubmitting] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
	const [deleting, setDeleting] = useState(false);

	const filteredUsers = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return users;
		return users.filter(
			(user) =>
				user.name.toLowerCase().includes(term) ||
				user.email.toLowerCase().includes(term),
		);
	}, [users, search]);

	function openCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setErrors({});
		setFormOpen(true);
	}

	function openEdit(user: UserRecord) {
		setEditingId(user.id);
		setForm({
			name: user.name,
			email: user.email,
			role: user.role,
			status: user.status,
		});
		setErrors({});
		setFormOpen(true);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const nextErrors: FormErrors = {};
		if (!form.name.trim()) nextErrors.name = "Informe o nome.";
		if (!form.email.trim()) nextErrors.email = "Informe o e-mail.";
		else if (!/^\S+@\S+\.\S+$/.test(form.email))
			nextErrors.email = "Informe um e-mail válido.";

		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setSubmitting(true);
		window.setTimeout(() => {
			if (editingId) {
				setUsers((prev) =>
					prev.map((user) => (user.id === editingId ? {...user, ...form} : user)),
				);
				toast.success("Usuário atualizado com sucesso");
			} else {
				setUsers((prev) => [...prev, {id: crypto.randomUUID(), ...form}]);
				toast.success("Usuário criado com sucesso");
			}
			setSubmitting(false);
			setFormOpen(false);
		}, 700);
	}

	function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		window.setTimeout(() => {
			setUsers((prev) => prev.filter((user) => user.id !== deleteTarget.id));
			toast.success("Usuário removido com sucesso");
			setDeleting(false);
			setDeleteTarget(null);
		}, 700);
	}

	return (
		<>
			<PageHeader
				title="Usuários"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Usuários", href: "/usuarios"},
				]}
				actions={
					<Button size="sm" onClick={openCreate}>
						<RiAddLine className="size-4" />
						Criar usuário
					</Button>
				}
			/>

			<Card padding="sm">
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="sm:max-w-xs sm:flex-1">
						<Input
							aria-label="Buscar por nome ou e-mail"
							placeholder="Buscar por nome ou e-mail"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>
					<p className="text-base-content/60 shrink-0 text-sm">
						{filteredUsers.length} de {users.length} usuário(s)
					</p>
				</div>

				{filteredUsers.length === 0 ? (
					<p className="text-base-content/60 py-10 text-center text-sm">
						Nenhum usuário encontrado.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>Nome</th>
									<th>E-mail</th>
									<th>Papel</th>
									<th>Status</th>
									<th className="text-right">Ações</th>
								</tr>
							</thead>
							<tbody>
								{filteredUsers.map((user) => (
									<tr key={user.id}>
										<td className="font-medium">{user.name}</td>
										<td className="text-base-content/70">{user.email}</td>
										<td>{roleLabel[user.role]}</td>
										<td>
											<Badge
												variant={
													user.status === "active" ? "success" : "ghost"
												}>
												{user.status === "active" ? "Ativo" : "Inativo"}
											</Badge>
										</td>
										<td>
											<div className="flex justify-end gap-1">
												<button
													type="button"
													aria-label={`Editar ${user.name}`}
													onClick={() => openEdit(user)}
													className="btn btn-ghost btn-sm btn-square">
													<RiEditLine className="size-4" />
												</button>
												<button
													type="button"
													aria-label={`Remover ${user.name}`}
													onClick={() => setDeleteTarget(user)}
													className="btn btn-ghost btn-sm btn-square text-error">
													<RiDeleteBinLine className="size-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<Dialog
				open={formOpen}
				onClose={() => !submitting && setFormOpen(false)}
				title={editingId ? "Editar usuário" : "Criar usuário"}
				actions={
					<>
						<Button
							variant="ghost"
							disabled={submitting}
							onClick={() => setFormOpen(false)}>
							Cancelar
						</Button>
						<Button type="submit" form="user-form" loading={submitting}>
							{editingId ? "Salvar" : "Criar"}
						</Button>
					</>
				}>
				<form
					id="user-form"
					className="space-y-4"
					noValidate
					onSubmit={handleSubmit}>
					<Input
						label="Nome"
						placeholder="Nome completo"
						value={form.name}
						onChange={(event) =>
							setForm((prev) => ({...prev, name: event.target.value}))
						}
						error={errors.name}
					/>
					<Input
						label="E-mail"
						type="email"
						placeholder="nome@empresa.com"
						value={form.email}
						onChange={(event) =>
							setForm((prev) => ({...prev, email: event.target.value}))
						}
						error={errors.email}
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						<Select
							label="Papel"
							value={form.role}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									role: event.target.value as UserRole,
								}))
							}>
							<option value="admin">Administrador</option>
							<option value="recruiter">Recrutador</option>
							<option value="manager">Gestor</option>
						</Select>
						<Select
							label="Status"
							value={form.status}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									status: event.target.value as UserStatus,
								}))
							}>
							<option value="active">Ativo</option>
							<option value="inactive">Inativo</option>
						</Select>
					</div>
				</form>
			</Dialog>

			<Dialog
				open={deleteTarget !== null}
				onClose={() => !deleting && setDeleteTarget(null)}
				title="Remover usuário?"
				actions={
					<>
						<Button
							variant="ghost"
							disabled={deleting}
							onClick={() => setDeleteTarget(null)}>
							Cancelar
						</Button>
						<Button variant="error" loading={deleting} onClick={confirmDelete}>
							Remover
						</Button>
					</>
				}>
				<p>
					Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>?
					Essa ação não poderá ser desfeita.
				</p>
			</Dialog>
		</>
	);
}
