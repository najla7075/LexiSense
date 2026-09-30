from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Child, Questionnaire, AssessmentSession, EyeTrackingData, QuestionnaireAnswer


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('username', 'email', 'role', 'is_approved', 'is_staff', 'is_active')
    list_filter = ('role', 'is_approved', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('LexiSense Role Info', {'fields': ('role', 'is_approved')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('LexiSense Role Info', {'fields': ('role', 'is_approved')}),
    )


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ('name', 'age', 'class_name', 'parent')
    search_fields = ('name', 'class_name', 'parent__username')
    list_filter = ('class_name', 'age')


@admin.register(Questionnaire)
class QuestionnaireAdmin(admin.ModelAdmin):
    list_display = ('id', 'question')
    search_fields = ('question',)


@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'child', 'type', 'date')
    list_filter = ('type', 'date')
    search_fields = ('child__name',)


@admin.register(EyeTrackingData)
class EyeTrackingDataAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'timestamp', 'gaze_x', 'gaze_y', 'pupil_diameter')


@admin.register(QuestionnaireAnswer)
class QuestionnaireAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'question', 'answer')


admin.site.register(User, CustomUserAdmin)

