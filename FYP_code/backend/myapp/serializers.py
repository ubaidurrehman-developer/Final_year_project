# serializers.py
from django.db import IntegrityError
from rest_framework import serializers
from django.db.models import Max
from django.db import transaction
from .models import *


def generate_password(length=12):    
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(random.SystemRandom().choices(chars, k=length))


def generate_roll_no(campus, batch):
    prefix = f"{batch[-2:]}{campus[0]}"

    last_roll = Student.objects.filter(
        roll_no__startswith=prefix
    ).aggregate(max_roll=Max("roll_no"))["max_roll"]

    next_number = int(last_roll.split("-")[-1]) + 1 if last_roll else 9001
    return f"{prefix}-{next_number}"




def generate_admin_username(full_name: str):
    base = ".".join(full_name.lower().split())
    username = base
    counter = 1

    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1

    return username



class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['address_type', 'address', 'city', 'province', 'country', 'postal_code']


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['roll_no', 'status', 'campus', 'degree', 'program', 'batch']


class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    student = StudentSerializer(required=False, write_only=True)
    addresses = AddressSerializer(many=True, required=False, write_only=True)    

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
            "student",
            "addresses",            
            "role",
        ]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]

        # Extract nested data
        student_data = validated_data.pop("student", None)
        addresses_data = validated_data.pop("addresses", None)
        role = self.context.get("role", "admin")

        # 1. Combine First/Last Name -> Full Name
        first = validated_data.pop("first_name", "").strip()
        last = validated_data.pop("last_name", "").strip()
        full_name = f"{first} {last}".strip()
        validated_data["full_name"] = full_name

        # 2. Decide Username based on role
        if role == "student" and student_data:
            username = "__temp__"
        else:
            if not full_name:
                raise serializers.ValidationError("Admin must have first and last name")
            username = generate_admin_username(full_name)

        if not username:
            raise serializers.ValidationError("Username generation failed")

        # 3. Handle Password
        password = validated_data.pop("password", None)
        if not password:
            password = generate_password()

        # 4. Create User
        created_by = request.user if request.user.is_authenticated else None

        user = User.objects.create_user(
            username=username, 
            password=password, 
            created_by=created_by, 
            **validated_data
        )

        user.must_change_password = True
        user.save(update_fields=["must_change_password"])
        
        # 5. Create Student if role is student
        if role == "student" and student_data:
            # Set default status if not provided
            if "status" not in student_data:
                student_data["status"] = "Active"
            
            MAX_RETRIES = 5

            for _ in range(MAX_RETRIES):
                roll_no = generate_roll_no(
                    campus=student_data.get("campus"),
                    batch=student_data.get("batch"),
                )
                student_data["roll_no"] = roll_no

                try:
                    Student.objects.create(
                        user=user,
                        **student_data
                    )
                    user.username = roll_no
                    user.save(update_fields=["username"])                    
                    break
                except IntegrityError:
                    continue
            else:
                raise serializers.ValidationError(
                    "Could not generate unique roll number. Try again."
                )

        # 6. Create Addresses
        if addresses_data:
            for address_data in addresses_data:
                Address.objects.create(
                    user=user,
                    **address_data
                )

        return user
