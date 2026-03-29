import os
import asyncio
from agents.bot_agent import bot

async def main():
    try:
        await bot.run()
        # Keep alive
        while True:
            await asyncio.sleep(10)
    except Exception as e:
        print(f"[BOT ERROR] {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
