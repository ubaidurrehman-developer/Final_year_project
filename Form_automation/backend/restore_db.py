from myapp.models import User, Student, AcademicRequest
import datetime


def restore_data():
    # Restore User 1
    u1, _ = User.objects.get_or_create(
        user_id="22P-9004",
        defaults={
            "name": "Ubaid ur Rehman",
            "gender": "M",
            "email": "ubaid@gmail.com",
            "mobile": "0300-1234567",
            "cnic": "12345-1234567-1",
            "blood_group": "A+",
            "nationality": True,
        },
    )

    # Restore User 2
    u2, _ = User.objects.get_or_create(
        user_id="22P-9314",
        defaults={
            "name": "Abdullah Bilal",
            "gender": "M",
            "email": "abdullah@gmail.com",
            "mobile": "0300-7654321",
            "cnic": "54321-7654321-0",
            "blood_group": "B+",
            "nationality": True,
        },
    )

    # Restore Students
    s1, _ = Student.objects.get_or_create(
        user=u1,
        defaults={"status": "Active", "degree": "BS", "program": "CS", "batch": 2022},
    )
    s2, _ = Student.objects.get_or_create(
        user=u2,
        defaults={"status": "Active", "degree": "BS", "program": "CS", "batch": 2022},
    )

    # Restore Academic Requests
    AcademicRequest.objects.get_or_create(
        id=2, defaults={"student": s2, "type": "Withdraw", "status": "Pending"}
    )
    AcademicRequest.objects.get_or_create(
        id=3, defaults={"student": s2, "type": "Retake", "status": "Approved"}
    )

    print("Data restoration complete.")


restore_data()
