# views.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render, get_object_or_404
from rest_framework import status
from .serializers import *
from .models import *

from django.views.decorators.csrf import csrf_exempt
from PIL import Image
from .detector import *


def home(request):
    return render(request, "home.html")

def upload(request):
    return render(request, "upload.html")


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.is_staff)
        )

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("auth_token")
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token

@api_view(["POST"])
@permission_classes([AllowAny]) # [IsAuthenticated] for production
@csrf_exempt                    # remove in production
def run_detector(request):
    uploadedfile = request.FILES.get("file")
    if not uploadedfile:
        return Response(
            {"message": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        image = Image.open(uploadedfile)
        input_data, scale, pad_x, pad_y = preprocess(image)

        outputs = session.run(None, {session.get_inputs()[0].name: input_data})
        print(f"[DEBUG] Model output shape: {outputs[0].shape}")

        detections = format_detections(outputs, image.size, scale, pad_x, pad_y)
        print(f"[DEBUG] Number of detections: {len(detections)}")

        detections = pixel_tighten_detections(image, detections, y_thresh=20) # tighting box and sorting from top-bottom
        annotated_img, crop_paths = visualize_and_Crop(
            image.copy(), detections, save_dir="media/crops"
        )
        annotated_path = "media/annotated.jpg"
        annotated_img.save(annotated_path)

        return Response(
            {
                "status": "success",
                "total_count": len(detections),
            }
        )
    except Exception as e:
        return Response(
            {"status": "error", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )



class ChangePasswordView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]
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
        request.user.must_change_password = False
        request.user.save(update_fields=["must_change_password"])

        return Response({"message": "Password reset successful"})


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

        if user.must_change_password:
            return Response(
                {
                    "message": "Password change required",
                    "force_password_change": True,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

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
            max_age=60 * 60,
            httponly=True,
            secure=False,   # in production set to True
            samesite="Lax", # in production set to "Strict" 
        )

        return response

class MeView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"role": "admin" if request.user.is_superuser else "student"})


# -------------------------------------------------------------- (USER OPERATIONS) ---------------------------------------------------------------------- #
class UserView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = UserSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        print(request.data["password"])

        return Response(
            {"message": "User created successfully", "username": user.username},
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
