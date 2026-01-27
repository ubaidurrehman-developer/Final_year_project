from django.urls import path
from .views import *

urlpatterns = [
    path("", home),
    path("login/", LoginView.as_view()),
    path("users/", UserView.as_view()),
    path("users/<int:pk>/", UserView.as_view()),
    path("auth/forgot-password/", ForgotPasswordView.as_view()),
]
