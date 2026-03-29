import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

class RAGEngine:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.embeddings = OpenAIEmbeddings(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_BASE_URL")
        )
        self.vector_db = None
        self.llm = ChatOpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_BASE_URL"),
            model=os.getenv("MODEL_NAME", "openai/gpt-3.5-turbo")
        )

    def initialize_db(self):
        print(f"[RAG] Initializing Vector DB from directory: {self.data_dir}")
        documents = []
        pdf_files = [f for f in os.listdir(self.data_dir) if f.endswith(".pdf")]
        print(f"[RAG] Found {len(pdf_files)} PDF files: {pdf_files}")
        for file in pdf_files:
            file_path = os.path.join(self.data_dir, file)
            print(f"[RAG] Loading {file}...")
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
        print(f"[RAG] Loaded {len(documents)} document pages.")
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        print(f"[RAG] Split into {len(chunks)} chunks.")
        
        print("[RAG] Generating embeddings and creating FAISS index (this may take a moment)...")
        self.vector_db = FAISS.from_documents(chunks, self.embeddings)
        print(f"[RAG] Successfully initialized Vector DB.")

    async def get_response(self, query: str) -> str:
        if not self.vector_db:
            self.initialize_db()
        
        # Retrieval
        docs = self.vector_db.similarity_search(query, k=5)
        context = "\n---\n".join([doc.page_content for doc in docs])
        
        # Formatting
        prompt = ChatPromptTemplate.from_template("""
        You are AgenticFlow Copilot, an AI-powered onboarding assistant for new employees.
        
        Use ONLY the following context to answer the user's question:
        ---
        {context}
        ---
        
        Follow these CRITICAL rules:
        - Respond in a professional, friendly, and concise manner.
        - 2–5 sentences max.
        - Use bullet points if they improve clarity.
        - ONLY use the context provided. DO NOT guess or hallucinate.
        - If the question is about delays or failures, mention retry and escalation behavior.
        - If the question is about tools, explain how to access them clearly.
        - Do NOT mention "context", "vector database", or "retrieval".
        
        If no relevant info is found, say: 
        "I couldn't find that information in the onboarding guide. Please contact IT or HR for further assistance."
        
        If you are uncertain, say:
        "I'm not fully certain about that. Please check with HR or IT support."
        
        User Query: {query}
        """)
        
        chain = prompt | self.llm
        result = await chain.ainvoke({"context": context, "query": query})
        
        # Check if the context was actually relevant
        # (Self-correction if LLM output still says "the documents mentioned..." but doesn't find info)
        return result.content

rag_engine = RAGEngine(data_dir=os.path.join(os.getcwd(), "rag_data"))
