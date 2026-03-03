from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import CompletedExercise
import json


@login_required
@require_POST
@csrf_exempt
def mark_exercise_completed(request):
    """Marquer un exercice comme complété"""
    try:
        data = json.loads(request.body)
        exercise_id = data.get('exercise_id')
        exercise_name = data.get('exercise_name')
        workout_day = data.get('workout_day')
        exercise_data = data.get('exercise_data', {})

        # Vérifier si l'exercice existe déjà pour aujourd'hui
        existing = CompletedExercise.objects.filter(
            user=request.user,
            exercise_id=exercise_id,
            workout_date=timezone.now().date()
        ).first()

        if existing:
            # Si existe mais inactif, le réactiver
            if not existing.is_active:
                existing.is_active = True
                existing.exercise_data = exercise_data
                existing.save()
                created = False
            else:
                # Déjà actif, pas de changement
                created = False
        else:
            # Créer un nouvel enregistrement
            completed_exercise = CompletedExercise.objects.create(
                user=request.user,
                exercise_id=exercise_id,
                exercise_name=exercise_name,
                exercise_data=exercise_data,
                workout_day=workout_day,
                workout_date=timezone.now().date(),
                is_active=True
            )
            created = True

        return JsonResponse({
            'success': True,
            'created': created,
            'exercise_id': exercise_id,
            'message': 'Exercise marked as completed'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
@require_POST
@csrf_exempt
def unmark_exercise_completed(request):
    """Supprimer un exercice complété"""
    try:
        data = json.loads(request.body)
        exercise_id = data.get('exercise_id')

        # Trouver et marquer comme inactif
        completed_exercises = CompletedExercise.objects.filter(
            user=request.user,
            exercise_id=exercise_id,
            workout_date=timezone.now().date(),
            is_active=True
        )

        count = 0
        for exercise in completed_exercises:
            exercise.mark_inactive()
            count += 1

        return JsonResponse({
            'success': True,
            'exercise_id': exercise_id,
            'count': count,
            'message': 'Exercise unmarked'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
def get_completed_exercises(request):
    """Récupérer tous les exercices complétés pour aujourd'hui"""
    try:
        completed_exercises = CompletedExercise.objects.filter(
            user=request.user,
            workout_date=timezone.now().date(),
            is_active=True
        ).values('exercise_id', 'exercise_name', 'workout_day', 'completed_at')

        return JsonResponse({
            'success': True,
            'completed_exercises': list(completed_exercises),
            'count': completed_exercises.count()
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
def get_user_stats(request):
    """Récupérer les statistiques de l'utilisateur"""
    try:
        # Exercices complétés aujourd'hui
        today_count = CompletedExercise.objects.filter(
            user=request.user,
            workout_date=timezone.now().date(),
            is_active=True
        ).count()

        # Total des exercices complétés (tous les temps)
        total_count = CompletedExercise.objects.filter(
            user=request.user,
            is_active=True
        ).count()

        # Jours consécutifs
        from datetime import timedelta
        consecutive_days = 0
        current_date = timezone.now().date()

        while True:
            has_exercise = CompletedExercise.objects.filter(
                user=request.user,
                workout_date=current_date,
                is_active=True
            ).exists()

            if has_exercise:
                consecutive_days += 1
                current_date -= timedelta(days=1)
            else:
                break

        return JsonResponse({
            'success': True,
            'stats': {
                'today_completed': today_count,
                'total_completed': total_count,
                'consecutive_days': consecutive_days,
                'last_updated': timezone.now().isoformat()
            }
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)