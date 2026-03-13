from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_otps")
    otp = models.CharField(max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        """OTP is valid if unused and created within the last 10 minutes."""
        expiry = self.created_at + timezone.timedelta(minutes=10)
        return not self.is_used and timezone.now() <= expiry

    def __str__(self):
        return f"OTP for {self.user.email} — used: {self.is_used}"
