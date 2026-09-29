import type {User} from "../types/user";

export const mockUsers: User[] = [
	{id: "1", name: "Ana Souza", email: "ana.souza@talentlens.com", role: "admin", status: "active"},
	{id: "2", name: "Bruno Lima", email: "bruno.lima@talentlens.com", role: "recruiter", status: "active"},
	{id: "3", name: "Carla Mendes", email: "carla.mendes@talentlens.com", role: "manager", status: "inactive"},
];
