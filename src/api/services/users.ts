import {apiClient} from "../client";
import type {CreateUserInput, UpdateUserInput, User} from "../../types/user";

export function getUsers(): Promise<User[]> {
	return apiClient.get<User[]>("/users");
}

export function getUser(id: number): Promise<User> {
	return apiClient.get<User>(`/users/${id}`);
}

export function createUser(data: CreateUserInput): Promise<User> {
	return apiClient.post<User>("/users", data);
}

export function updateUser(id: number, data: UpdateUserInput): Promise<User> {
	return apiClient.patch<User>(`/users/${id}`, data);
}

export function deleteUser(id: number): Promise<void> {
	return apiClient.delete<void>(`/users/${id}`);
}
