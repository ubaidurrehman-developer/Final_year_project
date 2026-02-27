import os
import django
import random
import sys
import string

# ---------------- Django Setup ----------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")

django.setup()

from myapp.serializers import UserSerializer    
from myapp.models import User


# ---------------- Colors ----------------
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"


# ---------------- Helpers ----------------
def print_section(title):
    print(f"\n{BLUE}{'='*60}")
    print(f" {title}")
    print(f"{'='*60}{RESET}")

def delete_existing_user(email=None, cnic=None, username=None):
    qs = User.objects.all()

    if email:
        qs = qs.filter(email=email)

    if cnic:
        qs = qs | User.objects.filter(cnic=cnic)

    if username:
        qs = qs | User.objects.filter(username=username)

    deleted_count = qs.count()

    if deleted_count:
        qs.delete()
        print(f"\033[93mDeleted {deleted_count} existing user(s) before creation.\033[0m")


def print_success(title, details):
    print(f"{GREEN}[SUCCESS]{RESET} {title}")
    for k, v in details.items():
        print(f"   ➤ {k}: {v}")


def print_error(title, error):
    print(f"{RED}[FAILED]{RESET} {title}")
    print(f"   ➤ Error: {error}")


def random_string(length=5):
    return ''.join(random.choices(string.ascii_letters, k=length))


# ---------------- Mock Request ----------------
class MockRequest:
    def __init__(self):
        class MockUser:
            is_authenticated = False
        self.user = MockUser()


# ---------------- Student Demo ----------------
def create_student():

    print_section("STUDENT REGISTRATION DEMO")

    suffix = random_string()

    data = {
        "first_name": "Demo",
        "last_name": f"Student_{suffix}",        
        "gender": "M",
        "dob": "2000-01-01",
        "email": f"student_{suffix}@demo.com",
        "mobile": f"0300-{random.randint(1000000,9999999)}",
        "cnic": f"12345-{random.randint(1000000,9999999)}-1",
        "blood_group": "B+",
        "nationality": "Pakistan",
        "password": "student123",
        "student": {
            "campus": "P",
            "program": "CS",
            "degree": "BS",
            "batch": "2024",
            "status": "Active"
        },
        "addresses": [
            {
                "address_type": "Permanent",
                "address": "Student Hostel",
                "city": "Peshawar",
                "province": "KPK",
                "country": "Pakistan",
                "postal_code": "25000"
            }
        ]
    }

    # Delete if already exists
    delete_existing_user(
        email=data["email"],
        cnic=data["cnic"]
    )

    serializer = UserSerializer(data=data, context={"request": MockRequest()})

    if serializer.is_valid():
        user = serializer.save()

        role = "Admin" if user.is_superuser else "Student"

        print_success("Student Created", {
            "Username / Roll No": user.username,
            "Role": role,
            "Is Staff": user.is_staff,
            "Is Superuser": user.is_superuser
        })

        return user

    else:
        print_error("Student Creation", serializer.errors)
        return None


# ---------------- Admin Demo ----------------
def create_admin():
    print_section("ADMIN REGISTRATION DEMO")

    suffix = random_string()

    data = {
        "first_name": "Demo",
        "last_name": f"Admin_{suffix}",
        "gender": "F",
        "dob": "1985-05-15",
        "email": f"admin_{suffix}@demo.com",
        "mobile": f"0333-{random.randint(1000000,9999999)}",
        "cnic": f"99999-{random.randint(1000000,9999999)}-9",
        "blood_group": "A-",
        "nationality": "Pakistan",
        "password": "admin123",        
        "addresses": [
            {
                "address_type": "Permanent",
                "address": "Admin Block",
                "city": "Islamabad",
                "province": "Federal",
                "country": "Pakistan",
                "postal_code": "44000"
            }
        ]
    }

    delete_existing_user(
    email=data["email"],
    cnic=data["cnic"]
)

    serializer = UserSerializer(data=data, context={"request": MockRequest()})

    if serializer.is_valid():
        user = serializer.save()

        role = "Admin" if user.is_superuser else "Student"

        print_success("Admin Created", {
            "Username": user.username,
            "Role": role,
            "Is Staff": user.is_staff,
            "Is Superuser": user.is_superuser
        })

        return user

    else:
        print_error("Admin Creation", serializer.errors)
        return None


# ---------------- Main Runner ----------------
if __name__ == "__main__":

    print(f"\n{YELLOW}Starting Jury Demonstration...{RESET}")

    student = create_student()
    admin = create_admin()

    print_section("DEMO COMPLETE")