# views.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render, get_object_or_404
from django.conf import settings as django_settings
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from .serializers import *
from .models import *

from PIL import Image
from Backend.services.agents import FormProcessingAgent

import os
import logging

logger = logging.getLogger(__name__)


def home(request):
    return render(request, "home.html")

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("auth_token")
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token


class DetectionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]
    
    def post(self, request):
        uploadedfile = request.FILES.get("file")        
        if not uploadedfile:
            return Response(
                {"message": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST
        )

        try:
            image = Image.open(uploadedfile)

            # Resolve save paths relative to MEDIA_ROOT
            crops_dir = os.path.join(django_settings.MEDIA_ROOT, "crops")

            # Run the full pipeline via the orchestrator agent
            agent = FormProcessingAgent()
            result = agent.run(image, save_dir=crops_dir, run_llm=True)

            # Save annotated image
            annotated_img = result.pop("annotated_image", None)
            if annotated_img:
                annotated_path = os.path.join(django_settings.MEDIA_ROOT, "annotated.jpg")
                annotated_img.save(annotated_path)

            # Remove non-serializable fields before sending response
            result.pop("crop_paths", None)

            return Response(result)

        except Exception as e:
            logger.exception("Detection pipeline failed")
            return Response(
                {"status": "error", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BasePasswordView(APIView):

    def validate_and_set_password(self, user, oldpassword, newpassword, confirmpassword, check_old_password):

        if check_old_password:
            if not user.check_password(oldpassword):
                return Response(
                    {"message": "Old password is incorrect"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if oldpassword and oldpassword == newpassword:
            return Response(
                {"message": "Old password and new password cannot be same"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not newpassword or not confirmpassword:
            return Response({"message": "All fields are required"}, status=400)
            
        if newpassword != confirmpassword:
            return Response(
                {"message": "New password and confirm password do not match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(newpassword)        
        user.must_change_password = False
        user.save()

        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

class ResetPasswordView(BasePasswordView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]  # User must be logged in

    def post(self, request):                
        return self.validate_and_set_password(
            user=request.user,
            oldpassword=request.data.get("oldPassword"),
            newpassword=request.data.get("newPassword"),
            confirmpassword=request.data.get("confirmPassword"),            
            check_old_password=True
        )

class ForgotPasswordView(BasePasswordView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        # Sending OTP message on the mail

        user = get_object_or_404(User, email=email)
        return self.validate_and_set_password(
            user=user,
            oldpassword=None,
            newpassword=request.data.get("newPassword"),
            confirmpassword=request.data.get("confirmPassword"),                  
            check_old_password=False
        )
        

class LogoutView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        response = Response({"message": "User logged out successfully"})
        response.delete_cookie("auth_token")
        return response

class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            raise AuthenticationFailed("Username or password is invalid")

        user = serializer.user

        role = "admin" if user.is_superuser else "student"        
        access = serializer.validated_data["access"]
        refresh = serializer.validated_data["refresh"]

        force_password_change = user.must_change_password
        response = Response(
                {
                    "access": access,
                    "refresh": refresh,
                    "role": role,
                    "force_password_change": force_password_change,
                    "message": "User logged in successfully",
                }
        )

        is_production = not django_settings.DEBUG
        response.set_cookie(
            key="auth_token",
            value=access,
            max_age=60 * 60,
            httponly=True,
            secure=is_production,
            samesite="Strict" if is_production else "Lax",
        )

        return response

class MeView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "role": "admin" if request.user.is_superuser else "student",
            "must_change_password": request.user.must_change_password,
        })


# -------------------------------------------------------------- (USER OPERATIONS) ---------------------------------------------------------------------- #
class UserView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Return password from context (if generated) or directly from data
        password = serializer.context.get("generated_password") or request.data.get("password", "SET_SUCCESSFULLY")

        return Response(
            {
                "message": "User created successfully", 
                "username": user.username,
                "password": password
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def put(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(
            user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "User updated successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(
            {"message": "User deleted successfully"},
            status=status.HTTP_200_OK,
        )


class DashboardView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # -- User & Student counts --
        total_users = User.objects.count()
        total_admins = User.objects.filter(is_superuser=True).count()
        total_students = Student.objects.count()

        # -- Student breakdowns --
        students_by_program = dict(
            Student.objects.values_list("program")
            .annotate(count=Count("user"))
            .order_by("program")
        )
        students_by_status = dict(
            Student.objects.values_list("status")
            .annotate(count=Count("user"))
            .order_by("status")
        )
        students_by_campus = dict(
            Student.objects.values_list("campus")
            .annotate(count=Count("user"))
            .order_by("campus")
        )
        students_by_degree = dict(
            Student.objects.values_list("degree")
            .annotate(count=Count("user"))
            .order_by("degree")
        )

        # -- Course & Registration --
        total_courses = Course.objects.count()
        total_registrations = Registration.objects.count()
        registrations_active = Registration.objects.filter(
            status=Registration.Status.REGISTERED
        ).count()
        registrations_withdrawn = Registration.objects.filter(
            status=Registration.Status.WITHDRAWN
        ).count()

        # Active Students
        active_students = Student.objects.filter(status=Student.Status.ACTIVE).count()

        # -- Academic requests --
        pending_requests = AcademicRequest.objects.filter(
            status=AcademicRequest.Status.PENDING
        ).count()
        approved_requests = AcademicRequest.objects.filter(
            status=AcademicRequest.Status.APPROVED
        ).count()
        rejected_requests = AcademicRequest.objects.filter(
            status=AcademicRequest.Status.REJECTED
        ).count()

        # -- Pending request list (latest 10) --
        pending_list = list(
            AcademicRequest.objects.filter(status=AcademicRequest.Status.PENDING)
            .select_related("student__user")
            .order_by("-request_date")[:10]
            .values(
                "id",
                "type",
                "request_date",
                "student__roll_no",
                "student__user__full_name",
            )
        )

        # -- Recent users (latest 8) --
        recent_users = list(
            User.objects.order_by("-date_joined")[:8].values(
                "id",
                "username",
                "full_name",
                "email",
                "is_superuser",
                "date_joined",
            )
        )

        # -- Semester info --
        today = timezone.now().date()
        current_semester = (
            Semester.objects.filter(start_date__lte=today, end_date__gte=today)
            .values("name", "start_date", "end_date")
            .first()
        )

        return Response({
            "counts": {
                "total_users": total_users,
                "total_admins": total_admins,
                "total_students": total_students,
                "active_students": active_students,
                "total_courses": total_courses,
                "total_registrations": total_registrations,
                "registrations_active": registrations_active,
                "registrations_withdrawn": registrations_withdrawn,
                "pending_requests": pending_requests,
                "approved_requests": approved_requests,
                "rejected_requests": rejected_requests,
            },
            "students_by_program": students_by_program,
            "students_by_status": students_by_status,
            "students_by_campus": students_by_campus,
            "students_by_degree": students_by_degree,
            "pending_list": pending_list,
            "recent_users": recent_users,
            "current_semester": current_semester,
        })

