# serializers.py

from django.contrib.auth.hashers import make_password
from django.utils.crypto import get_random_string
from rest_framework import serializers
from django.db.models import Max
import random, string
from .models import *


def generate_password():
    return "".join(random.choices(string.ascii_letters + string.digits, k=8))


def generate_roll_no(campus: str, batch: str):
    prefix = f"{batch[-2:]}{campus[0]}"

    last_roll = Student.objects.filter(roll_no__startswith=prefix).aggregate(
        max_roll=Max("roll_no")
    )["max_roll"]

    if last_roll:
        last_number = int(last_roll.split("-")[-1])
        next_number = last_number + 1
    else:
        next_number = 9001

    return f"{prefix}-{next_number}"


def generate_admin_username(full_name: str):
    return ".".join(full_name.lower().split())


class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "gender",
            "dob",
            "mobile",
            "cnic",
            "blood_group",
            "nationality",
            "password",
            "id",
        ]

    def create(self, validated_data):
        request = self.context["request"]

        # 1. Combine First/Last Name -> Full Name
        first = validated_data.get("first_name", "").strip()
        last = validated_data.get("last_name", "").strip()
        full_name = f"{first} {last}".strip()
        validated_data["full_name"] = full_name

        # 2. Decide User is Student or Not(Admin)
        student = request.data.get("student")

        if student is not None:
            roll_no = generate_roll_no(
                campus=student["campus"], batch=student["batch"]
            )
            username = roll_no
        else:
            if not full_name:
                raise serializers.ValidationError("Admin must have first and last name")
            username = generate_admin_username(full_name)

        if not username:
            raise serializers.ValidationError("Username generation failed")

        # 3. Decide Password
        password = validated_data.pop("password", None)
        if not password:
            password = generate_password()

        # 4. Create User
        allow = request.user if request.user.is_authenticated else None

        user = User.objects.create_user(
            username=username, password=password, created_by=allow, **validated_data
        )

        if student is not None:
            User.objects.create(
                user=user,
                roll_no=roll_no,
                status="Active",
            )

        return user
