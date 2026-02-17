from .models import *
from django.contrib import admin


admin.site.site_header = "Formulate"
admin.site.site_title = "Formulate"
admin.site.index_title = "Admin Panel"

admin.site.register(User)
admin.site.register(Authentication)
admin.site.register(Address)
admin.site.register(Student)
admin.site.register(Admin)
admin.site.register(Semester)
admin.site.register(Course)
admin.site.register(StudentSemester)
admin.site.register(Registration)
admin.site.register(AcademicRequest)

