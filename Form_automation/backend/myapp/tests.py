from rest_framework.test import APITestCase
from rest_framework import status
from .models import User, Student, AcademicRequest


class UserTest(APITestCase):
    def test_create_user(self):
        # We use a unique ID and cleanup to avoid conflicts on the real DB
        unique_user_id = "22P-9005"
        data = {
            "user_id": unique_user_id,
            "name": "Test User",
            "gender": "M",
            "email": "testuser@example.com",
            "mobile": "0300-1234567",
            "cnic": "12345-1234567-1",
            "blood_group": "A+",
            "nationality": True,
        }
        # Cleanup first if it exists from a previous failed run
        User.objects.filter(user_id=unique_user_id).delete()

        response = self.client.post("/users/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(user_id=unique_user_id).exists())

    # def test_delete_user(self):
    #     unique_user_id = "22P-9006"
    #     User.objects.filter(user_id=unique_user_id).delete()
    #     user = User.objects.create(
    #         user_id=unique_user_id,
    #         name="Delete Me",
    #         gender="M",
    #         email="delete@example.com",
    #         mobile="0300-1112223",
    #         cnic="11111-2222222-3",
    #         blood_group="B+",
    #         nationality=True
    #     )
    #     response = self.client.delete(f"/users/delete/{user.user_id}/")
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertFalse(User.objects.filter(user_id=unique_user_id).exists())


class AcademicRequestTest(APITestCase):
    def setUp(self):
        # Create a test student and related user
        self.student_user_id = "22P-9315"
        User.objects.filter(user_id=self.student_user_id).delete()
        self.user = User.objects.create(
            user_id=self.student_user_id,
            name="Test Student",
            gender="M",
            email="test_ar@student.com",
            mobile="0300-9998887",
            cnic="99999-8888888-7",
            blood_group="O+",
            nationality=True,
        )
        self.student = Student.objects.create(
            user=self.user, status="Active", degree="BS", program="CS", batch=2022
        )

    def test_create_request(self):
        data = {
            "student": self.student_user_id,
            "type": "Withdraw",
            "status": "Pending",
        }
        response = self.client.post("/academic_requests/create/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Cleanup after test
        # AcademicRequest.objects.filter(student=self.student).delete()
        # Student.objects.filter(user=self.user).delete()
        # User.objects.filter(user_id=self.student_user_id).delete()
