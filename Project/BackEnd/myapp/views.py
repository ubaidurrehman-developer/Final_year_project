# views.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework import status
from .serializers import *
from .models import *


def home(request):
    return render(request, "home.html")


class ForgotPasswordView(APIView):
    def post(self, request):
        oldpassword = request.data["oldpassword"]
        newpassword = request.data["newpassword"]
        confirmpassword = request.data["confirmpassword"]

        if not request.user.check_password(oldpassword):
            return Response(
                {"message": "Old password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if oldpassword == newpassword:
            return Response(
                {"message": "Old password and new password cannot be same"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if newpassword != confirmpassword:
            return Response(
                {"message": "New password and confirm password do not match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.get(username=request.user.username)
        user.set_password(newpassword)
        user.save()
        return Response({"message": "Password reset successful"})


class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user
        role = "admin" if user.is_superuser else "student"

        access = serializer.validated_data["access"]
        refresh = serializer.validated_data["refresh"]

        response = Response(
            {
                "access": access,
                "refresh": refresh,
                "role": role,
                "message": "User logged in successfully",
            }
        )

        response.set_cookie(
            key="auth_token",
            value=access,
            max_age=60 * 60 * 24 * 7,
            httponly=True,
            secure=False,
            samesite="Lax",
        )

        return response


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("auth_token")
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token


# -------------------------------------------------------------- (USER OPERATIONS) ---------------------------------------------------------------------- #
class UserView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]  # only admin can create user

    def post(self, request):
        # 1. Strict Permission Check
        if not (request.user.is_superuser or request.user.is_staff):
            return Response(
                {"message": "You do not have permission to create users."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Create User
        serializer = UserSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # 3. Response (No auto-login for new user)
        return Response(
            {"message": "User created successfully", "username": user.username},
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response(
                {"message": "You do not have permission to view users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def put(self, request, pk):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response(
                {"message": "You do not have permission to update users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "data": serializer.data,
                    "message": "User updated successfully",
                },
                status=200,
            )
        return Response(
            {"errors": serializer.errors, "message": "User update failed"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response(
                {"message": "You do not have permission to delete users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(
            {"message": "User deleted successfully"}, status=status.HTTP_200_OK
        )
