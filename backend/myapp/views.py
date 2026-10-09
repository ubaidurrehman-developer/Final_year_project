# views.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from django.shortcuts import render, get_object_or_404
from django.conf import settings as django_settings
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from datetime import date
from .serializers import *
from .models import *
from Backend.services import llm_parser

from Backend.services.agents import FormProcessingAgent
from PIL import Image

import os,json
import logging
from django.views.generic import TemplateView

class FrontendView(TemplateView):
    template_name = "index.html"

logger = logging.getLogger(__name__)


def home(request):
    return render(request, "home.html")

from rest_framework.decorators import permission_classes


CACHE = {}
RULES = []
MAX_RULES = 20


def extract_rules(mistakes):
    rules = []
    for m in mistakes or []:
        solution = m.get("solution", "").strip()
        if solution and len(solution) > 10:
            rules.append(solution)
    return rules


def update_rules(new_rules):
    global RULES
    for r in new_rules:
        if r not in RULES:
            RULES.append(r)
    RULES = RULES[-MAX_RULES:]


def build_system_prompt():
    rules_text = "\n".join(f"- {r}" for r in RULES)

    return f"""
You modify JSON strictly.

Follow these rules:
{rules_text}

Return ONLY valid JSON in this format:
{{
  "updated_json": <modified_json>,
  "errors": [],
  "mistakes": []
}}

Rules:
- Do NOT add explanation
- Keep keys unchanged unless asked
- If unsure, do not modify
"""
    

HISTORY = {}

@api_view(["POST"])
@permission_classes([AllowAny])
def modify_json(request):
    try:
        prompt_text = request.data.get("prompt")
        json_data = request.data.get("json")

        if not prompt_text or not json_data:
            return Response({"error": "Missing prompt or json data"}, status=400)

        # Get session-based history
        session_id = request.session.session_key or "guest"
        if session_id not in HISTORY:
            HISTORY[session_id] = [
                {"role": "system", "content": build_system_prompt()}
            ]
        
        # Add the current state and new instruction to history
        json_str = json.dumps(json_data, separators=(",", ":"))
        
        # We only keep the last 10 messages to avoid token bloating
        HISTORY[session_id] = HISTORY[session_id][-10:]
        
        # Add context and instructions
        HISTORY[session_id].append({"role": "user", "content": f"Current JSON state: {json_str}"})
        HISTORY[session_id].append({"role": "user", "content": prompt_text})

        client = llm_parser._get_client()

        response = client.chat.completions.create(
            model="gpt-4o-mini",   
            messages=HISTORY[session_id],
            temperature=0,
            max_tokens=2000, # Increased for potentially longer history/responses
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()

        try:
            parsed_data = json.loads(content)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON: {content[:200]}")
            return Response({
                "status": "error",
                "message": "Invalid JSON from AI"
            }, status=500)

        # Update History with AI's JSON response so it knows the new state
        HISTORY[session_id].append({"role": "assistant", "content": content})

        new_rules = extract_rules(parsed_data.get("mistakes", []))
        update_rules(new_rules)

        return Response(parsed_data)

    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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

            # Run the full pipeline via the orchestrator agent
            agent = FormProcessingAgent()
            result = agent.run(image, run_llm=True)

            # Save annotated image
            annotated_img = result.pop("annotated_image", None)
            if annotated_img:
                annotated_path = os.path.join(django_settings.MEDIA_ROOT, "annotated.jpg")
                annotated_img.save(annotated_path)

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
        user = request.user
        role = "admin" if user.is_superuser else "student"
        
        data = {
            "role": role,
            "must_change_password": user.must_change_password,
            "user": {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": user.full_name,
                "email": user.email,
                "username": user.username,
                "gender": user.get_gender_display() if user.gender else None,
                "dob": user.dob,
                "cnic": user.cnic,
                "mobile": user.mobile,
                "blood_group": user.get_blood_group_display() if user.blood_group else None,
                "nationality": user.nationality,
                "last_login": user.last_login,
                "profile_pic": request.build_absolute_uri(user.profile_pic.url) if user.profile_pic else None
            }
        }

        if role == "student":
            try:
                student = user.student
                addresses = Address.objects.filter(user=user)
                perm_addr = addresses.filter(address_type=Address.AddressType.PERMANENT).first()
                curr_addr = addresses.filter(address_type=Address.AddressType.CURRENT).first()

                data.update({
                    "roll_no": student.roll_no,
                    "status": student.status,
                    "campus": student.get_campus_display(),
                    "degree": student.get_degree_display(),
                    "program": student.get_program_display(),
                    "batch": student.batch,
                    "addresses": {
                        "permanent": {
                            "line": perm_addr.address if perm_addr else "",
                            "city": perm_addr.city if perm_addr else "",
                            "country": perm_addr.country if perm_addr else "",
                            "postal": perm_addr.postal_code if perm_addr else ""
                        },
                        "current": {
                            "line": curr_addr.address if curr_addr else "",
                            "city": curr_addr.city if curr_addr else "",
                            "country": curr_addr.country if curr_addr else "",
                            "postal": curr_addr.postal_code if curr_addr else ""
                        }
                    },
                    "academic_calendar": {
                        "registration": "14-Jan-2026 to 01-Feb-2026",
                        "classes": "02-Feb-2026"
                    }
                })
            except Student.DoesNotExist:
                pass 

        return Response(data)


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
    
# ----------------------------- { Student Informaiton is seperated  } ----------------------------------------------- #
# student Submission history
class StudentFormsDashboardView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
            history = StudentFormSubmission.objects.filter(student_id=student).order_by('-submitted_date')
            serializer = SubmissionHistorySerializer(history, many=True)
            return Response({
                "history": serializer.data
            }, status=status.HTTP_200_OK)

        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)
        except Exception:
            logger.exception("Error fetching student forms dashboard")
            return Response({"error": "An internal error occurred"}, status=500)

    def post(self, request):
        try:
            serializer = SubmissionSerializer(data=request.data)
            if serializer.is_valid():
                student = Student.objects.get(user=request.user)
                serializer.save(student_id=student)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Error creating student form submission")
            return Response({"error": "An internal error occurred"}, status=500)

