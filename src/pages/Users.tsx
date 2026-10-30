import {useMemo, useState, type SubmitEvent, type JSX} from "react";
import {RiAddLine, RiDeleteBinLine, RiEditLine, RiSearchLine, RiUserSettingsLine} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import {
	Alert,
	Avatar,
	Badge,
	Button,
	Dialog,
	EmptyState,
	ErrorState,
	IconAction,
	Input,
	ListToolbar,
	Pagination,
	SearchInput,
	Select,
	TableSkeleton,
} from "../components/ui";
import {toast} from "../components/ui/toastStore";
import {isApiError} from "../api/errors";
import {usePagination} from "../hooks/usePagination";
import {useSession} from "../hooks/useSession";
import {useUsers} from "../hooks/useUsers";
import type {CreateUserInput, User, UserRole} from "../types/user";

type FormState = {
	name: string;
	email: string;
	password: string;
	role: UserRole;
};

type FormErrors = Partial<Record<"name" | "email" | "password", string>>;

const roleLabel: Record<UserRole, string> = {
	Admin: "Administrador",
	Recruiter: "Recrutador",
};

const emptyForm: FormState = {
	name: "",
	email: "",
	password: "",
	role: "Recruiter",
};

const GENERIC_FORM_ERROR = "Não foi possível salvar o usuário. Tente novamente.";
const GENERIC_DELETE_ERROR = "Não foi possível remover o usuário. Tente novamente.";

export default function Users(): JSX.Element {
	const session = useSession();
	const {users, loading, error, reload, create, update, remove} = useUsers();
	const [search, setSearch] = useState("");

	const [formOpen, setFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
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
	const pagination = usePagination(filteredUsers);

	function openCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setErrors({});
		setFormError(null);
		setFormOpen(true);
	}

	function openEdit(user: User) {
		setEditingId(user.id);
		setForm({name: user.name, email: user.email, password: "", role: user.role});
		setErrors({});
		setFormError(null);
		setFormOpen(true);
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;

		const nextErrors: FormErrors = {};
		if (!form.name.trim()) nextErrors.name = "Informe o nome.";
		if (!form.email.trim()) nextErrors.email = "Informe o e-mail.";
		else if (!/^\S+@\S+\.\S+$/.test(form.email))
			nextErrors.email = "Informe um e-mail válido.";
		if (!editingId && form.password.length < 8)
			nextErrors.password = "A senha deve ter ao menos 8 caracteres.";
		else if (editingId && form.password && form.password.length < 8)
			nextErrors.password = "A senha deve ter ao menos 8 caracteres.";

		setErrors(nextErrors);
		setFormError(null);
		if (Object.keys(nextErrors).length > 0) return;

		setSubmitting(true);
		try {
			if (editingId) {
				const {password, ...rest} = form;
				await update(editingId, password ? {...rest, password} : rest);
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

	function renderIdentity(user: User) {
		const isMe = session?.user.id === user.id;
		return (
			<div className="flex min-w-0 items-center gap-3">
				<Avatar name={user.name} />
				<div className="min-w-0">
					<p className="flex items-center gap-2 text-sm font-medium">
						<span className="truncate">{user.name}</span>
						{isMe && (
							<Badge size="xs" variant="neutral">
								Você
							</Badge>
						)}
					</p>
					<p className="text-base-content/55 truncate text-xs">{user.email}</p>
				</div>
			</div>
		);
	}

	function renderRole(user: User) {
		return (
			<Badge size="sm" variant={user.role === "Admin" ? "primary" : "neutral"}>
				{roleLabel[user.role]}
			</Badge>
		);
	}

	function renderActions(user: User) {
		return (
			<div className="tl-row-actions flex justify-end gap-0.5">
				<IconAction
					label={`Editar ${user.name}`}
					icon={<RiEditLine className="size-4" />}
					tooltipPosition="left"
					onClick={() => openEdit(user)}
				/>
				<IconAction
					label={`Remover ${user.name}`}
					icon={<RiDeleteBinLine className="size-4" />}
					tooltipPosition="left"
					danger
					onClick={() => setDeleteTarget(user)}
				/>
			</div>
		);
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

			<ListToolbar
				count={
					!loading && !error
						? search.trim()
							? `${filteredUsers.length} de ${users.length} usuários`
							: `${users.length} ${users.length === 1 ? "usuário" : "usuários"}`
						: undefined
				}>
				<SearchInput
					label="Buscar por nome ou e-mail"
					value={search}
					onChange={setSearch}
					className="sm:w-80"
				/>
			</ListToolbar>

			{error ? (
				<ErrorState title="Não foi possível carregar os usuários" message={error} onRetry={reload} />
			) : loading ? (
				<TableSkeleton label="Carregando usuários" columns={3} />
			) : users.length === 0 ? (
				<EmptyState
					icon={<RiUserSettingsLine className="size-5" />}
					title="Nenhum usuário cadastrado"
					description="Convide recrutadores e administradores para trabalhar nas vagas da empresa."
					action={
						<Button size="sm" onClick={openCreate}>
							<RiAddLine className="size-4" />
							Criar usuário
						</Button>
					}
				/>
			) : filteredUsers.length === 0 ? (
				<EmptyState
					icon={<RiSearchLine className="size-5" />}
					title="Nenhum usuário encontrado"
					description={<>Nenhum usuário corresponde a “{search.trim()}”.</>}
					action={
						<Button size="sm" variant="ghost" onClick={() => setSearch("")}>
							Limpar busca
						</Button>
					}
				/>
			) : (
				<div className="tl-panel overflow-hidden">
					{/* Desktop/tablet: tabela */}
					<table className="tl-table hidden table-fixed sm:table">
						<colgroup>
							<col />
							<col className="w-40" />
							<col className="w-24" />
						</colgroup>
						<thead>
							<tr>
								<th scope="col">Usuário</th>
								<th scope="col">Papel</th>
								<th scope="col" className="text-right">
									<span className="sr-only">Ações</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{pagination.pageItems.map((user) => (
								<tr key={user.id}>
									<td className="py-2">{renderIdentity(user)}</td>
									<td>{renderRole(user)}</td>
									<td className="py-0">{renderActions(user)}</td>
								</tr>
							))}
						</tbody>
					</table>

					{/* Mobile: lista, sem overflow horizontal */}
					<ul className="divide-base-300 divide-y sm:hidden">
						{pagination.pageItems.map((user) => (
							<li key={user.id} className="flex items-center gap-3 px-4 py-3">
								<div className="min-w-0 flex-1">
									{renderIdentity(user)}
									<div className="mt-2 pl-12">{renderRole(user)}</div>
								</div>
								{renderActions(user)}
							</li>
						))}
					</ul>

					<Pagination
						page={pagination.page}
						pageCount={pagination.pageCount}
						pageSize={pagination.pageSize}
						total={pagination.total}
						onPageChange={pagination.setPage}
						noun="usuários"
					/>
				</div>
			)}

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
					<Input
						label="Senha"
						type="password"
						placeholder={editingId ? "Deixe em branco para manter" : "Mínimo de 8 caracteres"}
						value={form.password}
						onChange={(event) => setForm((prev) => ({...prev, password: event.target.value}))}
						error={errors.password}
					/>
					<Select
						label="Papel"
						value={form.role}
						onChange={(event) =>
							setForm((prev) => ({...prev, role: event.target.value as UserRole}))
						}>
						<option value="Admin">Administrador</option>
						<option value="Recruiter">Recrutador</option>
					</Select>
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
