# Instruções para o Assistente de IA: Integração RAG (Leis de Nova Veneza)

**Contexto Geral:** 
Nós possuímos um banco de dados vetorial (`chroma_db`) que contém 7.865 leis municipais de Nova Veneza. As leis foram vetorizadas em "chunks" de 1500 caracteres (com sobreposição de 150 caracteres) usando o modelo `text-embedding-004` da Google Vertex AI. O banco foi construído com a biblioteca `chromadb`.

**Seu Objetivo:** 
Você (A Inteligência Artificial) deverá implementar o código para consumir esta base `chroma_db` no meu projeto atual, que já usa a API do Gemini. Quando o usuário fizer uma pergunta, o sistema deverá buscar o contexto relevante nas leis e alimentar o prompt do Gemini para que ele responda embasado nos dados.

---

## 📌 Requisitos Técnicos

1. **Dependências:**
   - O projeto precisará das bibliotecas: `chromadb`, `google-cloud-aiplatform` (ou a SDK equivalente da Vertex) e `langchain`.
   - Lembre-se de certificar que as credenciais do GCP (`GOOGLE_APPLICATION_CREDENTIALS`) estejam configuradas.

2. **Atenção ao Bug do Pydantic (Importante):**
   - Atualmente, usar a classe `VertexAIEmbeddings` do pacote `langchain_google_vertexai` pode causar um erro `RuntimeError: error checking inheritance of SafetySettingsType` devido a conflitos com o `pydantic`.
   - **SOLUÇÃO EXIGIDA:** Utilize uma implementação direta nativa do `EmbeddingFunction` do ChromaDB usando o SDK puro do Google, conforme o snippet de exemplo abaixo, para evitar crashes de compatibilidade.

3. **Metadados Disponíveis:**
   - Cada vetor no banco contém os seguintes metadados extraídos dos Markdowns originais que você pode (e deve) usar para citar as fontes:
     - `titulo`: (Ex: "DECRETO DP Nº 01, DE 04 DE JANEIRO DE 2021.")
     - `numero`
     - `tipo`
     - `data`
     - `situacao`
     - `url`

---

## 🛠️ Snippet de Referência para a Leitura do Banco

Utilize o código abaixo como base arquitetural para criar a função de recuperação (Retrieval):

```python
import os
import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
import vertexai
from vertexai.language_models import TextEmbeddingModel

# 1. Função Customizada para driblar os bugs do LangChain com Vertex Embeddings
class VertexEmbeddingFunction(EmbeddingFunction):
    def __init__(self, project_id: str, location: str, model_name: str = "text-embedding-004"):
        vertexai.init(project=project_id, location=location)
        self.model = TextEmbeddingModel.from_pretrained(model_name)

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = self.model.get_embeddings(input)
        return [embedding.values for embedding in embeddings]

# 2. Configurações e Instância do Banco
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
CHROMA_DIR = "./chroma_db"  # Ajuste para o caminho relativo correto no projeto atual

embedding_function = VertexEmbeddingFunction(project_id=PROJECT_ID, location=LOCATION)
client = chromadb.PersistentClient(path=CHROMA_DIR)

# 3. Conectar à coleção das leis
collection = client.get_collection(
    name="leis_collection",
    embedding_function=embedding_function
)

# 4. Função de Busca (Exemplo)
def buscar_leis_relevantes(query_usuario: str, n_resultados: int = 4):
    resultados = collection.query(
        query_texts=[query_usuario],
        n_results=n_resultados
    )
    
    # Montar o contexto para injetar no Gemini
    contextos = []
    
    for i in range(len(resultados['documents'][0])):
        texto = resultados['documents'][0][i]
        meta = resultados['metadatas'][0][i]
        
        contexto_formatado = f"Fonte: {meta['titulo']} (URL: {meta['url']})\nTrecho: {texto}\n"
        contextos.append(contexto_formatado)
        
    return "\n".join(contextos)
```

## 🧠 Instruções Finais (O que você deve codar)
- Pegue o texto que a função `buscar_leis_relevantes` retornar e crie uma função que injete esse texto como *Contexto Auxiliar* no Prompt do Gemini.
- Instrua o Gemini no System Prompt a basear suas respostas ÚNICA e EXCLUSIVAMENTE nos contextos fornecidos. Se a resposta não estiver no contexto, ele deve afirmar que não encontrou a informação nas leis da cidade.
- Faça o Gemini sempre citar o Título e a URL da lei nas respostas.
- Solicito que escreva o código dessa integração adaptado para o nosso projeto principal.
