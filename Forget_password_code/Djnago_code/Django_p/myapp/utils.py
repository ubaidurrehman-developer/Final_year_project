import random
import string
import hashlib
from datetime import timedelta

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache

from .models import PasswordResetOTP


# ─────────────────────────────────────────
#  SECURITY SETTINGS (tweak as needed)
# ─────────────────────────────────────────
OTP_EXPIRY_MINUTES = 2  # OTP expires after this many minutes
MAX_OTP_REQUESTS = 3  # Max OTP requests per email per window
OTP_REQUEST_WINDOW = 300  # Window in seconds (5 minutes)
MAX_VERIFY_ATTEMPTS = 5  # Max wrong OTP attempts before lockout
VERIFY_LOCKOUT_TIME = 600  # Lockout duration in seconds (10 minutes)


def generate_otp():
    """Generate a secure 5-character OTP — always contains at least one number and one letter."""
    letters = string.ascii_uppercase
    digits = string.digits

    # Guarantee at least 1 digit and 1 letter
    guaranteed = [
        random.choice(digits),  # at least one number
        random.choice(letters),  # at least one letter
    ]

    # Fill remaining 3 characters from the full mix
    rest = random.choices(letters + digits, k=3)

    # Combine and shuffle so the guaranteed chars aren't always in same position
    otp = guaranteed + rest
    random.shuffle(otp)

    return "".join(otp)


# ─────────────────────────────────────────
#  SECURITY CHECK 1 — Rate Limiting
#  Prevents users from spamming OTP requests
# ─────────────────────────────────────────
def check_rate_limit(email):
    cache_key = f"otp_request_count_{hashlib.md5(email.encode()).hexdigest()}"
    count = cache.get(cache_key, 0)
    if count >= MAX_OTP_REQUESTS:
        return False
    cache.set(cache_key, count + 1, timeout=OTP_REQUEST_WINDOW)
    return True


# ─────────────────────────────────────────
#  SECURITY CHECK 2 — Brute Force Lockout
#  Locks out user after too many wrong OTP attempts
# ─────────────────────────────────────────
def is_locked_out(email):
    cache_key = f"otp_lockout_{hashlib.md5(email.encode()).hexdigest()}"
    return cache.get(cache_key, False)


def record_failed_attempt(email):
    cache_key = f"otp_attempts_{hashlib.md5(email.encode()).hexdigest()}"
    lock_key = f"otp_lockout_{hashlib.md5(email.encode()).hexdigest()}"
    attempts = cache.get(cache_key, 0) + 1
    if attempts >= MAX_VERIFY_ATTEMPTS:
        cache.set(lock_key, True, timeout=VERIFY_LOCKOUT_TIME)
        cache.delete(cache_key)
    else:
        cache.set(cache_key, attempts, timeout=VERIFY_LOCKOUT_TIME)


def clear_failed_attempts(email):
    cache.delete(f"otp_attempts_{hashlib.md5(email.encode()).hexdigest()}")
    cache.delete(f"otp_lockout_{hashlib.md5(email.encode()).hexdigest()}")


# ─────────────────────────────────────────
#  SEND OTP EMAIL (HTML Template)
# ─────────────────────────────────────────
def send_otp_email(user):
    # SECURITY CHECK 1: Rate limit
    if not check_rate_limit(user.email):
        raise ValueError(
            f"Too many OTP requests. Please wait {OTP_REQUEST_WINDOW // 60} minutes before trying again."
        )

    # Delete all old OTPs for this user
    PasswordResetOTP.objects.filter(user=user).delete()

    # Generate and save new OTP
    otp_code = generate_otp()
    otp_obj = PasswordResetOTP.objects.create(user=user, otp=otp_code)

    # Build template context
    now = timezone.now()
    expiry = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    context = {
        "username": user.first_name or user.username,
        "email": user.email,
        "otp": otp_code,
        "time": now.strftime("%B %d, %Y at %I:%M %p UTC"),
        "expiry": expiry.strftime("%B %d, %Y at %I:%M %p UTC"),
        "year": now.year,
    }

    html_content = render_to_string("otp_email.html", context)
    plain_content = (
        f"Hi {context['username']},\n\n"
        f"Your password reset OTP is: {otp_code}\n\n"
        f"This code expires at {context['expiry']}.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"— Security Team"
    )

    msg = EmailMultiAlternatives(
        subject="Your Password Reset OTP",
        body=plain_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)

    return otp_obj
