from django.shortcuts import render


def password_reset(request):
    return render(request, "password_reset.html")


from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json

from .models import PasswordResetOTP
from .utils import (
    send_otp_email,
    is_locked_out,
    record_failed_attempt,
    clear_failed_attempts,
)


@csrf_exempt
@require_POST
def request_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip().lower()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({"error": "Invalid request body."}, status=400)

    if not email:
        return JsonResponse({"error": "Email is required."}, status=400)

    # SECURITY CHECK 2: Brute force lockout check
    if is_locked_out(email):
        return JsonResponse(
            {"error": "Too many failed attempts. Please try again in 1 minute."},
            status=429,
        )

    try:
        user = User.objects.get(email=email)
        send_otp_email(user)
    except User.DoesNotExist:
        pass  # Don't reveal if email is registered
    except ValueError as e:
        # Rate limit error from utils.py
        return JsonResponse({"error": str(e)}, status=429)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse(
        {"message": "If this email is registered, an OTP has been sent."}, status=200
    )


@csrf_exempt
@require_POST
def verify_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip().lower()
        otp = data.get("otp", "").strip()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({"error": "Invalid request body."}, status=400)

    if not email or not otp:
        return JsonResponse({"error": "Email and OTP are required."}, status=400)

    # SECURITY CHECK 2: Check lockout before even querying
    if is_locked_out(email):
        return JsonResponse(
            {"error": "Too many failed attempts. Please try again in 10 minutes."},
            status=429,
        )

    # SECURITY CHECK 3: OTP must be exactly 5 digits
    if not otp.isalnum() or len(otp) != 5:
        return JsonResponse({"error": "OTP must be a 5-digit number."}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "Invalid credentials."}, status=400)

    otp_obj = (
        PasswordResetOTP.objects.filter(user=user, otp=otp, is_used=False)
        .order_by("-created_at")
        .first()
    )

    if not otp_obj:
        # SECURITY CHECK 2: Record failed attempt
        record_failed_attempt(email)
        return JsonResponse({"error": "Invalid OTP."}, status=400)

    if not otp_obj.is_valid():
        return JsonResponse(
            {"error": "OTP has expired. Please request a new one."}, status=400
        )

    # Success — mark OTP used and clear lockout counters
    otp_obj.is_used = True
    otp_obj.save()
    clear_failed_attempts(email)

    return JsonResponse(
        {
            "message": "OTP verified successfully. You may now reset your password.",
            "user_id": user.id,
        },
        status=200,
    )
