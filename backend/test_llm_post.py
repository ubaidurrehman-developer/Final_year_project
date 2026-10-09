import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from django.test import RequestFactory
from myapp.views import modify_json
import json

factory = RequestFactory()
request = factory.post('/llm/', data=json.dumps({"prompt": "some prompt", "json": "{}"}), content_type='application/json')
response = modify_json(request)
print("status:", response.status_code if hasattr(response, 'status_code') else 'no status_code')
try:
    response.render()
except Exception as e:
    print("Exception during render:", type(e).__name__, e)

