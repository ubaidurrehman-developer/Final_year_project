from django.contrib import admin
from .models import *


admin.site.site_header = "Formulate"
admin.site.site_title = "Formulate"
admin.site.index_title = "Admin Panel"

admin.site.register(User)
admin.site.register(Address)
admin.site.register(Student)
admin.site.register(Semester)
admin.site.register(Course)
admin.site.register(StudentSemester)
admin.site.register(Registration)
admin.site.register(AcademicRequest)

