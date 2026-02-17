# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render, get_object_or_404
import random, string
from .models import *
from .serializers import *


def home(request):
    return render(request, "home.html")


# -------------------------------------------------------------- (GET REQUESTS) ---------------------------------------------------------------------- #
@api_view(["GET"])
def user_list(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def authentication_list(request):
    authentications = Authentication.objects.all()
    serializer = AuthenticationSerializer(authentications, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def address_list(request):
    addresses = Address.objects.all()
    serializer = AddressSerializer(addresses, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def student_list(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def admin_list(request):
    admins = Admin.objects.all()
    serializer = AdminSerializer(admins, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def semester_list(request):
    semesters = Semester.objects.all()
    serializer = SemesterSerializer(semesters, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def course_list(request):
    courses = Course.objects.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def student_semester_list(request):
    student_semesters = StudentSemester.objects.all()
    serializer = StudentSemesterSerializer(student_semesters, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def registration_list(request):
    registrations = Registration.objects.all()
    serializer = RegistrationSerializer(registrations, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def academic_request_list(request):
    academic_requests = AcademicRequest.objects.all()
    serializer = AcademicRequestSerializer(academic_requests, many=True)
    return Response(serializer.data)


# -------------------------------------------------------------- (POST REQUESTS) ---------------------------------------------------------------------- #
@api_view(["POST"])
def academic_request_create(request):
    serializer = AcademicRequestSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {
                "data": serializer.data,
                "message": "Academic request created successfully",
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(
        {"errors": serializer.errors, "message": "Academic request creation failed"},
        status=status.HTTP_400_BAD_REQUEST,
    )


def generate_password():
    return "".join(random.choices(string.ascii_letters + string.digits, k=8))


@api_view(["POST"])
def user_create(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        raw_password = generate_password()

        auth_data = {"user": user.user_id, "password": raw_password}
        auth_serializer = AuthenticationSerializer(data=auth_data)
        if auth_serializer.is_valid():
            auth_serializer.save()

            return Response(
                {"data": serializer.data, "message": "User created successfully"},
                status=status.HTTP_201_CREATED,
            )
    return Response(
        {"errors": serializer.errors, "message": "User creation failed"},
        status=status.HTTP_400_BAD_REQUEST,
    )


# -------------------------------------------------------------- (PUT REQUESTS) ---------------------------------------------------------------------- #


@api_view(["PUT"])
def academic_request_update(request, pk):
    academic_request = get_object_or_404(AcademicRequest, pk=pk)
    serializer = AcademicRequestSerializer(academic_request, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {
                "data": serializer.data,
                "message": "Academic request updated successfully",
            }
        )
    return Response(
        {"errors": serializer.errors, "message": "Academic request update failed"}
    )


@api_view(["PUT"])
def user_update(request, pk):
    user = get_object_or_404(User, pk=pk)
    serializer = UserSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"data": serializer.data, "message": "User updated successfully"},
            status=status.HTTP_200_OK,
        )
    return Response(
        {"errors": serializer.errors, "message": "User update failed"},
        status=status.HTTP_400_BAD_REQUEST,
    )


# -------------------------------------------------------------- (DELETE REQUESTS) ---------------------------------------------------------------------- #


@api_view(["DELETE"])
def user_delete(request, pk):
    user = get_object_or_404(User, pk=pk)
    user.delete()
    return Response({"message": "User deleted successfully"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
def academic_request_delete(request, pk):
    academic_request = get_object_or_404(AcademicRequest, pk=pk)
    academic_request.delete()
    return Response(
        {"message": "Academic request deleted successfully"},
        status=status.HTTP_204_NO_CONTENT,
    )
