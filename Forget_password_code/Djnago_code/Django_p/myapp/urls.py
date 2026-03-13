from django.urls import path
from .views import *
from . import views

urlpatterns = [
    path("password_reset/", password_reset),
    path("request-otp/", views.request_otp, name="request_otp"),
    path("verify-otp/", views.verify_otp, name="verify_otp"),
]
