# Layout components

Casca estrutural da aplicação (header, sidebar, área de conteúdo, footer). São componentes de página, não pertencem à camada `ui` ([src/components/ui](../ui/README.md)) — cada tela usa `Layout` uma vez e monta seu conteúdo (tipicamente com componentes de `ui`) dentro dele.

```tsx
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";

export default function App() {
  return (
    <Layout>
      <PageHeader title="Dashboard" />
      {/* conteúdo da página */}
    </Layout>
  );
}
```

---

## Layout

Monta `Navbar` + `Sidebar` (drawer do DaisyUI) + `Footer` e renderiza `children` dentro de um `<main>` com container `max-w-7xl` e paddings padrão.

| Prop | Tipo | Descrição |
|---|---|---|
| `children` | `ReactNode` | Conteúdo da página, renderizado dentro do `<main>` |

O drawer usa o input `#my-drawer-4` (`drawer-toggle`) controlado via `<label htmlFor="my-drawer-4">` no `Navbar`. Em telas `lg` o drawer fica sempre aberto (`lg:drawer-open`); abaixo disso vira um menu deslizante controlado por esse checkbox.

---

## Navbar

Header fixo (`sticky top-0`) com marca (`TalentLens`), botão de abrir o sidebar (mobile) e placeholders de ações (notificações, avatar). Não recebe props — é fixo por enquanto; novas ações devem ser adicionadas diretamente no componente.

---

## Sidebar

Menu de navegação lateral, colapsável (ícone + tooltip quando fechado, ícone + label quando aberto). Também não recebe props: itens são estáticos no componente. Para adicionar um item novo, siga o padrão de `<li><a>` com ícone SVG + `<span className="is-drawer-close:hidden">`; o item ativo usa `menu-active` + `aria-current="page"`.

---

## PageHeader

Cabeçalho de página: título, breadcrumbs opcionais e ações alinhadas à direita.

```tsx
<PageHeader
  title="Dashboard"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
  ]}
  actions={<Button size="sm">Nova ação</Button>}
/>
```

| Prop | Tipo | Descrição |
|---|---|---|
| `title` | `string` | Título principal (`<h1>`) |
| `breadcrumbs` | `{ label: string; href: string }[]` | Opcional; renderiza uma trilha de navegação acima do título. O último item vira texto (`aria-current="page"`), os demais viram links |
| `actions` | `ReactNode` | Renderizado à direita do título (ex.: `Button` de `ui`) |

---

## Footer

Rodapé fixo com aviso de copyright. Não recebe props.

---

## Convenções

- Componentes de `layout` não têm lógica de negócio nem buscam dados — recebem `children`/props simples e delegam estilo visual a Tailwind + DaisyUI, como em `ui`.
- Cores, raio de borda e sombra vêm do tema `talentlens` definido em [index.css](../../index.css); nenhum componente aqui define paleta própria.
