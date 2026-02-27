from django.urls import path
from .views import *

urlpatterns = [
    path("", home),
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view()),
    path("users/", UserView.as_view()), # GET, POST
    path("users/<str:pk>/", UserView.as_view()), #PUT, DELETE
    path("detection/", DetectionView.as_view()),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
]
