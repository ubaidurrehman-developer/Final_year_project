from django.urls import path
from .views import *

urlpatterns = [
    path("", home),
    path("upload/", upload),
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view()),
    path("users/", UserView.as_view()), # GET, POST
    path("users/<int:pk>/", UserView.as_view()), #PUT, DELETE
    path("detect/", run_detector),
    path("auth/change-password/", ChangePasswordView.as_view()),
]
