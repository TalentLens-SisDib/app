import {useMemo, useState, type FormEvent, type JSX} from "react";
import {RiAddLine, RiDeleteBinLine, RiEditLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {Alert, Badge, Button, Card, Dialog, Input, Select, Spinner} from "../components/ui";
import {toast} from "../components/ui/toastStore";
import {isApiError} from "../api/errors";
import {useUsers} from "../hooks/useUsers";
import type {CreateUserInput, User, UserRole, UserStatus} from "../types/user";

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

const GENERIC_FORM_ERROR = "Não foi possível salvar o usuário. Tente novamente.";
const GENERIC_DELETE_ERROR = "Não foi possível remover o usuário. Tente novamente.";

export default function Users(): JSX.Element {
	const {users, loading, error, reload, create, update, remove} = useUsers();
	const [search, setSearch] = useState("");

	const [formOpen, setFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [errors, setErrors] = useState<FormErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
	const [deleting, setDeleting] = useState(false);

	const filteredUsers = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return users;
		return users.filter(
			(user) =>
				user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
		);
	}, [users, search]);

	function openCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setErrors({});
		setFormError(null);
		setFormOpen(true);
	}

	function openEdit(user: User) {
		setEditingId(user.id);
		setForm({name: user.name, email: user.email, role: user.role, status: user.status});
		setErrors({});
		setFormError(null);
		setFormOpen(true);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const nextErrors: FormErrors = {};
		if (!form.name.trim()) nextErrors.name = "Informe o nome.";
		if (!form.email.trim()) nextErrors.email = "Informe o e-mail.";
		else if (!/^\S+@\S+\.\S+$/.test(form.email))
			nextErrors.email = "Informe um e-mail válido.";

		setErrors(nextErrors);
		setFormError(null);
		if (Object.keys(nextErrors).length > 0) return;

		setSubmitting(true);
		try {
			if (editingId) {
				await update(editingId, form);
				toast.success("Usuário atualizado com sucesso");
			} else {
				await create(form as CreateUserInput);
				toast.success("Usuário criado com sucesso");
			}
			setFormOpen(false);
		} catch (err) {
			setFormError(isApiError(err) ? err.message : GENERIC_FORM_ERROR);
		} finally {
			setSubmitting(false);
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await remove(deleteTarget.id);
			toast.success("Usuário removido com sucesso");
			setDeleteTarget(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : GENERIC_DELETE_ERROR);
		} finally {
			setDeleting(false);
		}
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
				{error ? (
					<Alert variant="error" title="Não foi possível carregar os usuários">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<span>{error}</span>
							<Button size="xs" variant="ghost" onClick={reload}>
								Tentar novamente
							</Button>
						</div>
					</Alert>
				) : loading ? (
					<div className="flex flex-col items-center justify-center gap-3 py-16">
						<Spinner />
						<p className="text-base-content/60 text-sm">Carregando usuários...</p>
					</div>
				) : users.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
						<p className="text-base-content/60 text-sm">Nenhum usuário encontrado.</p>
						<Button size="sm" onClick={openCreate}>
							<RiAddLine className="size-4" />
							Adicionar usuário
						</Button>
					</div>
				) : (
					<>
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
								Nenhum usuário encontrado para essa busca.
							</p>
						) : (
							<>
								{/* Desktop/tablet: tabela */}
								<div className="hidden overflow-x-auto sm:block">
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

								{/* Mobile: lista de cards, sem overflow horizontal */}
								<ul className="list sm:hidden">
									{filteredUsers.map((user) => (
										<li key={user.id} className="list-row items-center">
											<div className="list-col-grow min-w-0">
												<p className="truncate font-medium">{user.name}</p>
												<p className="text-base-content/60 truncate text-sm">
													{user.email}
												</p>
												<div className="mt-1.5 flex items-center gap-2 text-sm">
													<span className="text-base-content/70">
														{roleLabel[user.role]}
													</span>
													<Badge
														size="sm"
														variant={user.status === "active" ? "success" : "ghost"}>
														{user.status === "active" ? "Ativo" : "Inativo"}
													</Badge>
												</div>
											</div>
											<div className="flex gap-1">
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
										</li>
									))}
								</ul>
							</>
						)}
					</>
				)}
			</Card>

			<Dialog
				open={formOpen}
				onClose={() => !submitting && setFormOpen(false)}
				title={editingId ? "Editar usuário" : "Criar usuário"}
				actions={
					<>
						<Button variant="ghost" disabled={submitting} onClick={() => setFormOpen(false)}>
							Cancelar
						</Button>
						<Button type="submit" form="user-form" loading={submitting}>
							{editingId ? "Salvar" : "Criar"}
						</Button>
					</>
				}>
				<form id="user-form" className="space-y-4" noValidate onSubmit={handleSubmit}>
					{formError && (
						<Alert variant="error" title="Não foi possível salvar">
							{formError}
						</Alert>
					)}

					<Input
						label="Nome"
						placeholder="Nome completo"
						value={form.name}
						onChange={(event) => setForm((prev) => ({...prev, name: event.target.value}))}
						error={errors.name}
					/>
					<Input
						label="E-mail"
						type="email"
						placeholder="nome@empresa.com"
						value={form.email}
						onChange={(event) => setForm((prev) => ({...prev, email: event.target.value}))}
						error={errors.email}
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						<Select
							label="Papel"
							value={form.role}
							onChange={(event) =>
								setForm((prev) => ({...prev, role: event.target.value as UserRole}))
							}>
							<option value="admin">Administrador</option>
							<option value="recruiter">Recrutador</option>
							<option value="manager">Gestor</option>
						</Select>
						<Select
							label="Status"
							value={form.status}
							onChange={(event) =>
								setForm((prev) => ({...prev, status: event.target.value as UserStatus}))
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
						<Button variant="ghost" disabled={deleting} onClick={() => setDeleteTarget(null)}>
							Cancelar
						</Button>
						<Button variant="error" loading={deleting} onClick={confirmDelete}>
							Remover
						</Button>
					</>
				}>
				<p>
					Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Essa ação não
					poderá ser desfeita.
				</p>
			</Dialog>
		</>
	);
}
