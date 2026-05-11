# LegislaApp — Design System

## Paleta de Cores

### Primary (Azul Veneziano)
| Token           | Hex       | Uso principal                        |
|-----------------|-----------|--------------------------------------|
| primary-50      | #eff6ff   | Fundos suaves, hover de itens        |
| primary-100     | #dbeafe   | Backgrounds de cards info            |
| primary-200     | #bfdbfe   | Bordas suaves, separadores           |
| primary-300     | #93c5fd   | Ícones secundários                   |
| primary-400     | #60a5fa   | Textos de apoio                      |
| primary-500     | #3b82f6   | Interações secundárias               |
| **primary-600** | **#2563eb** | **Ação principal, links, botões**  |
| primary-700     | #1d4ed8   | Hover de botões primários            |
| primary-800     | #1e40af   | Títulos, elementos de destaque       |
| primary-900     | #1a2952   | Cabeçalhos hero, sidebar escura      |

### Rosso (Vermelho)
| Token      | Hex       | Uso principal                    |
|------------|-----------|----------------------------------|
| #fef2f2    | —         | Fundo de alertas críticos        |
| **#b83b3d**| —         | CTA de conversão (Assinar agora) |
| #991b1b    | —         | Hover do CTA vermelho            |

### Oro (Dourado)
| Token    | Hex       | Uso principal                                |
|----------|-----------|----------------------------------------------|
| oro-50   | #fffbeb   | Fundo de mensagens com citação normativa     |
| oro-100  | #fef3c7   | Background de badges                         |
| oro-400  | #f59e0b   | Borda de citações, badges de destaque        |
| oro-500  | #f59e0b   | Ícones de destaque, estrelas                 |
| oro-700  | #b45309   | Texto em contexto dourado                    |

---

## Tipografia

### Hierarquia por nível
| Nível    | Classe Tailwind               | Uso                                  |
|----------|-------------------------------|--------------------------------------|
| H1 Hero  | `text-4xl font-display font-bold`   | Títulos de página (Dashboard, etc.)  |
| H2       | `text-2xl font-display font-bold`   | Títulos de seção, wizard steps       |
| H3       | `text-xl font-display font-bold`    | Card titles, modal headings          |
| H4       | `text-lg font-display font-semibold`| Sub-seções                           |
| Body     | `text-sm text-primary-700`          | Conteúdo principal                   |
| Caption  | `text-xs text-primary-400`          | Metadados, timestamps, hints         |
| Label    | `text-xs font-semibold uppercase tracking-wide`| Labels de campo, categorias  |

**Fontes:**
- `font-display` → Inter ou similar (sans-serif, headings)
- `font-body` → Inter (body text)
- `font-serif` → Georgia/serif (conteúdo legislativo nos textareas)

---

## Espaçamentos (múltiplos de 4px)

| Token    | px  | Uso típico                          |
|----------|-----|-------------------------------------|
| `p-1`    | 4px | Ícones, badges compactos            |
| `p-2`    | 8px | Botões pequenos, chips              |
| `p-3`    | 12px| Inputs compactos, itens de lista    |
| `p-4`    | 16px| Padding padrão de cards             |
| `p-5`    | 20px| Cabeçalhos de modal, nav items      |
| `p-6`    | 24px| Cards principais, seções            |
| `p-8`    | 32px| Editor de conteúdo                  |
| `p-10`   | 40px| Seções hero, empty states           |
| `gap-2`  | 8px | Espaço entre ícone e label          |
| `gap-4`  | 16px| Itens de formulário                 |
| `gap-6`  | 24px| Grid de cards                       |
| `mb-8`   | 32px| Entre seções principais da página   |

---

## Estados obrigatórios para elementos clicáveis

Todo elemento interativo DEVE ter os 4 estados:

```
default   → aparência base
hover     → bg/border levemente mais escuro, cursor pointer
focus     → ring-2 ring-primary-300 (acessibilidade)
active    → active:scale-[0.97] (feedback tátil)
disabled  → opacity-50, cursor-not-allowed
```

### Exemplo — Botão primário:
```jsx
<button className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold
  hover:bg-primary-700
  focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
  active:scale-[0.97]
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-200">
  Ação
</button>
```

### Exemplo — Link de navegação:
```jsx
<Link className="flex items-center gap-3 py-2.5 px-[13px] rounded-xl
  border-l-[3px] border-transparent
  text-primary-500 font-medium text-sm
  hover:bg-primary-50 hover:text-primary-700
  [data-active]:border-primary-600 [data-active]:bg-primary-50 [data-active]:text-primary-700
  transition-all duration-200">
```

---

## Componentes Base

### `.card`
```css
bg-white rounded-xl border border-primary-100 shadow-sm
hover:shadow-md transition-all duration-200
```
> Para cards interativos, adicionar: `cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]`

### `.input-field`
```css
w-full px-4 py-3 border-2 border-primary-200 rounded-xl
focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200
transition-all duration-200
```
> Estado de erro: `border-red-400 focus:border-red-500 focus:ring-red-100`

### `.btn-primary`
```css
px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl
hover:bg-primary-700 active:scale-[0.97]
shadow-md hover:shadow-lg
transition-all duration-200
```

### `.btn-ghost`
```css
px-6 py-3 border-2 border-primary-200 text-primary-700 font-semibold rounded-xl
hover:border-primary-400 hover:bg-primary-50
active:scale-[0.97]
transition-all duration-200
```

---

## Regras de Hierarquia Visual

1. **Máximo 3 níveis por tela**: título → subtítulo → corpo
2. **Contraste mínimo**: texto sobre fundo deve ter ratio 4.5:1 (WCAG AA)
3. **Espaçamento entre seções**: sempre `mb-8` (32px) — nunca menos
4. **Textos de apoio**: sempre `text-xs text-primary-400` — nunca `text-primary-700`
5. **Ícones**: sempre acompanhados de label visível ou `title` para acessibilidade

---

## Microinterações obrigatórias

| Situação                   | Animação                                  |
|----------------------------|-------------------------------------------|
| Botão clicado              | `active:scale-[0.97]` (3ms)              |
| Card hovered               | `hover:-translate-y-0.5 hover:shadow-md` |
| Mensagem de erro inline    | `opacity-0 → opacity-1 + translateY(4px)`|
| Modal aberto               | `scale(0.95) → scale(1) + opacity`       |
| Transição de etapa (wizard)| Slide horizontal direcional              |
| Loading assíncrono         | Skeleton pulsante ou spinner — NUNCA tela em branco |
| Accordion FAQ              | `height: 0 → auto` animado              |
