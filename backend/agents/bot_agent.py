import os
import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters, CommandHandler
from agents.rag_engine import rag_engine

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "8727718906:AAGE52DZiU6bzYoV_Fr8f1yHmtRaUFsBr90")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Welcome to AgenticFlow Copilot! I am your AI-powered onboarding assistant. How can I assist you today?"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.message.text
    if not query:
        return
    
    # Typing indicator
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    # Get answer from RAG Engine
    response = await rag_engine.get_response(query)
    
    await update.message.reply_text(response)

class TelegramBot:
    def __init__(self, token: str):
        self.application = ApplicationBuilder().token(token).build()
        self.application.add_handler(CommandHandler("start", start))
        self.application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))
        
    async def run(self):
        # Initialize the vector DB before starting the bot
        rag_engine.initialize_db()
        
        # Start the bot
        print("[BOT] Starting AgenticFlow Copilot on Telegram...")
        await self.application.initialize()
        await self.application.start()
        await self.application.updater.start_polling()

bot = TelegramBot(token=TELEGRAM_TOKEN)
