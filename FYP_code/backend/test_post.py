import requests

res = requests.post('http://127.0.0.1:8000/llm/', json={"prompt": "make it empty", "json": "{}"})
print(res.status_code, res.text)
