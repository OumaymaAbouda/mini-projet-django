from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from .models import WorkoutPlan, ExerciseLog
from .utils import generate_workout_plan
from accounts.models import Profile
from datetime import date
import json


@login_required
def workout_plan(request):
    try:
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        # Si le profil n'existe pas, rediriger vers la création de profil
        from django.contrib import messages
        from django.shortcuts import redirect
        messages.warning(request, "Please complete your profile first.")
        return redirect('profile')
    
    goal = profile.goal  # 'lose', 'maintain', 'gain'

    plan = generate_workout_plan(goal)

    # Sauvegarde dans la DB (comme au début)
    WorkoutPlan.objects.create(user=request.user, plan_json=plan)

    # Calculer les totaux pour affichage dans Weekly Statistics
    total_exercises = sum(len(day['exercises']) for day in plan)
    total_minutes = sum(day['total_time'] for day in plan)

    return render(request, 'workouts/workout_plan.html', {
        'plan': plan, 
        'goal': goal,
        'total_exercises': total_exercises,
        'total_minutes': total_minutes,
    })


@login_required
@require_POST
def log_exercise(request):
    """
    Enregistre un exercice comme complété dans ExerciseLog lorsque
    l'utilisateur clique sur "Mark Done" dans le plan de workout.
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)

    title = (payload.get("name") or "").strip()
    
    try:
        time_minutes = int(payload.get("time_minutes") or 0)
    except (ValueError, TypeError):
        time_minutes = 0
    
    try:
        sets = int(payload.get("sets") or 0)
    except (ValueError, TypeError):
        sets = 0
    
    try:
        reps = int(payload.get("reps") or 0)
    except (ValueError, TypeError):
        reps = 0
    
    try:
        rest_seconds = int(payload.get("rest_seconds") or 0)
    except (ValueError, TypeError):
        rest_seconds = 0
    
    category = (payload.get("category") or "").strip()
    day = (payload.get("day") or "").strip()

    if not title:
        return JsonResponse({"status": "error", "message": "Missing exercise name"}, status=400)


    # Estimation simple des calories : 5 kcal par minute
    calories = max(0, time_minutes * 5)
    
    # Construire la description avec tous les détails
    description_parts = ["Exercice complété depuis le workout plan"]
    if day:
        description_parts.append(f"Jour: {day}")
    if sets > 0:
        description_parts.append(f"Sets: {sets}")
    if reps > 0:
        description_parts.append(f"Reps: {reps}")
    if rest_seconds > 0:
        description_parts.append(f"Repos: {rest_seconds}s")
    if category:
        description_parts.append(f"Catégorie: {category}")
    
    description = " | ".join(description_parts)

    try:
        exercise_log = ExerciseLog.objects.create(
            user=request.user,
            workout_type="other",
            title=title,
            description=description,
            calories_burned=calories,
            date=date.today(),
        )
        
        # Mettre à jour le streak après chaque exercice complété
        from accounts.models import Profile
        try:
            profile = Profile.objects.get(user=request.user)
            # Extraire le numéro du jour du plan depuis le champ "day"
            day_number = 0
            if day:
                try:
                    day_number_str = day.replace("Day", "").replace("day", "").strip()
                    if day_number_str.isdigit():
                        day_number = int(day_number_str)
                except (ValueError, AttributeError):
                    pass
            
            # Si on a un numéro de jour valide, vérifier si ce jour du plan est complété
            if day_number > 0:
                # Compter les exercices pour aujourd'hui qui appartiennent à ce jour du plan
                # On vérifie la description pour identifier les exercices du même jour
                today_exercises = ExerciseLog.objects.filter(
                    user=request.user,
                    date=date.today(),
                    description__contains=f"Jour: {day}"
                ).count()
                
                # Si 6 exercices sont complétés pour ce jour du plan, mettre à jour le streak
                if today_exercises >= 6:
                    # Calculer le streak basé sur les jours du plan complétés
                    max_completed_day = 0
                    for check_day_num in range(1, 6):
                        check_day = f"Day {check_day_num}"
                        check_day_exercises = ExerciseLog.objects.filter(
                            user=request.user,
                            date=date.today(),
                            description__contains=f"Jour: {check_day}"
                        ).count()
                        
                        if check_day_exercises >= 6:
                            max_completed_day = check_day_num
                        else:
                            # Si un jour n'est pas complété, on s'arrête (streak consécutif)
                            break
                    
                    # Sauvegarder le streak seulement s'il est supérieur à celui actuel
                    if max_completed_day > (profile.workout_day_streak or 0):
                        profile.workout_day_streak = max_completed_day
                        profile.save()
        except Profile.DoesNotExist:
            pass
        
        return JsonResponse(
            {
                "status": "ok",
                "title": title,
                "time_minutes": time_minutes,
                "sets": sets,
                "reps": reps,
                "calories_burned": calories,
                "message": f"Exercice '{title}' enregistré avec succès dans ExerciseLog",
                "exercise_log_id": exercise_log.id,
            }
        )
    except Exception as e:
        return JsonResponse(
            {"status": "error", "message": f"Error saving exercise: {str(e)}"},
            status=500
        )


@login_required
@require_POST
def unlog_exercise(request):
    """
    Supprime un exercice de ExerciseLog lorsque l'utilisateur clique sur "unmark"
    pour le démarquer comme complété.
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)

    title = (payload.get("name") or "").strip()

    if not title:
        return JsonResponse({"status": "error", "message": "Missing exercise name"}, status=400)

    try:
        # Supprimer le dernier exercice avec ce titre pour l'utilisateur et aujourd'hui
        # On supprime le plus récent car c'est celui qui vient d'être créé
        exercise_to_delete = ExerciseLog.objects.filter(
            user=request.user,
            title=title,
            date=date.today()
        ).order_by('-created_at').first()
        
        if exercise_to_delete:
            # Récupérer le jour du plan avant suppression pour mettre à jour le streak
            day = ""
            if exercise_to_delete.description:
                import re
                day_match = re.search(r'Jour: (Day \d+)', exercise_to_delete.description)
                if day_match:
                    day = day_match.group(1)
            
            exercise_to_delete.delete()
            
            # Mettre à jour le streak après suppression
            from accounts.models import Profile
            try:
                profile = Profile.objects.get(user=request.user)
                # Calculer le streak basé sur les jours du plan complétés
                max_completed_day = 0
                for check_day_num in range(1, 6):
                    check_day = f"Day {check_day_num}"
                    check_day_exercises = ExerciseLog.objects.filter(
                        user=request.user,
                        date=date.today(),
                        description__contains=f"Jour: {check_day}"
                    ).count()
                    
                    if check_day_exercises >= 6:
                        max_completed_day = check_day_num
                    else:
                        # Si un jour n'est pas complété, on s'arrête (streak consécutif)
                        break
                
                # Mettre à jour le streak
                profile.workout_day_streak = max_completed_day
                profile.save()
            except Profile.DoesNotExist:
                pass
            
            return JsonResponse(
                {
                    "status": "ok",
                    "title": title,
                    "message": f"Exercice '{title}' supprimé de ExerciseLog",
                }
            )
        else:
            # Si aucun exercice trouvé, retourner ok quand même (peut-être déjà supprimé)
            return JsonResponse(
                {
                    "status": "ok",
                    "title": title,
                    "message": f"Aucun exercice '{title}' trouvé à supprimer",
                }
            )
    except Exception as e:
        return JsonResponse(
            {"status": "error", "message": f"Error deleting exercise: {str(e)}"},
            status=500
        )


