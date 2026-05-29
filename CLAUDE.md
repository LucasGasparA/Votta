# CLAUDE.md — Votta (Assistente Legislativo Municipal)

## PROJETO
SaaS para elaboração de minutas legislativas municipais com assistente jurídico por LLM + RAG.
Usuários: procuradores, vereadores, servidores de câmaras municipais — público não-técnico, exige clareza máxima.

## STACK
React 18 + Vite + React Router + Tailwind CSS + Framer Motion + Lucide React (frontend)
TypeScript + Express + PostgreSQL + Prisma + Vertex AI/Gemini (backend)

## DEPLOY — Railway
- Frontend: serviço "frontend" no Railway (build: npm install && npm run build | start: npx serve dist)
- Backend: serviço "backend" no Railway (build: npm install && prisma generate && npm run build | start: prisma db push && node dist/index.js)
- Deploy automático via push na branch main (.github/workflows/deploy.yml)
- DATABASE_URL injetada automaticamente pelo plugin PostgreSQL do Railway
- Variáveis de ambiente ficam no painel do Railway — nunca no código

## COMANDOS LOCAIS
npm run dev        (frontend — raiz do projeto)
cd server && npm run dev   (backend)

## FLUXO PRINCIPAL (caminho crítico — nunca quebre isso)
Login → SelectMunicipality → CriarMinuta (wizard 5 etapas) → EditorMinuta (gera via IA) → Revisão humana obrigatória → Exportação PDF/DOCX

⚠️ NUNCA remova a revisão humana antes da exportação — é requisito jurídico do produto.

## PONTO DE ENTRADA
Ao abrir o projeto, leia nesta ordem:
1. Este arquivo
2. src/App.jsx — rotas e navegação
3. A skill relevante para a tarefa (ver abaixo)

## SKILLS DISPONÍVEIS
Leia a skill correspondente ANTES de escrever qualquer código:

| Tarefa | Skill |
|--------|-------|
| Criar ou editar qualquer componente UI | .claude/skills/ui-components.md |
| Animações, transições, Framer Motion | .claude/skills/animations.md |
| Fluxo de exportação PDF ou DOCX | .claude/skills/export-flow.md |
| Espaçamento, layout e estrutura | .claude/skills/design-system.md |
| **Estética, cores, tipografia, visual geral** | **frontend-design (skill global)** |

## ESTÉTICA VISUAL
A skill `frontend-design` é a autoridade em decisões visuais. Antes de criar ou redesenhar qualquer tela, siga o processo dela: defina direção estética, tipografia distinta, paleta coesa com acento forte, composição espacial intencional.

Contexto do produto que deve guiar a direção estética:
- Público jurídico-público (procuradores, vereadores) — seriedade sem rigidez
- Produto SaaS moderno — não governo, não corporativo genérico
- Transmite: confiança, precisão, clareza — evita: pesado, antiquado, sobrecarregado

## REGRAS INEGOCIÁVEIS
- Componentes funcionais com hooks — nunca class components
- Sem console.log no código final
- Sem dependências novas sem perguntar antes
- Sem alert(), confirm(), prompt() — use modais React
- Sem any no TypeScript sem justificativa no comentário
- Sem instalar shadcn/ui, MUI, Chakra, Ant Design ou qualquer lib de componentes

## CONTEXTO DE NEGÓCIO
- Comprador: gestor público de câmara municipal — decisão lenta e coletiva
- Plano Profissional (R$297/mês) é onde a conversão acontece
- Argumento principal: reduz retrabalho jurídico e evita devolutivas por vício formal
- Objeção frequente: LGPD e segurança — a interface deve transmitir seriedade

## AO RECEBER UMA TAREFA
1. Leia a skill relevante
2. Se ambíguo, pergunte UMA coisa antes de começar
3. Se houver abordagem melhor, proponha com justificativa rápida
4. Ao terminar: 3 linhas do que mudou + pendências
