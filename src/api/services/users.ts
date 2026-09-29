import {mockUsers} from "../../mocks/users";
import type {CreateUserInput, UpdateUserInput, User} from "../../types/user";
import {ApiError} from "../errors";

// Mock: sem backend ainda, as operações acontecem sobre uma cópia em
// memória de `mocks/users.ts`. Trocar o corpo destas funções por chamadas
// em `apiClient` quando a API existir — a assinatura não muda.
let users: User[] = [...mockUsers];

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function notFound(id: string): ApiError {
	return new ApiError(`Usuário "${id}" não encontrado.`, "not_found", 404);
}

export async function getUsers(): Promise<User[]> {
	await delay(500);
	return users;
}

export async function getUser(id: string): Promise<User> {
	await delay(300);
	const user = users.find((item) => item.id === id);
	if (!user) throw notFound(id);
	return user;
}

export async function createUser(data: CreateUserInput): Promise<User> {
	await delay(500);
	const user: User = {id: crypto.randomUUID(), ...data};
	users = [...users, user];
	return user;
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
	await delay(500);
	const index = users.findIndex((item) => item.id === id);
	if (index === -1) throw notFound(id);

	const updated: User = {...users[index], ...data};
	users = users.map((item, i) => (i === index ? updated : item));
	return updated;
}

export async function deleteUser(id: string): Promise<void> {
	await delay(500);
	if (!users.some((item) => item.id === id)) throw notFound(id);
	users = users.filter((item) => item.id !== id);
}
