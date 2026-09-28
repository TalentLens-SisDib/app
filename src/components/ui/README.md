# UI components

Camada de componentes reutilizáveis do TalentLens, construída sobre **Tailwind CSS + DaisyUI 5**. Cada componente é independente e pode ser importado diretamente do arquivo ou via barrel:

```tsx
import Button from "@/components/ui/Button";
// ou
import { Button } from "@/components/ui";
```

Página de demonstração com todas as variantes: rode `npm run dev` e acesse `/ui-playground` ([src/pages/UiPlayground.tsx](../../pages/UiPlayground.tsx)).

---

## Button

```tsx
<Button variant="primary" size="sm" loading={isSaving} onClick={handleSave}>
  Salvar
</Button>
```

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "outline" \| "error" \| "success"` | — (neutro) | Aparência do botão |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | Tamanho |
| `loading` | `boolean` | `false` | Mostra spinner e força `disabled` (evita duplo clique) |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | — |
| ...rest | `ButtonHTMLAttributes<HTMLButtonElement>` | — | `onClick`, `disabled`, `aria-*`, etc. |

---

## Alert

```tsx
<Alert variant="success">Candidato salvo com sucesso.</Alert>

<Alert variant="warning" title="Atenção" onClose={() => setVisible(false)}>
  Existem campos que precisam ser revisados.
</Alert>
```

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `variant` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Também define o ícone exibido |
| `title` | `string` | — | Opcional; se ausente, o conteúdo aparece em linha só com o ícone |
| `onClose` | `() => void` | — | Se fornecido, exibe botão de fechar |
| `children` | `ReactNode` | — | Mensagem |

---

## Badge

```tsx
<Badge variant="success">Aprovado</Badge>
<Badge variant="warning" size="lg">Em análise</Badge>
```

| Prop | Tipo | Padrão |
|---|---|---|
| `variant` | `"neutral" \| "primary" \| "secondary" \| "accent" \| "info" \| "success" \| "warning" \| "error" \| "ghost" \| "outline"` | `"neutral"` |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` |

Aceita também os demais atributos de `<span>` (`className`, `onClick`, etc.).

---

## Card

```tsx
<Card title="Dados do candidato" description="Informações de cadastro">
  <p>Conteúdo...</p>
</Card>

<Card
  title="Ações"
  actions={
    <>
      <Button variant="ghost" size="sm">Cancelar</Button>
      <Button variant="primary" size="sm">Salvar</Button>
    </>
  }
>
  <p>Conteúdo...</p>
</Card>
```

| Prop | Tipo | Descrição |
|---|---|---|
| `title` | `ReactNode` | Renderizado como `<h2 class="card-title">` |
| `description` | `ReactNode` | Texto secundário abaixo do título |
| `actions` | `ReactNode` | Renderizado em `.card-actions`, alinhado à direita |
| `children` | `ReactNode` | Corpo livre do card |

---

## Input

```tsx
<Input label="Nome" placeholder="Digite o nome" />

<Input
  label="E-mail"
  type="email"
  error="Informe um e-mail válido"
/>

<Input label="Telefone" helperText="Opcional" />
```

| Prop | Tipo | Descrição |
|---|---|---|
| `label` | `string` | Associado ao input via `htmlFor`/`id` (gera `id` automático com `useId` se não informado) |
| `error` | `string` | Mensagem de erro; aplica `input-error` e `aria-invalid`, some com `helperText` |
| `helperText` | `string` | Texto de apoio quando não há erro |
| `required` | `boolean` | Marca visual `*` no label + atributo nativo |
| ...rest | `InputHTMLAttributes<HTMLInputElement>` | `value`, `onChange`, `disabled`, `placeholder`, etc. |

`error`/`helperText` são conectados ao `<input>` via `aria-describedby`.

---

## Select

Mesmo padrão visual e de acessibilidade do `Input`, mas para `<select>`:

```tsx
<Select label="Status" value={status} onChange={handleChange}>
  <option value="pending">Em análise</option>
  <option value="approved">Aprovado</option>
  <option value="rejected">Reprovado</option>
</Select>
```

| Prop | Tipo | Descrição |
|---|---|---|
| `label` | `string` | Igual ao `Input` |
| `error` | `string` | Igual ao `Input` (aplica `select-error`) |
| `helperText` | `string` | Igual ao `Input` |
| `required` | `boolean` | Igual ao `Input` |
| ...rest | `SelectHTMLAttributes<HTMLSelectElement>` | `value`, `onChange`, `disabled`, etc. |

`children` são as `<option>` (ou `<optgroup>`) normais do HTML.

---

## Spinner

```tsx
<Spinner />
<Spinner size="sm" />
```

| Prop | Tipo | Padrão |
|---|---|---|
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` |
| `label` | `string` | `"Carregando"` (usado em `aria-label`) |
| `className` | `string` | — |

---

## Dialog

```tsx
const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Excluir candidato?"
  actions={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      <Button variant="error" onClick={handleDelete}>Excluir</Button>
    </>
  }
>
  <p>Essa ação não poderá ser desfeita.</p>
</Dialog>
```

| Prop | Tipo | Descrição |
|---|---|---|
| `open` | `boolean` | Controla exibição (componente controlado) |
| `onClose` | `() => void` | Chamado ao fechar pelo X, ESC, clique fora, ou fechamento do `<dialog>` nativo |
| `title` | `string` | Opcional |
| `actions` | `ReactNode` | Renderizado em `.modal-action` |
| `children` | `ReactNode` | Corpo do modal |

Implementado sobre `<dialog>` nativo (`showModal()` / `close()`): foco fica preso automaticamente dentro do modal e ESC fecha sem código extra. Não há gerenciamento global de modais — cada tela controla seu próprio `open` via `useState`.

---

## Toast

API imperativa, sem necessidade de Provider — basta montar `<Toaster />` uma vez na raiz do app (já feito em [main.tsx](../../main.tsx)):

```tsx
import { toast } from "@/components/ui/toastStore";

toast.success("Candidato salvo com sucesso");
toast.error("Não foi possível salvar o candidato");
toast.info("O processamento foi iniciado");
toast.warning("Alguns dados precisam ser revisados", 6000); // duração em ms (padrão 4000)
```

- Cada chamada retorna um `id` (`number`); `toast.dismiss(id)` fecha manualmente.
- Suporta múltiplos toasts simultâneos, empilhados no canto inferior direito (`toast-end toast-bottom`).
- Estado vive em um store simples fora do React ([toastStore.ts](toastStore.ts)), lido por `<Toaster />` via `useSyncExternalStore` — por isso pode ser chamado de qualquer lugar (handlers, efeitos, fora de componentes) sem Context.

---

## Convenções gerais

- Nenhum componente define cor, espaçamento, raio de borda ou sombra própria fora do tema DaisyUI configurado em [index.css](../../index.css) (`--radius-field`, `--radius-box`, paleta `talentlens`) — todos herdam do mesmo tema.
- Erros de formulário nunca dependem só de cor: sempre há texto (`error`) e `aria-invalid`/`aria-describedby`.
- Foco visível é herdado globalmente (`focus-visible:outline-primary` definido em `index.css` para `button, a, input, select, textarea`).
- Nenhum componente aqui é específico de uma tela (candidatos, vagas, etc.) — lógica de negócio fica fora da camada `ui`.
