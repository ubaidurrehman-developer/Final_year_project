# import os
# import django
# from django.utils import timezone
# from datetime import date, timedelta

# # Setup Django environment
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
# django.setup()

# from myapp.models import User, Student, Semester, Course, Registration

# def seed_academic_data():
#     print("Seeding academic data...")
    
#     # 1. Create or get Current Semester
#     today = timezone.now().date()
#     start_of_year = date(today.year, 1, 1)
#     end_of_year = date(today.year, 6, 30)
    
#     semester, created = Semester.objects.get_or_create(
#         name="Spring 2024",
#         defaults={
#             'start_date': start_of_year,
#             'end_date': end_of_year
#         }
#     )
#     if not created:
#         # Update dates to ensure it includes "today"
#         semester.start_date = start_of_year
#         semester.end_date = end_of_year
#         semester.save()
#     print(f"Semester: {semester.name} ({semester.start_date} to {semester.end_date})")

#     # 2. Create some Courses
#     courses_data = [
#         ("CS-101", "Programming Fundamentals", 4),
#         ("AI-201", "Machine Learning", 3),
#         ("SE-301", "Software Architecture", 3),
#         ("MT-102", "Calculus II", 3),
#     ]
    
#     courses = []
#     for code, name, credits in courses_data:
#         c, _ = Course.objects.get_or_create(
#             course_code=code,
#             defaults={'name': name, 'credit_hours': credits}
#         )
#         courses.append(c)
#     print(f"Created/Found {len(courses)} courses.")

#     # 3. Assign to Students
#     students = Student.objects.all()
#     if not students.exists():
#         print("No students found in DB. Please create a student user first.")
#         return

#     for student in students:
#         for course in courses:
#             Registration.objects.get_or_create(
#                 student=student,
#                 course=course,
#                 semester=semester,
#                 defaults={'status': Registration.Status.REGISTERED}
#             )
#         print(f"Registered {len(courses)} courses for student: {student.roll_no}")

#     print("Seeding complete! Refresh your dashboard.")

# if __name__ == "__main__":
#     seed_academic_data()
