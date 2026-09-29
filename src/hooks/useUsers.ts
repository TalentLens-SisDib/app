import {useCallback, useEffect, useState} from "react";
import {isApiError} from "../api/errors";
import {createUser, deleteUser, getUsers, updateUser} from "../api/services/users";
import type {CreateUserInput, UpdateUserInput, User} from "../types/user";

const GENERIC_ERROR = "Não foi possível carregar os usuários.";

export function useUsers() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		let cancelled = false;

		getUsers()
			.then((data) => {
				if (!cancelled) setUsers(data);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(isApiError(err) ? err.message : GENERIC_ERROR);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [reloadToken]);

	const reload = useCallback(() => {
		setLoading(true);
		setError(null);
		setReloadToken((token) => token + 1);
	}, []);

	const create = useCallback(async (data: CreateUserInput) => {
		const user = await createUser(data);
		setUsers((prev) => [...prev, user]);
		return user;
	}, []);

	const update = useCallback(async (id: string, data: UpdateUserInput) => {
		const user = await updateUser(id, data);
		setUsers((prev) => prev.map((item) => (item.id === id ? user : item)));
		return user;
	}, []);

	const remove = useCallback(async (id: string) => {
		await deleteUser(id);
		setUsers((prev) => prev.filter((item) => item.id !== id));
	}, []);

	return {users, loading, error, reload, create, update, remove};
}
