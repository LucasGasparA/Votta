PROJETO
SaaS para elaboração de minutas legislativas municipais com assistente jurídico por LLM + RAG.
Usuários: procuradores, vereadores, servidores de câmaras municipais — público não-técnico, exige clareza máxima.
Stack: React 18 + Vite + React Router + Tailwind CSS + Framer Motion + Lucide React (frontend) | TypeScript + Express + PostgreSQL + Prisma + Vertex AI/Gemini (backend)

COMANDOS
docker compose up — sobe o projeto completo
docker compose up -d — sobe em background
docker compose down — derruba
docker compose logs -f — acompanha logs em tempo real

ESTRUTURA
src/components — Layout.jsx, StatCard.jsx, ProposalList.jsx
src/pages — Login, Dashboard, SelectMunicipality, CreateProposal, ProposalEditor, Pricing
src/utils — api.js, exportPdf.js
src/App.jsx — rotas
src/index.css

CORES — use sempre estas, nunca blue-/red-/yellow-* do Tailwind
primary-600 | #2563eb | Estrutura, navegação, botões normais
primary-900 | #1a2952 | Sidebar, cabeçalhos
rosso-500 | #dc2626 | CTAs de conversão, urgência
oro-500 | #f59e0b | Badges, citações normativas

REGRAS DE CÓDIGO

Componentes funcionais com hooks — nunca class components
PascalCase para componentes e arquivos (.jsx)
Props desestruturadas na assinatura
Sem console.log no código final
Sem dependências novas sem perguntar antes
Sem alert(), confirm(), prompt() — use modais React
Sem any no TypeScript sem justificativa no comentário


REGRAS DE UI

Mobile first: estilo base para mobile, md: e lg: para expandir
Todo button sem texto visível: obrigatório aria-label
Inputs sempre com label via htmlFor
Todo elemento interativo: estados default / hover / focus / active / disabled
Loading state obrigatório em toda operação assíncrona — nunca tela em branco
Confirmação antes de ação destrutiva (deletar, sair sem salvar)
Mensagens de erro: o que aconteceu + o que fazer


ANIMAÇÕES (Framer Motion)

Transições de página: opacity + x, duração 0.35s
Microinterações: whileHover, whileTap, duração 0.2s
AnimatePresence para elementos que entram/saem do DOM


PROIBIDO — sem exceção

Instalar shadcn/ui, MUI, Chakra, Ant Design ou qualquer lib de componentes
Remover o human-in-the-loop do fluxo de exportação — requisito jurídico do produto
Alterar identidade visual sem perguntar


CONTEXTO DE NEGÓCIO

Comprador: gestor público de câmara municipal — decisão lenta, coletiva
Plano Profissional (R$297/mês) é onde a conversão acontece — nunca enfraqueça visualmente este card
Principal argumento de venda: reduz retrabalho jurídico e evita devolutivas por vício formal
Objeções frequentes: LGPD e segurança — a interface deve transmitir seriedade


AO RECEBER UMA TAREFA

Leia os arquivos relevantes antes de escrever qualquer código
Se ambíguo, pergunte UMA coisa antes de começar
Se houver abordagem melhor, proponha com justificativa rápida
Ao terminar: 3 linhas do que mudou + pendências