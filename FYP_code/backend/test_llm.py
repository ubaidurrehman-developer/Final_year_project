import sys
import os

path = os.path.abspath(os.path.join(os.path.dirname(__file__)))
sys.path.append(path)

try:
    from Backend.services.llm_parser import parse_to_json
    print(parse_to_json([{'text': 'hello'}]))
except Exception as e:
    print("Error:", e)
