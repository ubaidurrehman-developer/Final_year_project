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

from PIL import Image
from .detector import *


def home(request):
    return render(request, "home.html")


# class IsAdmin(BasePermission):
#     def has_permission(self, request, view):
#         return bool(
#             request.user
#             and request.user.is_authenticated
#             and (request.user.is_superuser or request.user.is_staff)
#         )

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
            # Open the uplaoded image (b, w, h)
            image = Image.open(uploadedfile)

            # STEP # 01 -> Preprocessing the image = [1, 3, 640, 640] => [batch, channels, height, width]
            input_data, scale, pad_x, pad_y = preprocess(image)

            # STEP # 02 -> Run through YOLO Model
            outputs = session.run(None, {session.get_inputs()[0].name: input_data})
            print(f"[DEBUG] Model output shape: {outputs[0].shape}")
            # returns numpy array 

            # STEP # 03 -> Format Detection
            detections = format_detections(outputs, image.size, scale, pad_x, pad_y)
            print(f"[DEBUG] Number of detections: {len(detections)}")

            # debug_raw_detections(uploadedfile,detections)

            detections = pixel_tighten_detections(image, detections, y_thresh=20) # tighting box and sorting from top-bottom
            
            # DEBUG: See what classes are in detections
            detections = add_text_to_detections(detections, image)
            # STEP # 05 -> Clusters Formation (Grouping)
            final_results = clusters_formation(detections)
            print(f"[DEBUG] Number of final grouped/individual items: {len(final_results)}")
            
            annotated_img, crop_paths = visualize_and_Crop(
                image.copy(), detections, save_dir="media/crops"
            )
            annotated_path = "media/annotated.jpg"
            annotated_img.save(annotated_path)

            return Response(
                {
                    "status": "success",
                    "total_count": len(final_results),
                    "detections": final_results,
                }
            )
        except Exception as e:
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
    permission_classes = [IsAuthenticated]

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
