import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "agentic_workflow_db")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
database = client[DB_NAME]

tasks_collection = database["tasks"]
logs_collection = database["logs"]
reports_collection = database["reports"]
users_collection = database["users"]
transcripts_collection = database["transcripts"]
meetings_collection = database["meetings"]

async def initialize_db():
    try:
        await client.admin.command('ping')
        print("Successfully connected to MongoDB.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
