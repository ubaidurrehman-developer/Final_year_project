import os
import sys

# Add the backend folder to the path so we can import Backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from Backend.services.llm_parser import _get_client

try:
    print("Initializing client...")
    client = _get_client()
    print("Client initialized successfully!")
    
    print("Sending test request to OpenRouter...")
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b:free",
        messages=[{"role": "user", "content": "Reply with 'Hello World' and nothing else."}],
        temperature=0,
    )
    print("API Response:", response.choices[0].message.content)
    print("✅ TEST PASSED: The client is fully working!")
except Exception as e:
    print("❌ TEST FAILED:", e)
