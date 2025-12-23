import chromadb
from chromadb.config import Settings
import google.generativeai as genai
import os

CHROMA_PATH = "chroma_db"

# Use Gemini for embeddings instead of sentence-transformers
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

client = chromadb.Client(
    Settings(
        persist_directory=CHROMA_PATH,
        anonymized_telemetry=False
    )
)

collection = client.get_or_create_collection("study_materials")

def embed(text: str):
    """Use Gemini's embedding API for text embeddings"""
    try:
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embedding error: {e}")
        # Fallback to simple hash-based embedding for development
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        # Convert hash to a simple 384-dimensional vector (matching Gemini embedding size)
        hash_int = int(hash_obj.hexdigest(), 16)
        return [(hash_int >> i) & 1 for i in range(384)]
