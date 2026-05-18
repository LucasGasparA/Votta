import json
import os
import sys
from typing import Any, Dict, List

import chromadb
import vertexai
from chromadb import Documents, EmbeddingFunction, Embeddings
from google.oauth2 import service_account
from vertexai.language_models import TextEmbeddingModel


class VertexEmbeddingFunction(EmbeddingFunction):
    def __init__(self, project_id: str, location: str, model_name: str) -> None:
        credentials_json = os.getenv("GCP_CREDENTIALS_JSON")
        credentials = None

        if credentials_json:
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(credentials_info)

        vertexai.init(project=project_id, location=location, credentials=credentials)
        self.model = TextEmbeddingModel.from_pretrained(model_name)

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = self.model.get_embeddings(list(input))
        return [embedding.values for embedding in embeddings]


def metadata_value(metadata: Dict[str, Any], key: str) -> str:
    value = metadata.get(key)
    return str(value) if value is not None else ""


def format_context(document: str, metadata: Dict[str, Any]) -> str:
    title = metadata_value(metadata, "titulo") or "Fonte sem titulo"
    url = metadata_value(metadata, "url") or "URL nao informada"
    number = metadata_value(metadata, "numero")
    law_type = metadata_value(metadata, "tipo")
    date = metadata_value(metadata, "data")
    status = metadata_value(metadata, "situacao")

    details = ", ".join(part for part in [law_type, number, date, status] if part)
    header = f"Fonte: {title}"
    if details:
        header += f" ({details})"

    return f"{header}\nURL: {url}\nTrecho: {document}"


def main() -> None:
    payload = json.loads(sys.stdin.read() or "{}")
    query = str(payload.get("query", "")).strip()
    n_results = int(payload.get("n_results", os.getenv("RAG_RESULTS", "4")))

    if not query:
        raise ValueError("Query vazia.")

    project_id = os.getenv("GCP_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT")
    if not project_id:
        raise ValueError("Configure GCP_PROJECT_ID ou GOOGLE_CLOUD_PROJECT para usar RAG.")

    location = os.getenv("GCP_LOCATION") or os.getenv("GOOGLE_CLOUD_LOCATION") or "us-central1"
    model_name = os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-004")
    chroma_dir = os.getenv("CHROMA_DIR", "../chroma_db")
    collection_name = os.getenv("RAG_COLLECTION_NAME", "leis_collection")

    embedding_function = VertexEmbeddingFunction(project_id, location, model_name)
    client = chromadb.PersistentClient(path=chroma_dir)
    collection = client.get_collection(name=collection_name, embedding_function=embedding_function)

    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    documents: List[str] = (results.get("documents") or [[]])[0]
    metadatas: List[Dict[str, Any]] = (results.get("metadatas") or [[]])[0]
    distances: List[float] = (results.get("distances") or [[]])[0]

    sources = []
    contexts = []

    for index, document in enumerate(documents):
        metadata = metadatas[index] if index < len(metadatas) and metadatas[index] else {}
        distance = distances[index] if index < len(distances) else None
        contexts.append(format_context(document, metadata))
        sources.append(
            {
                "titulo": metadata_value(metadata, "titulo"),
                "numero": metadata_value(metadata, "numero"),
                "tipo": metadata_value(metadata, "tipo"),
                "data": metadata_value(metadata, "data"),
                "situacao": metadata_value(metadata, "situacao"),
                "url": metadata_value(metadata, "url"),
                "distance": distance,
            }
        )

    print(json.dumps({"context": "\n\n---\n\n".join(contexts), "sources": sources}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"RAG retrieval failed: {exc}", file=sys.stderr)
        sys.exit(1)
