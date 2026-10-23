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
    ├── skills.ts      getSkills, createSkill, updateSkill, deleteSkill
    ├── jobOpenings.ts getJobOpenings, getJobOpening, createJobOpening, updateJobOpening, deleteJobOpening
    ├── steps.ts       getSteps, createStep, updateStep, deleteStep (aninhado em /job-openings/{id})
    ├── interviews.ts  getInterviews, createInterview, updateInterview, deleteInterview (aninhado em /steps/{id})
    ├── applications.ts  ⚠ MOCK — getApplications, getProfileApplications, createApplication, deleteApplication
    └── resumeImports.ts  seleção de arquivos + importação de currículos (upload e polling)
```

## Responsabilidades

- **`client.ts`**: URL base (`VITE_API_URL`), `Content-Type`, serialização do body, token de autenticação (`setAuthToken`, guardado em memória e anexado como `Authorization` automaticamente), e conversão de qualquer falha em `ApiError`.
- **`errors.ts`**: `ApiError` com `kind` (`network`, `validation`, `unauthorized`, `not_found`, `server`, `unknown`) — a UI decide como exibir cada caso; nenhum `Toast`/`Alert` é importado aqui.
- **`session.ts`**: sessão mockada (usuário + token) persistida em `localStorage`, sincronizada com `client.ts` via `setAuthToken`. Consumida pela UI através do hook `hooks/useSession.ts` (não vive em `api/` porque usa React).
- **`types/*.ts`**: um arquivo por entidade de domínio (`User` hoje; `Candidate`, `Job`, `Evaluation` depois) — tipos que os services devolvem, sem lógica.
- **`services/*.ts`**: uma função por operação de domínio, sem lógica de header/token/URL — só chamam `apiClient.get/post/patch/delete` (ou, por ora, o mock de `auth.ts`).

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

## Candidaturas (mock)

A API ainda não expõe o vínculo candidato × vaga (o model `JobApplication` existe no banco, sem
endpoints). `services/applications.ts` simula o contrato proposto, guardando os dados em
`localStorage` (`mock_job_applications`) — **visível só neste navegador**:

```text
GET    /job-openings/{id}/applications              → JobApplication[]
POST   /job-openings/{id}/applications  {profileId} → JobApplication (409 se já vinculado)
DELETE /job-openings/{id}/applications/{profileId}
```

`getProfileApplications` corresponde ao campo `applications` de `GET /profiles/{id}`. Quando a API
existir, troque o corpo das funções por `apiClient` — a assinatura não muda (`profileName` em
`CreateApplicationInput` deixa de ser necessário).

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
