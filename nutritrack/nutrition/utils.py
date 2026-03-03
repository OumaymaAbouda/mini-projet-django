import random
from .meals_data import MEALS
from django.utils import timezone
from .models import MealPlan, MealItem


def generate_daily_meals(goal, bmi):
    """Generate random meals for one day"""
    breakfast = random.choice(MEALS["breakfast"][goal])
    lunch = random.choice(MEALS["lunch"][goal])
    dinner = random.choice(MEALS["dinner"][goal])

    total = breakfast["cal"] + lunch["cal"] + dinner["cal"]
    return total, breakfast, lunch, dinner


def generate_meal_plan(user, profile, date=None):
    """Generate a 7-day meal plan and save to database"""
    if date is None:
        date = timezone.now().date()

    # Calculer les calories totales
    total_calories = profile.calculate_daily_calories()
    bmi = profile.calculate_bmi()

    # Créer le plan de repas principal
    meal_plan = MealPlan.objects.create(
        user=user,
        goal=profile.goal,
        bmi=bmi,
        total_calories=total_calories,
        created_at=date,
        plan_json={}
    )

    # Structure JSON pour le plan
    plan_json = {
        "user": user.username,
        "goal": profile.goal,
        "bmi": bmi,
        "total_calories": total_calories,
        "created_at": date.strftime("%Y-%m-%d"),
        "days": {}
    }

    # Créer les repas pour 7 jours
    for day in range(1, 8):
        day_data = {}

        # Générer les repas du jour
        for meal_type in ['breakfast', 'lunch', 'dinner']:
            meal = random.choice(MEALS[meal_type][profile.goal])

            # Créer l'entrée dans la base de données
            MealItem.objects.create(
                plan=meal_plan,
                meal_type=meal_type,
                name=meal['name'],
                calories=meal['cal'],
                day=day
            )

            # Ajouter aux données JSON
            day_data[meal_type] = {
                "name": meal['name'],
                "calories": meal['cal'],
                "protein": meal.get('protein', 0),
                "carbs": meal.get('carbs', 0),
                "fat": meal.get('fat', 0)
            }

        plan_json["days"][f"day_{day}"] = day_data

    # Mettre à jour le plan_json
    meal_plan.plan_json = plan_json
    meal_plan.save()

    return meal_plan