from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Child,
    AssessmentSession,
    QuestionnaireAnswer,
    EyeTrackingData,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_approved']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.CharField(default='parent')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        selected_role = validated_data.get('role', 'parent').lower()
        if selected_role not in ['parent', 'teacher', 'admin']:
            selected_role = 'parent'

        # Parents are approved immediately; Teacher/Admin require Super Admin approval!
        is_approved = True if selected_role == 'parent' else False

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=selected_role,
            is_approved=is_approved
        )
        return user


class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Child
        fields = ['id', 'name', 'age', 'class_name']


class AssessmentSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentSession
        fields = ['id', 'child', 'type', 'date']
        read_only_fields = ['id', 'date']


class QuestionnaireAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionnaireAnswer
        fields = ['id', 'session', 'question', 'answer']
        read_only_fields = ['id']


class EyeTrackingDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = EyeTrackingData
        fields = [
            'id',
            'session',
            'timestamp',
            'gaze_x',
            'gaze_y',
            'pupil_diameter',
        ]
        read_only_fields = ['id']