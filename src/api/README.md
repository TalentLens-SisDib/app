# API

Camada de consumo de API, independente de React/DaisyUI — nada aqui importa componentes de UI.

```text
api/
├── client.ts          transporte HTTP (fetch, headers, auth token, multipart, parsing)
├── errors.ts          ApiError + taxonomia de erro (network/validation/unauthorized/not_found/server)
├── session.ts          sessão mockada (localStorage) — único lugar que chama setAuthToken
├── types/              um arquivo por entidade de domínio
│   └── user.ts         User, UserRole, UserStatus
└── services/
    ├── auth.ts        login, logout, getCurrentUser
    ├── users.ts       getUsers, getUser, createUser, updateUser, deleteUser
    ├── profiles.ts    getProfiles, getProfile, uploadCv, deleteProfile
    └── resumeImports.ts  seleção de arquivos + importação de currículos (upload e polling)
```

## Responsabilidades

- **`client.ts`**: URL base (`VITE_API_URL`), `Content-Type`, serialização do body, token de autenticação (`setAuthToken`, guardado em memória e anexado como `Authorization` automaticamente), e conversão de qualquer falha em `ApiError`.
- **`errors.ts`**: `ApiError` com `kind` (`network`, `validation`, `unauthorized`, `not_found`, `server`, `unknown`) — a UI decide como exibir cada caso; nenhum `Toast`/`Alert` é importado aqui.
- **`session.ts`**: sessão mockada (usuário + token) persistida em `localStorage`, sincronizada com `client.ts` via `setAuthToken`. Consumida pela UI através do hook `hooks/useSession.ts` (não vive em `api/` porque usa React).
- **`types/*.ts`**: um arquivo por entidade de domínio (`User` hoje; `Candidate`, `Job`, `Evaluation` depois) — tipos que os services devolvem, sem lógica.
- **`services/*.ts`**: uma função por operação de domínio, sem lógica de header/token/URL — só chamam `apiClient.get/post/patch/delete` (ou, por ora, o mock de `auth.ts`).

## Importação de currículos (polling)

`services/resumeImports.ts` é o único service com fluxo de várias etapas, porque a
API não expõe um recurso de "job de importação" — o acompanhamento é feito pelo cliente:

1. `selectResumeFiles` valida a seleção do usuário (formato, 10 MB por arquivo, 50 por importação).
2. Para cada currículo, `uploadCv` envia o arquivo em `multipart/form-data` para
   `POST /profiles/upload-cv` (campo `cv`), que cria o perfil do candidato.
3. `GET /profiles/{id}` é consultado a cada `POLL_INTERVAL_MS` até o perfil ficar
   completo (resumo + competências extraídos) ou atingir `POLL_TIMEOUT_MS`.
4. O desfecho de cada arquivo sai dos dados realmente extraídos: `done` quando o
   perfil está completo, `attention` com a lista do que faltou, `failed` quando o
   upload ou a leitura falhou.

`importResumes` emite cada transição em `onProgress` (consumido por `hooks/useResumeImport.ts`),
aceita um `AbortSignal` para cancelamento e interrompe a importação inteira apenas
quando o erro não é do arquivo (sessão expirada ou API fora do ar).

Hoje a leitura automática da API aceita só PDF; `DOCX`/`DOC` são aceitos na seleção,
mas devolvidos como `failed` com essa justificativa até o backend suportá-los.