# student dashboard 
class StudentDashboardStatsView(APIView):
    """Returns summary stats for the Student Dashboard homepage."""
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=404)

        try:

            # 1. Forms processed (all submissions for this student)
            submissions = StudentFormSubmission.objects.filter(student_id=student)
            forms_count = submissions.count()

            # 2. Pending academic requests
            pending_requests = AcademicRequest.objects.filter(
                student=student,
                status=AcademicRequest.Status.PENDING
            ).count()

            # 3. Enrolled / registered courses
            registrations = Registration.objects.filter(
                student=student,
                status=Registration.Status.REGISTERED
            ).select_related('course', 'semester')
            
            # 4. academic data
            self.ensure_academic_data(student)
            enrolled_courses_count = registrations.count()
            
            # 4. Current Semester & Course Details
            today = timezone.now().date()
            curr_sem = Semester.objects.filter(start_date__lte=today, end_date__gte=today).first()
            
            course_details = []
            total_credits = 0
            semester_name = curr_sem.name if curr_sem else "N/A"
            
            for reg in registrations:
                course_details.append({
                    "code": reg.course.course_code,
                    "name": reg.course.name,
                    "credits": reg.course.credit_hours,
                    "semester": reg.semester.name
                })
                total_credits += reg.course.credit_hours

            # 5. Recent activity feed (latest 5 submissions)
            recent_subs = submissions.order_by('-submitted_date').select_related('form_id')[:5]
            updates = [
                {
                    "id": sub.submission_id,
                    "time": sub.submitted_date.strftime("%d %b"),
                    "msg": f"{sub.form_id.title} — {sub.status}"
                }
                for sub in recent_subs
            ]

            return Response({
                "full_name": user.full_name or f"{user.first_name} {user.last_name}",
                "roll_no": student.roll_no,
                "program": student.get_program_display(),
                "batch": student.batch,
                "academic_status": student.status,
                "forms": forms_count,
                "requests": pending_requests,
                "courses_count": enrolled_courses_count,
                "total_credits": total_credits,
                "current_semester": semester_name,
                "course_list": course_details,
                "updates": updates,
            }, status=status.HTTP_200_OK)

        except Exception:
            logger.exception("Error fetching student dashboard stats")
            return Response({"error": "An internal error occurred"}, status=500)

            
    def ensure_academic_data(self, student):
        """Checks if academic data exists, if not, creates it for development."""
        today = timezone.now().date()
        
        # 1. Ensure a current semester exists
        semester, _ = Semester.objects.get_or_create(
            name="Sp 2024",
            defaults={
                'start_date': date(today.year, 1, 1),
                'end_date': date(today.year, 6, 30)
            }
        )
        # 2. Check if student has registrations
        if not Registration.objects.filter(student=student).exists():
            # Create some default courses if they don't exist
            courses_data = [
                ("CS-101", "Prog Fund", 4),
                ("AI-201", "Machine Learning", 3),
                ("SE-301", "Software Arch", 3),
            ]
            for code, name, credits in courses_data:
                course, _ = Course.objects.get_or_create(
                    course_code=code, 
                    defaults={'name': name, 'credit_hours': credits}
                )
                # Register the student
                Registration.objects.get_or_create(
                    student=student,
                    course=course,
                    semester=semester,
                    status=Registration.Status.REGISTERED
                )