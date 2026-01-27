from django.urls import path, include
from .views import *

urlpatterns = [
    path("", home),
    path("users/", user_list),
    path("users/create/", user_create),
    path("users/update/<int:pk>/", user_update),
    path("users/delete/<str:pk>/", user_delete),
    path("authentications/", authentication_list),
    path("addresses/", address_list),
    path("students/", student_list),
    path("admins/", admin_list),
    path("semesters/", semester_list),
    path("courses/", course_list),
    path("student_semesters/", student_semester_list),
    path("registrations/", registration_list),
    path("academic_requests/", academic_request_list),
    path("academic_requests/create/", academic_request_create),
    path("academic_requests/update/<int:pk>/", academic_request_update),
    path("academic_requests/delete/<int:pk>/", academic_request_delete),
]
