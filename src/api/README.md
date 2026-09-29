# API

Camada de consumo de API, independente de React/DaisyUI — nada aqui importa componentes de UI.

```text
api/
├── client.ts          transporte HTTP (fetch, headers, auth token, parsing)
├── errors.ts          ApiError + taxonomia de erro (network/validation/unauthorized/not_found/server)
├── session.ts          sessão mockada (localStorage) — único lugar que chama setAuthToken
├── types/              um arquivo por entidade de domínio
│   └── user.ts         User, UserRole, UserStatus
└── services/
    ├── auth.ts        login, logout, getCurrentUser
    └── users.ts       getUsers, getUser, createUser, updateUser, deleteUser
```

## Responsabilidades

- **`client.ts`**: URL base (`VITE_API_URL`), `Content-Type`, serialização do body, token de autenticação (`setAuthToken`, guardado em memória e anexado como `Authorization` automaticamente), e conversão de qualquer falha em `ApiError`.
- **`errors.ts`**: `ApiError` com `kind` (`network`, `validation`, `unauthorized`, `not_found`, `server`, `unknown`) — a UI decide como exibir cada caso; nenhum `Toast`/`Alert` é importado aqui.
- **`session.ts`**: sessão mockada (usuário + token) persistida em `localStorage`, sincronizada com `client.ts` via `setAuthToken`. Consumida pela UI através do hook `hooks/useSession.ts` (não vive em `api/` porque usa React).
- **`types/*.ts`**: um arquivo por entidade de domínio (`User` hoje; `Candidate`, `Job`, `Evaluation` depois) — tipos que os services devolvem, sem lógica.
- **`services/*.ts`**: uma função por operação de domínio, sem lógica de header/token/URL — só chamam `apiClient.get/post/patch/delete` (ou, por ora, o mock de `auth.ts`).
