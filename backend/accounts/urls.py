from django.urls import path
from .views import (
    ParentRegisterView,
    CurrentUserView,
    SuperAdminTestView,
    ParentChildrenView,
    ParentAssessmentView,
    ParentQuestionnaireAnswerView,
    ParentEyeTrackingView,
    ScreeningSyncView,
    AIChatbotView,
)

urlpatterns = [
    path(
        'chatbot/ask/',
        AIChatbotView.as_view(),
        name='chatbot-ask'
    ),

    path(
        'chat/',
        AIChatbotView.as_view(),
        name='chat-api'
    ),

    path(
        'auth/register/',
        ParentRegisterView.as_view(),
        name='auth-register'
    ),

    path(
        'auth/me/',
        CurrentUserView.as_view(),
        name='auth-me'
    ),

    path(
        'test-super-admin/',
        SuperAdminTestView.as_view(),
        name='test-super-admin'
    ),

    path(
        'parent/children/',
        ParentChildrenView.as_view(),
        name='parent-children'
    ),

    path(
        'parent/assessments/',
        ParentAssessmentView.as_view(),
        name='parent-assessments'
    ),

    path(
        'parent/questionnaire-answers/',
        ParentQuestionnaireAnswerView.as_view(),
        name='parent-questionnaire-answers'
    ),

    path(
        'parent/eye-tracking/',
        ParentEyeTrackingView.as_view(),
        name='parent-eye-tracking'
    ),

    path(
        'screening/sync/',
        ScreeningSyncView.as_view(),
        name='screening-sync'
    ),
]