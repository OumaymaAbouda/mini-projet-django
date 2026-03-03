from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.http import JsonResponse
from accounts.models import Profile
from .models import MealPlan, MealItem
from .utils import generate_meal_plan
import json


@login_required
def nutrition_plan(request):
    """Display nutrition plan"""
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        messages.warning(request, "Please complete your profile first.")
        return redirect('profile_edit')

    # Utiliser timezone.localdate() pour s'assurer que la date est dans le fuseau horaire du settings.py
    # ou simplement timezone.now().date() si settings.TIME_ZONE est configuré.
    today = timezone.localdate()  # Ou timezone.now().date()

    # Vérifier si un plan existe pour aujourd'hui
    # Il est plus logique qu'un MealPlan soit lié à une date spécifique pour éviter les doublons quotidiens.
    meal_plan = MealPlan.objects.filter(
        user=request.user,
        created_at=today
    ).first()

    # Si aucun plan pour aujourd'hui, en créer un
    if not meal_plan:
        meal_plan = generate_meal_plan(request.user, profile, today)
        messages.success(request, "New meal plan generated!")
    else:
        # Optionnel: Si vous voulez toujours un message, même si le plan existait.
        # messages.info(request, "Your current meal plan for today is displayed.")
        pass

    # Calculer les calories quotidiennes
    daily_calories = profile.calculate_daily_calories()
    breakfast_cal = int(daily_calories * 0.30)
    lunch_cal = int(daily_calories * 0.40)
    dinner_cal = int(daily_calories * 0.30)

    # Noms des jours en anglais (index 0=Lundi, 6=Dimanche)
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    # isoweekday() retourne 1 pour Lundi, 2 pour Mardi, ..., 7 pour Dimanche
    today_day_number = today.isoweekday()

    # weekday() retourne 0 pour Lundi, 1 pour Mardi, ..., 6 pour Dimanche
    today_day_name = day_names[today.weekday()]

    week_plan = []

    for day_num in range(1, 8):
        # Vérifier si ce jour de la boucle est le jour actuel
        is_today_flag = (day_num == today_day_number)

        day_data = {
            'day_number': day_num,
            'day_name': day_names[day_num - 1],  # -1 car la liste day_names commence à 0
            'is_today': is_today_flag,  # Booléen True/False pour le template
            'breakfast': ('Not planned', 0, 0, 0, 0),
            'lunch': ('Not planned', 0, 0, 0, 0),
            'dinner': ('Not planned', 0, 0, 0, 0),
            'total_calories': 0,  # Initialisation pour le calcul
        }

        # Récupérer les repas pour le jour actuel du plan
        # Il faut que votre modèle MealItem ait une colonne 'day' pour identifier le jour de la semaine (1-7)
        # et une colonne 'meal_type' ('breakfast', 'lunch', 'dinner')
        for meal_type_key in ['breakfast', 'lunch', 'dinner']:
            meal_item = MealItem.objects.filter(
                plan=meal_plan,
                day=day_num,  # Filtre par le numéro du jour de la semaine
                meal_type=meal_type_key
            ).first()

            if meal_item:
                day_data[meal_type_key] = (
                    meal_item.name,
                    meal_item.calories,
                    getattr(meal_item, 'protein', 0),  # Assurez-vous que ces attributs existent ou gerez l'erreur
                    getattr(meal_item, 'carbs', 0),
                    getattr(meal_item, 'fat', 0)
                )

        # Calculer les calories totales pour la journée
        total_calories_for_day = (
                day_data['breakfast'][1] +
                day_data['lunch'][1] +
                day_data['dinner'][1]
        )
        day_data['total_calories'] = total_calories_for_day

        week_plan.append(day_data)

    # DEBUG : Afficher les informations de débogage dans la console du serveur
    print(f"\n=== DEBUG NUTRITION PLAN ===")
    print(f"Today (date): {today}")
    print(f"Today day number (ISO): {today_day_number}")  # 1=Lundi, 7=Dimanche
    print(f"Today day name: {today_day_name}")
    print(f"Week plan length: {len(week_plan)}")
    for i, day in enumerate(week_plan):
        print(
            f"  Day {day['day_number']}: {day['day_name']} - Is Today: {day['is_today']} - Total Calories: {day['total_calories']} kcal")
        print(f"    Breakfast: {day['breakfast']}")
        print(f"    Lunch: {day['lunch']}")
        print(f"    Dinner: {day['dinner']}")
    print(f"============================\n")

    context = {
        'meal_plan': meal_plan,
        'week_plan': week_plan,
        'goal': profile.goal,
        'bmi': profile.calculate_bmi(),
        'daily_calories': daily_calories,
        'breakfast_cal': breakfast_cal,
        'lunch_cal': lunch_cal,
        'dinner_cal': dinner_cal,
        'profile': profile,
        'today_day_number': today_day_number,  # Passé au template pour le JS
        'today_day_name': today_day_name,  # Passé au template pour l'affichage
    }

    return render(request, 'nutrition/nutrition_plan.html', context)


@login_required
def generate_plan(request):
    """Generate a new meal plan"""
    try:
        profile = request.user.profile
        today = timezone.localdate()  # Utiliser la date locale

        # Supprimer l'ancien plan du jour pour s'assurer un nouveau plan unique
        # Considérez de ne supprimer que le plan de *aujourd'hui* si vous voulez garder les plans passés.
        MealPlan.objects.filter(user=request.user, created_at=today).delete()

        # Générer un nouveau plan
        generate_meal_plan(request.user, profile, today)

        messages.success(request, "✅ New meal plan generated successfully!")

    except Profile.DoesNotExist:
        messages.error(request, "Please complete your profile first.")
    except Exception as e:
        messages.error(request, f"Error generating plan: {str(e)}")

    return redirect('nutrition:nutrition_plan')


@login_required
def download_json(request):
    """Download meal plan as JSON"""
    try:
        # Récupère le plan le plus récent de l'utilisateur
        meal_plan = MealPlan.objects.filter(user=request.user).order_by('-created_at').first()

        if not meal_plan:
            return JsonResponse({'error': 'No meal plan found'}, status=404)

        # Votre champ 'plan_json' devrait déjà contenir la structure JSON complète du plan
        # Assurez-vous que generate_meal_plan stocke le plan dans ce champ.
        if not meal_plan.plan_json:
            return JsonResponse({'error': 'Meal plan JSON content is empty'}, status=404)

        response = JsonResponse(meal_plan.plan_json, json_dumps_params={'indent': 2})
        response[
            'Content-Disposition'] = f'attachment; filename="meal_plan_{request.user.username}_{meal_plan.created_at}.json"'

        return response

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)