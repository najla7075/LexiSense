from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsSuperAdmin, IsParent

from .models import (
    Child,
    AssessmentSession,
    QuestionnaireAnswer,
    EyeTrackingData,
)

from .serializers import (
    UserSerializer,
    UserRegisterSerializer,
    ChildSerializer,
    AssessmentSessionSerializer,
    QuestionnaireAnswerSerializer,
    EyeTrackingDataSerializer,
)

from .ai_service import query_ollie_ai

# Global in-memory cache for fast screening sync demo
SCREENING_RESULTS_CACHE = {}


class AIChatbotView(APIView):
    """
    Secure AI Chatbot Endpoint for Ollie the Wise Owl.
    Processes user questions with role-aware context and domain knowledge.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get('message') or request.data.get('query') or request.data.get('prompt')
        if not message:
            return Response({"error": "Message parameter is required."}, status=400)

        history = request.data.get('history', [])
        user_role = "guest"
        user_context = {}

        if request.user and request.user.is_authenticated:
            user_role = getattr(request.user, 'role', 'parent')
            user_context['username'] = request.user.username
            user_context['role'] = user_role

            if user_role == 'parent':
                children = Child.objects.filter(parent=request.user)
                children_data = []
                for child in children:
                    latest_session = AssessmentSession.objects.filter(child=child).order_by('-date').first()
                    child_info = {
                        "name": child.name,
                        "age": child.age,
                        "class_name": child.class_name
                    }
                    if latest_session:
                        child_info["latest_screening"] = f"{latest_session.type} on {latest_session.date.strftime('%Y-%m-%d')}"
                    children_data.append(child_info)
                user_context['children'] = children_data
        else:
            # Check if role hint was passed from frontend state
            user_role = request.data.get('role', 'guest')

        result = query_ollie_ai(
            message=message,
            user_role=user_role,
            user_context=user_context,
            conversation_history=history
        )

        return Response(result, status=200)


class ParentRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            if not user.is_approved:
                return Response({
                    "status": "pending_approval",
                    "is_approved": False,
                    "message": f"Account Created ⏳: Your {user.role.title()} account is pending Super Admin approval. You cannot log in until approved.",
                    "user": UserSerializer(user).data
                }, status=202)

            refresh = RefreshToken.for_user(user)
            return Response({
                "status": "success",
                "is_approved": True,
                "message": f"{user.role.title()} account registered successfully! 👧",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=201)
        return Response(serializer.errors, status=400)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class SuperAdminTestView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        return Response({
            "message": "Super Admin access granted",
            "username": request.user.username,
            "role": request.user.role,
        })


class ParentChildrenView(APIView):
    permission_classes = [IsAuthenticated, IsParent]

    def get(self, request):
        children = Child.objects.filter(parent=request.user)
        serializer = ChildSerializer(children, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ChildSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(parent=request.user)
            return Response(serializer.data, status=201)

        return Response(serializer.errors, status=400)


class ParentAssessmentView(APIView):
    permission_classes = [IsAuthenticated, IsParent]

    def get(self, request):
        sessions = AssessmentSession.objects.filter(
            child__parent=request.user
        ).order_by('-date')

        serializer = AssessmentSessionSerializer(
            sessions,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        child_id = request.data.get('child')

        try:
            child = Child.objects.get(
                id=child_id,
                parent=request.user
            )
        except Child.DoesNotExist:
            return Response(
                {"error": "Child not found."},
                status=404
            )

        assessment_type = request.data.get('type')

        if assessment_type not in ['eye_tracking', 'questionnaire']:
            return Response(
                {"error": "Invalid assessment type."},
                status=400
            )

        session = AssessmentSession.objects.create(
            child=child,
            type=assessment_type
        )

        serializer = AssessmentSessionSerializer(session)

        return Response(serializer.data, status=201)


class ParentQuestionnaireAnswerView(APIView):
    permission_classes = [IsAuthenticated, IsParent]

    def get(self, request):
        answers = QuestionnaireAnswer.objects.filter(
            session__child__parent=request.user
        ).order_by('-id')

        serializer = QuestionnaireAnswerSerializer(
            answers,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        session_id = request.data.get('session')
        question_id = request.data.get('question')
        answer = request.data.get('answer')

        try:
            session = AssessmentSession.objects.get(
                id=session_id,
                child__parent=request.user,
                type='questionnaire'
            )
        except AssessmentSession.DoesNotExist:
            return Response(
                {"error": "Assessment session not found."},
                status=404
            )

        serializer = QuestionnaireAnswerSerializer(
            data={
                'session': session.id,
                'question': question_id,
                'answer': answer
            }
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=201
            )

        return Response(
            serializer.errors,
            status=400
        )


class ParentEyeTrackingView(APIView):
    permission_classes = [IsAuthenticated, IsParent]

    def get(self, request):
        data = EyeTrackingData.objects.filter(
            session__child__parent=request.user
        ).order_by('-id')

        serializer = EyeTrackingDataSerializer(
            data,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        session_id = request.data.get('session')

        try:
            session = AssessmentSession.objects.get(
                id=session_id,
                child__parent=request.user,
                type='eye_tracking'
            )
        except AssessmentSession.DoesNotExist:
            return Response(
                {"error": "Eye tracking session not found."},
                status=404
            )

        serializer = EyeTrackingDataSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save(session=session)
            return Response(
                serializer.data,
                status=201
            )

        return Response(
            serializer.errors,
            status=400
        )


class ScreeningSyncView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        child_id = request.query_params.get('child_id', 'aisyah')
        result = SCREENING_RESULTS_CACHE.get(child_id, {
            "status": "success",
            "child_id": child_id,
            "message": "No active screening stored for child."
        })
        return Response(result)

    def post(self, request):
        payload = request.data
        child_id = payload.get('childId', 'aisyah')
        SCREENING_RESULTS_CACHE[child_id] = payload
        return Response({
            "status": "success",
            "message": f"Screening result for {child_id} successfully synced with LexiSense Django backend!",
            "data": payload
        }, status=200)