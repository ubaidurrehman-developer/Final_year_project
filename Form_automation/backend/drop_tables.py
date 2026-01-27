import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

tables = [
    'academic_request',
    'registration',
    'student_semester',
    'courses',
    'semester',
    'admin',
    'student',
    'address',
    'authentication',
    'users'
]

with connection.cursor() as cursor:
    for table in tables:
        print(f"Dropping table {table}...")
        cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
        print(f"Dropped {table}.")
