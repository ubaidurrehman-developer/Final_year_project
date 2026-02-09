from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser

# Create your models here.


class User(AbstractUser):

    class Gender(models.TextChoices):
        M = "M", "Male"
        F = "F", "Female"
        T = "T", "Transgender"

    class BloodGroup(models.TextChoices):
        A_POS = "A+", "A+"
        A_NEG = "A-", "A-"
        B_POS = "B+", "B+"
        B_NEG = "B-", "B-"
        AB_POS = "AB+", "AB+"
        AB_NEG = "AB-", "AB-"
        O_POS = "O+", "O+"
        O_NEG = "O-", "O-"

    first_name = models.CharField("First Name", max_length=150, blank=True, null=True)
    last_name = models.CharField("Last Name", max_length=150, blank=True, null=True)

    full_name = models.CharField(
        "Username",
        max_length=50,
        validators=[RegexValidator(r"^[a-zA-Z\s]*$")],
        null=True,
        blank=True,
    )
    gender = models.CharField(
        "Gender", max_length=1, choices=Gender.choices, null=True, blank=True
    )
    dob = models.DateField("Date of Birth", null=True, blank=True)    
    password = models.CharField("Password", max_length=255, null=True, blank=True)
    email = models.EmailField("Email", unique=True, null=True, blank=True)
    must_change_password = models.BooleanField(default=False)
    mobile = models.CharField(
        "Mobile",
        max_length=12,
        validators=[RegexValidator(r"^\d{4}-\d{7}$")],
        null=True,
        blank=True,
    )
    cnic = models.CharField(
        "CNIC",
        max_length=15,
        validators=[RegexValidator(r"^\d{5}-\d{7}-\d{1}$")],
        null=True,
        blank=True,
    )
    blood_group = models.CharField(
        "Blood Group", max_length=3, choices=BloodGroup.choices, null=True, blank=True
    )
    nationality = models.CharField("Nationality", max_length=30, null=True, blank=True)
    created_by = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_users",
    )

    class Meta:
        db_table = "users"


class Student(models.Model):
    class Campus(models.TextChoices):
        P = "P", "Peshawar"
        F = "F", "Faisalabad"
        L = "L", "Lahore"
        I = "I", "Islamabad"
        K = "K", "Karachi"
        M = "M", "Multan"

    class Status(models.TextChoices):
        ACTIVE = "Active"
        GRADUATED = "Graduated"
        SUSPENDED = "Suspended"

    class Degree(models.TextChoices):
        BS = "BS", "Bachelor of Science"
        MS = "MS", "Master of Science"
        PHD = "PhD", "Doctor of Philosophy"

    class Program(models.TextChoices):
        CS = "CS", "Computer Science"
        SE = "SE", "Software Engineering"
        AI = "AI", "Artificial Intelligence"
        CE = "CE", "Computer Engineering"

    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    roll_no = models.CharField("User ID", max_length=8, unique=True)
    status = models.CharField("Status", max_length=10, choices=Status.choices, default=Status.ACTIVE)
    campus = models.CharField(
        "Campus", max_length=1, choices=Campus.choices, default=Campus.P
    )
    degree = models.CharField("Degree", max_length=5, choices=Degree.choices)
    program = models.CharField("Program", max_length=5, choices=Program.choices)
    batch = models.CharField(
        "Batch", max_length=4, validators=[RegexValidator("^20[0-9]{2}$")]
    )

    class Meta:
        db_table = "student"


class Address(models.Model):
    class AddressType(models.TextChoices):
        PERMANENT = "Permanent"
        CURRENT = "Current"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    address_type = models.CharField(max_length=10, choices=AddressType.choices)
    address = models.TextField()
    city = models.CharField(max_length=15)
    province = models.CharField(max_length=20)
    country = models.CharField(max_length=20)
    postal_code = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        db_table = "address"
        verbose_name_plural = "Addresses"


class Semester(models.Model):
    name = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        db_table = "semester"


class Course(models.Model):
    course_code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=20)
    credit_hours = models.IntegerField()

    class Meta:
        db_table = "courses"


class StudentSemester(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE)

    class Meta:
        db_table = "student_semester"
        unique_together = ("student", "semester")


class Registration(models.Model):
    class Status(models.TextChoices):
        REGISTERED = "Registered"
        WITHDRAWN = "Withdrawn"

    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=Status.choices)

    class Meta:
        db_table = "registration"


class AcademicRequest(models.Model):
    class RequestType(models.TextChoices):
        WITHDRAW = "Withdraw"
        RETAKE = "Retake"

    class Status(models.TextChoices):
        PENDING = "Pending"
        APPROVED = "Approved"
        REJECTED = "Rejected"

    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=RequestType.choices)
    request_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices)

    class Meta:
        db_table = "academic_request"
