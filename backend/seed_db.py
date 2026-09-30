import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User, Child, AssessmentSession, EyeTrackingData, Questionnaire, QuestionnaireAnswer

def seed_database():
    print("Seeding LexiSense SQLite Database...")

    # 1. Create Parent User (Sarah Jenkins)
    user, created = User.objects.get_or_create(
        username='sarah_jenkins',
        defaults={
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'email': 'sarah.jenkins@example.com',
            'role': 'parent'
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print("Created parent user: sarah_jenkins")
    else:
        print("Parent user sarah_jenkins already exists.")

    # 2. Create Children
    aisyah, _ = Child.objects.get_or_create(
        parent=user,
        name='Aisyah Jenkins',
        defaults={'age': 10, 'class_name': 'Year 4'}
    )
    adam, _ = Child.objects.get_or_create(
        parent=user,
        name='Adam Jenkins',
        defaults={'age': 7, 'class_name': 'Year 1'}
    )
    print(f"Verified Children: {aisyah.name} and {adam.name}")

    # 3. Create Sample Assessment Sessions
    session_aisyah_latest, _ = AssessmentSession.objects.get_or_create(
        child=aisyah,
        type='eye_tracking'
    )

    session_aisyah_q, _ = AssessmentSession.objects.get_or_create(
        child=aisyah,
        type='questionnaire'
    )

    # 4. Create Questionnaire Items
    q1, _ = Questionnaire.objects.get_or_create(
        question="How often does your child confuse visually similar letters ('b' vs 'd')?",
        options=["Frequently", "Occasionally", "Rarely"]
    )

    QuestionnaireAnswer.objects.get_or_create(
        session=session_aisyah_q,
        question=q1,
        defaults={'answer': 'Frequently'}
    )

    # 5. Create Sample Eye Tracking Data
    EyeTrackingData.objects.get_or_create(
        session=session_aisyah_latest,
        timestamp=0.1,
        defaults={'gaze_x': 120.5, 'gaze_y': 240.0, 'pupil_diameter': 3.4}
    )

    print("Database seeding completed successfully! sqlite db is ready at C:\\Users\\User\\LexiSense\\backend\\db.sqlite3")

if __name__ == '__main__':
    seed_database()
