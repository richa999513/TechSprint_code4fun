from typing import Dict, List
from .chroma_client import collection, embed
import json

def add_to_rag(data: Dict) -> Dict[str, str]:
    """
    Enhanced RAG storage with better content processing and metadata.
    """
    try:
        text = data.get("content", "")
        if not text:
            return {"status": "no_content", "message": "No content provided"}

        # Add metadata for better retrieval
        metadata = {
            "timestamp": data.get("timestamp", ""),
            "subject": data.get("subject", "general"),
            "content_type": data.get("content_type", "note"),
            "source": data.get("source", "user_upload")
        }

        # Generate unique ID
        doc_id = str(abs(hash(text + str(metadata))))
        
        collection.add(
            documents=[text],
            embeddings=[embed(text)],
            ids=[doc_id],
            metadatas=[metadata]
        )
        
        return {
            "status": "stored_in_rag",
            "id": doc_id,
            "content_length": len(text),
            "metadata": metadata
        }
    except Exception as e:
        print(f"Error adding to RAG: {e}")
        return {"status": "error", "message": str(e)}

def retrieve_from_rag(data: Dict) -> Dict[str, str]:
    """
    Enhanced RAG retrieval with better context formatting and relevance scoring.
    """
    try:
        query = data.get("question", "")
        if not query:
            return {"context": "No query provided", "sources": []}
            
        # Retrieve with more results for better context
        results = collection.query(
            query_embeddings=[embed(query)],
            n_results=5,
            include=["documents", "metadatas", "distances"]
        )
        
        docs = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        
        if not docs:
            return {"context": "No relevant context found in knowledge base", "sources": []}
        
        # Format context with relevance and sources
        formatted_context = []
        sources = []
        
        for i, (doc, metadata, distance) in enumerate(zip(docs, metadatas, distances)):
            relevance_score = max(0, 1 - distance)  # Convert distance to relevance
            
            if relevance_score > 0.3:  # Only include relevant results
                formatted_context.append(f"[Source {i+1}] {doc}")
                sources.append({
                    "id": i+1,
                    "relevance": round(relevance_score, 2),
                    "subject": metadata.get("subject", "unknown"),
                    "content_type": metadata.get("content_type", "note"),
                    "timestamp": metadata.get("timestamp", "")
                })
        
        context = "\n\n".join(formatted_context) if formatted_context else "No highly relevant context found"
        
        return {
            "context": context,
            "sources": sources,
            "total_results": len(docs),
            "relevant_results": len(formatted_context)
        }
        
    except Exception as e:
        print(f"Error retrieving from RAG: {e}")
        return {"context": f"Error retrieving context: {str(e)}", "sources": []}

def search_rag_by_subject(data: Dict) -> Dict[str, any]:
    """
    Search RAG database by specific subject or topic.
    """
    try:
        subject = data.get("subject", "")
        if not subject:
            return {"status": "error", "message": "No subject specified"}
        
        # Query with subject-specific search
        results = collection.query(
            query_embeddings=[embed(subject)],
            n_results=10,
            include=["documents", "metadatas"],
            where={"subject": {"$eq": subject}}
        )
        
        docs = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        
        subject_content = []
        for doc, metadata in zip(docs, metadatas):
            subject_content.append({
                "content": doc[:200] + "..." if len(doc) > 200 else doc,
                "subject": metadata.get("subject", "unknown"),
                "content_type": metadata.get("content_type", "note"),
                "timestamp": metadata.get("timestamp", "")
            })
        
        return {
            "status": "success",
            "subject": subject,
            "content": subject_content,
            "total_found": len(subject_content)
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_rag_statistics() -> Dict[str, any]:
    """
    Get statistics about the RAG database content.
    """
    try:
        # Get collection info
        collection_info = collection.get()
        
        total_documents = len(collection_info.get("documents", []))
        metadatas = collection_info.get("metadatas", [])
        
        # Analyze subjects
        subjects = {}
        content_types = {}
        
        for metadata in metadatas:
            if metadata:
                subject = metadata.get("subject", "unknown")
                content_type = metadata.get("content_type", "unknown")
                
                subjects[subject] = subjects.get(subject, 0) + 1
                content_types[content_type] = content_types.get(content_type, 0) + 1
        
        return {
            "status": "success",
            "total_documents": total_documents,
            "subjects": subjects,
            "content_types": content_types,
            "database_health": "operational" if total_documents > 0 else "empty"
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
