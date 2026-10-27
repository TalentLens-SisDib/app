# API

Camada de consumo de API, independente de React/DaisyUI — nada aqui importa componentes de UI.

```text
api/
├── client.ts          transporte HTTP (fetch, headers, auth token, renovação em 401, multipart, parsing)
├── errors.ts          ApiError + taxonomia de erro (network/validation/unauthorized/not_found/server)
├── session.ts          sessão (usuário + tokens, localStorage) — único lugar que chama setAuthToken
├── types/              um arquivo por entidade de domínio
│   └── user.ts         User, UserRole, UserStatus
└── services/
    ├── auth.ts        login, logout, getCurrentUser, initAuth (renovação automática do token)
    ├── users.ts       getUsers, getUser, createUser, updateUser, deleteUser
    ├── profiles.ts    getProfiles, getProfile, uploadCv, deleteProfile
    ├── skills.ts      getSkills, createSkill, updateSkill, deleteSkill
    ├── jobOpenings.ts getJobOpenings, getJobOpening, createJobOpening, updateJobOpening, deleteJobOpening
    ├── steps.ts       getSteps, createStep, updateStep, deleteStep (aninhado em /job-openings/{id})
    ├── interviews.ts  getInterviews, createInterview, updateInterview, deleteInterview (aninhado em /steps/{id})
    ├── applications.ts  getApplications, getProfileApplications, createApplication, deleteApplication
    └── resumeImports.ts  seleção de arquivos + importação de currículos
```

## Responsabilidades

- **`client.ts`**: URL base (`VITE_API_URL`), `Content-Type`, serialização do body, token de autenticação (`setAuthToken`, guardado em memória e anexado como `Authorization` automaticamente), e conversão de qualquer falha em `ApiError`.
- **`errors.ts`**: `ApiError` com `kind` (`network`, `validation`, `unauthorized`, `not_found`, `server`, `unknown`) — a UI decide como exibir cada caso; nenhum `Toast`/`Alert` é importado aqui.
- **`session.ts`**: sessão (usuário, access token, refresh token e sua validade) persistida em `localStorage`, sincronizada com `client.ts` via `setAuthToken`. Consumida pela UI através do hook `hooks/useSession.ts` (não vive em `api/` porque usa React).
- **`types/*.ts`**: um arquivo por entidade de domínio (`User` hoje; `Candidate`, `Job`, `Evaluation` depois) — tipos que os services devolvem, sem lógica.
- **`services/*.ts`**: uma função por operação de domínio, sem lógica de header/token/URL — só chamam `apiClient.get/post/patch/delete` (alguns ainda são mocks; ver as seções abaixo).

## Autenticação e renovação do token

1. `POST /login` devolve o access token (1 h) e o refresh token (7 dias); ambos vão para a sessão.
   Os dados do usuário saem das claims do access token (a API não tem `/me`).
2. Quando uma chamada autenticada recebe **401**, `client.ts` chama o renovador registrado por
   `initAuth()` (em `main.tsx`): `POST /login/refresh` com o **refresh token no header
   `Authorization`**. Com o token novo, a chamada original é repetida uma única vez.
3. Chamadas que recebem 401 ao mesmo tempo compartilham **uma** renovação (`refreshInFlight`).
4. Se o refresh responder 401 (vencido ou inválido), a sessão é encerrada com `expired: true`:
   o `AppLayout` redireciona para `/login`, que avisa "Sua sessão expirou". Falha de rede no
   refresh **não** derruba a sessão — a próxima chamada tenta de novo.
5. A API não renova o refresh token: depois de 7 dias do login, é preciso entrar novamente.
   Sessões antigas (sem refresh token) ou com refresh vencido são descartadas ao abrir o app.

`client.ts` não importa a sessão: recebe o renovador por `setTokenRefresher`, o que evita a
dependência circular `client ↔ session`. Use `skipAuthRefresh` em chamadas que não devem
disparar renovação (o próprio login e o refresh).

## Vagas, etapas e entrevistas

Os recursos são aninhados na API: **vaga → etapas (`steps`) → registros de entrevista**.

- `expectedWage` é `Decimal` no banco e chega como string — use `formatCurrency` (`utils/format.ts`).
- `description` da vaga é HTML gerado pelo `RichTextEditor` (descrições antigas podem ser texto puro).
  Exiba sempre com `RichText` (sanitiza com DOMPurify) e use `toPlainText` (`utils/richText.ts`) para resumos.
- `description` da etapa e `transcript` da entrevista também são HTML do editor. A descrição da etapa
  tem limite de 2000 caracteres na API **contando a marcação** — validado no formulário.
- Importação de transcrição é só no front (`utils/transcriptImport.ts`): `.txt`/`.md` (UTF-8 ou
  Windows-1252), `.docx` (mammoth, carregado sob demanda) e legendas `.vtt`/`.srt` exportadas por
  Teams/Zoom/Meet (falas agrupadas por pessoa). A API recebe apenas o HTML final.
- Competências: qualquer usuário cria (nome único, 409 se repetido); editar e remover é só para Admin.
- Etapas têm `order` único por vaga; a API devolve 400 quando a ordem já existe.
- Cada usuário tem no máximo **um** registro de entrevista por etapa, e só o autor edita ou remove o
  próprio registro. Vaga (e, na UI, suas etapas) só é gerenciada pelo criador ou por um Admin
  (`utils/permissions.ts`).

## Candidaturas

```text
GET    /job-openings/{id}/applications              → JobApplication[]
POST   /job-openings/{id}/applications  {profileId} → JobApplication (409 se já vinculado)
DELETE /job-openings/{id}/applications/{profileId}  (204)
```

Vincular e desvincular: só o dono da vaga ou um Admin (403). As vagas de um perfil vêm no campo
`applications` de `GET /profiles/{id}` (`getProfileApplications`).

## Importação de currículos

`selectResumeFiles` aceita PDFs de até 5 MB, até 50 por importação. Para cada
arquivo, `uploadCv` envia `multipart/form-data` no campo `cv` para
`POST /profiles/upload-cv`, que devolve o perfil final já persistido. O resultado
é `done` quando o perfil tem resumo e competências, `attention` quando faltam
dados e `failed` quando o upload falha. Perfis esparsos continuam disponíveis
para revisão e não geram um falso timeout.

`importResumes` emite cada transição em `onProgress` (consumido por `hooks/useResumeImport.ts`),
aceita um `AbortSignal` para cancelamento e interrompe a importação inteira apenas
quando o erro não é do arquivo (sessão expirada ou API fora do ar).
