from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):

    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='parent'
    )
    is_approved = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Child(models.Model):
    parent = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='children'
    )
    name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    class_name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Questionnaire(models.Model):
    question = models.TextField()
    options = models.JSONField(default=list)

    def __str__(self):
        return self.question


class AssessmentSession(models.Model):

    SESSION_TYPES = (
        ('eye_tracking', 'Eye Tracking'),
        ('questionnaire', 'Questionnaire'),
    )

    child = models.ForeignKey(
        Child,
        on_delete=models.CASCADE,
        related_name='assessment_sessions'
    )

    type = models.CharField(
        max_length=20,
        choices=SESSION_TYPES
    )

    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.child.name} - {self.type}"


class EyeTrackingData(models.Model):
    session = models.ForeignKey(
        AssessmentSession,
        on_delete=models.CASCADE,
        related_name='eye_tracking_data'
    )

    timestamp = models.FloatField()
    gaze_x = models.FloatField()
    gaze_y = models.FloatField()
    pupil_diameter = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Eye tracking - {self.session}"


class QuestionnaireAnswer(models.Model):
    session = models.ForeignKey(
        AssessmentSession,
        on_delete=models.CASCADE,
        related_name='questionnaire_answers'
    )

    question = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE,
        related_name='answers'
    )

    answer = models.TextField()

    def __str__(self):
        return f"{self.session} - {self.question}"