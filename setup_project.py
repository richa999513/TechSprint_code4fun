import os

PROJECT_NAME = "study_planner_agent"

BACKEND_FILES = [
    "agent.py",
    "tools.py",
    "prompts.py",
    "main.py",
    "auth.py",
    "requirements.txt",
    ".env",
]

RAG_FILES = [
    "chroma_client.py",
    "rag_tools.py",
    "__init__.py"
]

FRONTEND_FILES = [
    "index.html",
    "app.js",
    "style.css"
]

def create_file(path):
    if not os.path.exists(path):
        with open(path, "w") as f:
            pass

def create_project():
    os.makedirs(PROJECT_NAME, exist_ok=True)

    backend_path = os.path.join(PROJECT_NAME, "backend")
    os.makedirs(backend_path, exist_ok=True)

    for file in BACKEND_FILES:
        create_file(os.path.join(backend_path, file))

    # RAG folder
    rag_path = os.path.join(backend_path, "rag")
    os.makedirs(rag_path, exist_ok=True)

    for file in RAG_FILES:
        create_file(os.path.join(rag_path, file))

    frontend_path = os.path.join(PROJECT_NAME, "frontend")
    os.makedirs(frontend_path, exist_ok=True)

    for file in FRONTEND_FILES:
        create_file(os.path.join(frontend_path, file))

    create_file(os.path.join(PROJECT_NAME, "README.md"))

    print("✅ Agentic AI + RAG project structure created!")

if __name__ == "__main__":
    create_project()
