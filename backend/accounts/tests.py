from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from accounts.models import Child, AssessmentSession, EyeTrackingData, Questionnaire, QuestionnaireAnswer
from accounts.ai_service import build_system_prompt, query_ollie_ai

User = get_user_model()

class LexiSenseModelAndAccuracyTestCase(TestCase):
    """
    Automated Unit Test Suite for LexiSense Database Models,
    User Roles, and AI System Knowledge Logic.
    """

    def setUp(self):
        # Create test parent user
        self.parent_user = User.objects.create_user(
            username='parent1',
            email='parent1@example.com',
            password='Password123!',
            role='parent'
        )

        # Create test child
        self.child = Child.objects.create(
            parent=self.parent_user,
            name='Ahmad Test',
            age=9,
            class_name='Year 4'
        )

    def test_user_creation_and_role(self):
        """Verify user creation and role assignments"""
        self.assertEqual(self.parent_user.role, 'parent')
        self.assertTrue(self.parent_user.is_approved)
        self.assertEqual(str(self.parent_user), 'parent1 (parent)')

    def test_child_profile_linking(self):
        """Verify child profile link to parent"""
        self.assertEqual(self.child.parent, self.parent_user)
        self.assertEqual(self.child.age, 9)
        self.assertEqual(str(self.child), 'Ahmad Test')

    def test_assessment_session_creation(self):
        """Verify creation of assessment session for multimodal screening"""
        session = AssessmentSession.objects.create(
            child=self.child,
            type='questionnaire'
        )
        self.assertEqual(session.child, self.child)
        self.assertEqual(session.type, 'questionnaire')
        self.assertIn('Ahmad Test', str(session))

    def test_ollie_ai_prompt_builder(self):
        """Verify Ollie AI prompt builder incorporates child context and role"""
        user_context = {
            'username': 'parent1',
            'children': [{'name': 'Ahmad Test', 'age': 9, 'class_name': 'Year 4'}]
        }
        prompt = build_system_prompt(user_role='parent', user_context=user_context)
        self.assertIn('Ahmad Test', prompt)
        self.assertIn('CURRENT USER CONTEXT', prompt)
        self.assertIn('PARENT', prompt)

    def test_ollie_ai_fallback_response(self):
        """Verify local Ollie AI fallback response provides helpful information"""
        res = query_ollie_ai("What is LexiSense?", user_role="guest")
        self.assertIn('reply', res)
        self.assertTrue(len(res['reply']) > 20)