@login_required
@require_POST
def reset_all_exercises(request):
    """
    Supprime tous les exercices de ExerciseLog pour l'utilisateur connecté.
    Utilisé quand l'utilisateur clique sur "Reset" dans le workout plan.
    """
    try:
        # Supprimer tous les exercices de l'utilisateur
        deleted_count = ExerciseLog.objects.filter(user=request.user).count()
        ExerciseLog.objects.filter(user=request.user).delete()
        
        return JsonResponse(
            {
                "status": "ok",
                "message": f"Tous les exercices ont été supprimés ({deleted_count} exercice(s))",
                "deleted_count": deleted_count,
            }
        )
    except Exception as e:
        return JsonResponse(
            {"status": "error", "message": f"Error deleting all exercises: {str(e)}"},
            status=500
        )


@login_required
@require_POST
def regenerate_workout_plan(request):
    """
    Génère un nouveau plan de workout et retourne les données en JSON.
    Utilisé quand l'utilisateur clique sur "Regenerate Plan".
    """
    try:
        try:
            profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            return JsonResponse(
                {"status": "error", "message": "Please complete your profile first."},
                status=400
            )
        goal = profile.goal  # 'lose', 'maintain', 'gain'

        # Générer un nouveau plan
        plan = generate_workout_plan(goal)

        # Sauvegarder dans la DB
        WorkoutPlan.objects.create(user=request.user, plan_json=plan)

        # Calculer le total d'exercices
        total_exercises = sum(len(day['exercises']) for day in plan)
        total_minutes = sum(day['total_time'] for day in plan)

        return JsonResponse(
            {
                "status": "ok",
                "plan": plan,
                "goal": goal,
                "total_exercises": total_exercises,
                "total_minutes": total_minutes,
                "message": "Nouveau plan généré avec succès",
            }
        )
    except Exception as e:
        return JsonResponse(
            {"status": "error", "message": f"Error generating new plan: {str(e)}"},
            status=500
        )
