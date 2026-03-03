import requests
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from datetime import timedelta, date, datetime
from .models import Meal, Ingredient
from .forms import MealForm
from django.utils import timezone
import random
import json


# -------------------------
# Utility functions
# -------------------------

# Liste d'ingrédients valides pour validation
VALID_INGREDIENTS = [
    # Fruits
    'apple', 'banana', 'orange', 'strawberry', 'blueberry', 'grape', 'watermelon', 'pineapple', 
    'mango', 'kiwi', 'peach', 'pear', 'cherry', 'plum', 'apricot', 'avocado', 'lemon', 'lime',
    
    # Légumes
    'carrot', 'broccoli', 'spinach', 'lettuce', 'tomato', 'cucumber', 'bell pepper', 'onion',
    'garlic', 'potato', 'sweet potato', 'zucchini', 'eggplant', 'cauliflower', 'cabbage',
    'celery', 'mushroom', 'corn', 'peas', 'green beans', 'asparagus',
    
    # Viandes et protéines
    'chicken', 'chicken breast', 'beef', 'pork', 'turkey', 'lamb', 'duck', 'ham',
    'salmon', 'tuna', 'cod', 'shrimp', 'crab', 'lobster', 'fish', 'sardine', 'mackerel',
    'egg', 'egg white', 'egg yolk',
    
    # Produits laitiers
    'milk', 'cheese', 'yogurt', 'greek yogurt', 'cottage cheese', 'butter', 'cream',
    'sour cream', 'mozzarella', 'cheddar', 'parmesan', 'feta',
    
    # Céréales et grains
    'rice', 'brown rice', 'quinoa', 'oatmeal', 'oats', 'wheat', 'bread', 'whole wheat bread',
    'pasta', 'spaghetti', 'noodles', 'couscous', 'barley', 'buckwheat',
    
    # Noix et graines
    'almond', 'walnut', 'peanut', 'cashew', 'pistachio', 'hazelnut', 'pecan',
    'chia seeds', 'flax seeds', 'sunflower seeds', 'pumpkin seeds', 'sesame seeds',
    
    # Légumineuses
    'chickpea', 'lentil', 'black bean', 'kidney bean', 'pinto bean', 'white bean',
    'soybean', 'tofu', 'tempeh', 'edamame',
    
    # Huiles et graisses
    'olive oil', 'coconut oil', 'vegetable oil', 'canola oil', 'avocado oil', 'butter',
    
    # Autres
    'honey', 'maple syrup', 'sugar', 'salt', 'pepper', 'basil', 'oregano', 'thyme',
    'chocolate', 'dark chocolate', 'peanut butter', 'almond butter', 'jam',
    'bacon', 'sausage', 'hot dog', 'burger', 'pizza',
    
    # Boissons (utile pour tracking)
    'water', 'coffee', 'tea', 'green tea', 'orange juice', 'apple juice',
    
    # Produits transformés courants
    'cereal', 'granola', 'crackers', 'pretzel', 'popcorn',
]

def is_valid_ingredient(ingredient_name):
    """
    Valide si un ingrédient est dans la liste des ingrédients valides.
    Accepte des variations (pluriels, espaces, etc.)
    """
    if not ingredient_name:
        return False
    
    ingredient_lower = ingredient_name.strip().lower()
    
    # Vérifier si exactement dans la liste
    if ingredient_lower in VALID_INGREDIENTS:
        return True
    
    # Vérifier si contient un mot-clé valide (pour pluriels, etc.)
    words = ingredient_lower.split()
    for word in words:
        # Vérifier si un mot correspond à un ingrédient valide
        for valid_ingredient in VALID_INGREDIENTS:
            if word in valid_ingredient or valid_ingredient in word:
                # Vérifier que ce n'est pas juste des lettres aléatoires
                if len(word) >= 3:  # Au moins 3 caractères
                    return True
    
    # Vérifier les correspondances partielles pour les composés (ex: "chicken breast")
    for valid_ingredient in VALID_INGREDIENTS:
        if valid_ingredient in ingredient_lower or ingredient_lower in valid_ingredient:
            return True
    
    return False

def get_nutrition_data(ingredient_name):
    """
    Retrieve nutrition data from OpenFoodFacts.
    Returns (calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source)
    Amélioré avec meilleure gestion des erreurs et fallback intelligent.
    """
    # Valeurs par défaut raisonnables basées sur le type d'ingrédient
    default_calories = 100.0
    default_protein = 3.0
    default_carbs = 15.0
    default_fat = 1.0
    
    # Ajuster les valeurs par défaut selon le type d'ingrédient
    ingredient_lower = ingredient_name.lower()
    if any(word in ingredient_lower for word in ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey']):
        default_calories = 165.0
        default_protein = 25.0
        default_carbs = 0.0
        default_fat = 7.0
    elif any(word in ingredient_lower for word in ['egg', 'cheese', 'yogurt', 'milk']):
        default_calories = 155.0
        default_protein = 13.0
        default_carbs = 5.0
        default_fat = 10.0
    elif any(word in ingredient_lower for word in ['rice', 'pasta', 'bread', 'oat', 'quinoa']):
        default_calories = 130.0
        default_protein = 3.0
        default_carbs = 28.0
        default_fat = 0.5
    elif any(word in ingredient_lower for word in ['fruit', 'apple', 'banana', 'orange', 'berry']):
        default_calories = 52.0
        default_protein = 0.3
        default_carbs = 14.0
        default_fat = 0.2
    elif any(word in ingredient_lower for word in ['vegetable', 'carrot', 'broccoli', 'spinach', 'lettuce']):
        default_calories = 25.0
        default_protein = 1.0
        default_carbs = 5.0
        default_fat = 0.2
    
    calories_per_100g = default_calories
    protein_per_100g = default_protein
    carbs_per_100g = default_carbs
    fat_per_100g = default_fat
    source = "Default value"

    try:
        url = "https://world.openfoodfacts.org/cgi/search.pl"
        params = {
            'search_terms': ingredient_name,
            'search_simple': 1,
            'action': 'process',
            'json': 1,
            'page_size': 10,  # Augmenter pour plus de résultats
        }
        response = requests.get(url, params=params, timeout=15)  # Timeout augmenté
        
        if response.status_code != 200:
            source = "Default value (API unavailable)"
            return calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source
        
        data = response.json()

        if data.get("products") and len(data["products"]) > 0:
            # Chercher un produit avec des données nutritionnelles complètes
            for product in data["products"]:
                nutriments = product.get("nutriments", {})
                energy_kcal = nutriments.get("energy-kcal_100g")
                
                # Vérifier que les données sont valides
                if energy_kcal is not None and float(energy_kcal) > 0:
                    calories_per_100g = float(energy_kcal)
                    protein_per_100g = float(nutriments.get("proteins_100g", default_protein))
                    carbs_per_100g = float(nutriments.get("carbohydrates_100g", default_carbs))
                    fat_per_100g = float(nutriments.get("fat_100g", default_fat))
                    
                    # S'assurer que les valeurs sont positives et raisonnables
                    if calories_per_100g < 0 or calories_per_100g > 900:
                        calories_per_100g = default_calories
                    if protein_per_100g < 0:
                        protein_per_100g = default_protein
                    if carbs_per_100g < 0:
                        carbs_per_100g = default_carbs
                    if fat_per_100g < 0:
                        fat_per_100g = default_fat
                    
                    source = "OpenFoodFacts"
                    break
        else:
            source = "Default value (product not found)"
    except requests.exceptions.Timeout:
        source = "Default value (API timeout)"
    except requests.exceptions.RequestException as e:
        source = "Default value (API error)"
    except (ValueError, KeyError, TypeError) as e:
        source = "Default value (data parsing error)"
    except Exception as e:
        source = "Default value (API error)"

    return calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source


def calculate_nutrition_for_quantity(calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, quantity):
    """Calculate nutritional values for a given quantity (grams)"""
    calories = round((calories_per_100g * quantity) / 100, 2)
    protein = round((protein_per_100g * quantity) / 100, 2)
    carbs = round((carbs_per_100g * quantity) / 100, 2)
    fat = round((fat_per_100g * quantity) / 100, 2)
    return calories, protein, carbs, fat


def calculate_meal_totals(meal):
    """Calculate totals for a meal from its ingredients"""
    ingredients = meal.ingredients.all()
    # S'assurer que les valeurs ne sont jamais négatives
    return {
        'calories': max(0, round(sum(max(0, i.calories or 0) for i in ingredients), 2)),
        'protein': max(0, round(sum(max(0, i.protein or 0) for i in ingredients), 2)),
        'carbs': max(0, round(sum(max(0, i.carbs or 0) for i in ingredients), 2)),
        'fat': max(0, round(sum(max(0, i.fat or 0) for i in ingredients), 2)),
    }


# -------------------------
# Views
# -------------------------
@login_required
def home(request):
    """Display the user's dashboard with stats and charts"""
    # Supprimer les repas vides
    empty_meals = Meal.objects.filter(user=request.user, ingredients__isnull=True)
    if empty_meals.exists():
        empty_meals.delete()
        messages.info(request, "Empty meals were automatically deleted.")

    # Récupérer les données utilisateur
    today = date.today()
    
    # Importer ExerciseLog
    try:
        from workouts.models import ExerciseLog
        has_workouts = True
    except ImportError:
        has_workouts = False
        ExerciseLog = None

    # Calories d'aujourd'hui (repas) - Calculer depuis les ingrédients réels
    today_meals = Meal.objects.filter(user=request.user, date=today)
    total_calories_today = 0
    for meal in today_meals:
        totals = calculate_meal_totals(meal)
        total_calories_today += totals['calories']
    total_meals_today = today_meals.count()

    # Workouts d'aujourd'hui - VALEURS RÉELLES depuis ExerciseLog
    today_workouts_count = 0
    today_calories_burned = 0
    if has_workouts:
        today_workouts = ExerciseLog.objects.filter(user=request.user, date=today)
        today_workouts_count = today_workouts.count()
        today_calories_burned = sum(w.calories_burned for w in today_workouts)

    # Calculer le streak basé sur les jours avec repas
    streak_days = 0
    current_day = today
    while True:
        day_has_meal = Meal.objects.filter(user=request.user, date=current_day).exists()
        if day_has_meal:
            streak_days += 1
            current_day -= timedelta(days=1)
        else:
            break

    # Calculer le "Day Streak" pour les workouts basé sur les jours du plan complétés
    # Le streak = le jour maximum du plan où 6 exercices sont complétés
    # Les exercices sont tous enregistrés avec date.today(), mais identifiés par "Jour: Day X" dans la description
    try:
        profile = request.user.profile
        saved_streak = profile.workout_day_streak or 0
    except:
        saved_streak = 0
    
    # Trouver le jour maximum du plan où 6 exercices sont complétés
    workout_day_streak = saved_streak  # Par défaut, utiliser le streak sauvegardé
    if has_workouts:
        max_completed_day = 0
        # Vérifier les jours du plan (Day 1, Day 2, ..., Day 5)
        # On cherche dans la description des exercices d'aujourd'hui
        for day_num in range(1, 6):  # Day 1 à Day 5
            check_day = f"Day {day_num}"
            # Compter les exercices pour ce jour du plan en cherchant dans la description
            day_exercises_count = ExerciseLog.objects.filter(
                user=request.user,
                date=today,
                description__contains=f"Jour: {check_day}"
            ).count()
            
            # Si 6 exercices sont complétés pour ce jour, c'est un jour complet
            if day_exercises_count >= 6:
                max_completed_day = day_num
            else:
                # Si un jour n'est pas complété, on s'arrête (streak consécutif)
                break
        
        # Utiliser le jour maximum complété comme streak
        if max_completed_day > saved_streak:
            workout_day_streak = max_completed_day
            # Sauvegarder le nouveau streak
            try:
                profile = request.user.profile
                profile.workout_day_streak = workout_day_streak
                profile.save()
            except:
                pass
        else:
            workout_day_streak = saved_streak

    # Données hebdomadaires (7 derniers jours)
    week_ago = today - timedelta(days=7)
    weekly_calories_data = {}
    weekly_workouts_data = {}  # nombre d'exercices par jour
    weekly_calories_burned_data = {}  # calories brûlées par jour

    # Mapping pour obtenir les noms de jours en anglais de manière cohérente
    day_names_en = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for i in range(7):
        day = today - timedelta(days=6 - i)  # Du plus ancien au plus récent
        # Utiliser l'index du jour de la semaine (0=lundi, 6=dimanche) pour mapper aux noms en anglais
        weekday_index = day.weekday()  # 0 = Monday, 6 = Sunday
        day_name = day_names_en[weekday_index]

        # Calories consommées du jour (repas) - Calculer depuis les ingrédients réels
        daily_meals = Meal.objects.filter(user=request.user, date=day)
        daily_calories = 0
        for meal in daily_meals:
            totals = calculate_meal_totals(meal)
            daily_calories += totals['calories']
        weekly_calories_data[day_name] = daily_calories

        # Exercices et calories brûlées du jour - VALEURS RÉELLES depuis ExerciseLog
        daily_workouts_count = 0
        daily_calories_burned = 0
        if has_workouts:
            daily_workouts = ExerciseLog.objects.filter(user=request.user, date=day)
            daily_workouts_count = daily_workouts.count()
            daily_calories_burned = sum(w.calories_burned for w in daily_workouts)
        
        weekly_workouts_data[day_name] = daily_workouts_count
        weekly_calories_burned_data[day_name] = daily_calories_burned

    # Nutrition balance (3 derniers jours)
    three_days_ago = today - timedelta(days=3)
    recent_ingredients = Ingredient.objects.filter(
        meal__user=request.user,
        meal__date__gte=three_days_ago
    )

    total_protein_g = sum(ing.protein or 0 for ing in recent_ingredients)
    total_carbs_g = sum(ing.carbs or 0 for ing in recent_ingredients)
    total_fat_g = sum(ing.fat or 0 for ing in recent_ingredients)

    # Convertir les grammes en calories pour calculer les pourcentages correctement
    # 1g protéine = 4 kcal, 1g glucides = 4 kcal, 1g graisse = 9 kcal
    protein_calories = total_protein_g * 4
    carbs_calories = total_carbs_g * 4
    fat_calories = total_fat_g * 9
    
    total_calories_from_macros = protein_calories + carbs_calories + fat_calories

    # Calculer les pourcentages basés sur les calories (méthode standard)
    if total_calories_from_macros > 0:
        protein_percent = (protein_calories / total_calories_from_macros) * 100
        carbs_percent = (carbs_calories / total_calories_from_macros) * 100
        fat_percent = (fat_calories / total_calories_from_macros) * 100
    else:
        protein_percent = carbs_percent = fat_percent = 0

    # Workouts complétés cette semaine - VALEURS RÉELLES
    workouts_completed = 0
    total_calories_burned_week = 0
    if has_workouts:
        workouts_completed = ExerciseLog.objects.filter(
            user=request.user,
            date__gte=week_ago
        ).count()
        total_calories_burned_week = sum(
            w.calories_burned for w in ExerciseLog.objects.filter(
                user=request.user,
                date__gte=week_ago
            )
        )
    else:
        workouts_completed = sum(weekly_workouts_data.values())
        total_calories_burned_week = sum(weekly_calories_burned_data.values())

    # Goal progress
    goal_progress = 0
    try:
        from nutrition.models import MealPlan
        meal_plans = MealPlan.objects.filter(user=request.user).order_by('-created_at')
        active_meal_plan = meal_plans.first() if meal_plans.exists() else None

        if active_meal_plan and active_meal_plan.total_calories > 0:
            avg_daily_calories = sum(weekly_calories_data.values()) / 7 if weekly_calories_data else 0
            goal_calories = active_meal_plan.total_calories

            if goal_calories > 0:
                if active_meal_plan.goal == 'lose':
                    if avg_daily_calories <= goal_calories:
                        goal_progress = 100
                    else:
                        normal_intake = goal_calories + 500
                        reduction_needed = normal_intake - goal_calories
                        actual_reduction = normal_intake - avg_daily_calories
                        goal_progress = min(100, max(0, (actual_reduction / reduction_needed) * 100))
                elif active_meal_plan.goal == 'gain':
                    if avg_daily_calories >= goal_calories:
                        goal_progress = 100
                    else:
                        normal_intake = goal_calories - 300
                        increase_needed = goal_calories - normal_intake
                        actual_increase = avg_daily_calories - normal_intake
                        goal_progress = min(100, max(0, (actual_increase / increase_needed) * 100))
                else:
                    calorie_difference = abs(avg_daily_calories - goal_calories)
                    if calorie_difference <= 100:
                        goal_progress = 100
                    else:
                        goal_progress = max(0, 100 - (calorie_difference / goal_calories * 100))
    except (ImportError, Exception):
        active_meal_plan = None

    # Weekly activity percentage
    activity_days = 0
    for day_name in weekly_calories_data:
        if weekly_calories_data[day_name] > 0 or weekly_workouts_data.get(day_name, 0) > 0:
            activity_days += 1

    weekly_activity_percent = int((activity_days / 7) * 100)

    # Préparer les données combinées pour le template
    weekly_data = {}
    week_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for day in week_days:
        weekly_data[day] = {
            'calories': weekly_calories_data.get(day, 0),
            'workouts': weekly_workouts_data.get(day, 0),
            'calories_burned': weekly_calories_burned_data.get(day, 0)
        }

    # Construire la liste des activités récentes (repas + workouts)
    recent_activities = []

    # 1) Derniers repas
    recent_meals = Meal.objects.filter(user=request.user).order_by('-date')[:5]
    for meal in recent_meals:
        # Créer un datetime aware pour être cohérent avec les workouts
        meal_datetime = datetime.combine(meal.date, datetime.min.time())
        if timezone.is_naive(meal_datetime):
            meal_datetime = timezone.make_aware(meal_datetime)
        
        recent_activities.append({
            'type': 'meal',
            'title': meal.name,
            'description': f"Meal logged with {int(meal.total_calories)} kcal",
            'time': meal.date.strftime('%Y-%m-%d'),
            'calories': int(meal.total_calories),
            'created_at': meal_datetime,
        })

    # 2) Derniers workouts (si le modèle existe)
    try:
        from workouts.models import ExerciseLog
        recent_workouts = ExerciseLog.objects.filter(user=request.user).order_by('-created_at')[:5]
        for w in recent_workouts:
            # S'assurer que le datetime est aware (Django les crée déjà aware normalement)
            workout_datetime = w.created_at
            if timezone.is_naive(workout_datetime):
                workout_datetime = timezone.make_aware(workout_datetime)
            
            recent_activities.append({
                'type': 'workout',
                'title': w.title,
                'description': w.description or dict(ExerciseLog.WORKOUT_TYPES).get(w.workout_type, 'Workout'),
                'time': w.created_at.strftime('%Y-%m-%d %H:%M'),
                'calories': int(w.calories_burned),
                'created_at': workout_datetime,
            })
    except (ImportError, Exception):
        pass

    # Trier toutes les activités par date de création décroissante et garder les 5 plus récentes
    # Tous les datetimes sont maintenant aware, donc la comparaison fonctionne
    recent_activities = sorted(recent_activities, key=lambda a: a['created_at'], reverse=True)[:5]

    # Nettoyer le champ interne 'created_at' pour le template
    for act in recent_activities:
        act.pop('created_at', None)

    # Préparer les données pour le graphique JS : liste ordonnée des calories par jour
    weekly_calories_list = [weekly_data[day]['calories'] for day in week_days]
    weekly_calories_json = json.dumps(weekly_calories_list)
    
    # Préparer les données de workouts et calories brûlées pour le graphique JS
    weekly_workouts_list = [weekly_data[day]['workouts'] for day in week_days]
    weekly_workouts_json = json.dumps(weekly_workouts_list)
    
    weekly_calories_burned_list = [weekly_data[day]['calories_burned'] for day in week_days]
    weekly_calories_burned_json = json.dumps(weekly_calories_burned_list)

    # Context
    # S'assurer que total_calories_today n'est jamais négatif
    total_calories_today = max(0, round(total_calories_today))
    
    context = {
        'meals': Meal.objects.filter(user=request.user).order_by('-date')[:10],
        'total_calories': total_calories_today,
        'total_calories_today': total_calories_today,  # Pour compatibilité
        'total_meals_today': total_meals_today,  # NOUVEAU: nombre de repas aujourd'hui
        'streak_days': streak_days,
        'workout_day_streak': workout_day_streak,  # NOUVEAU: jours de workout complets (6 exercices = 1 jour)
        'workouts_completed': workouts_completed,
        'today_workouts_count': today_workouts_count,  # NOUVEAU: exercices aujourd'hui
        'today_calories_burned': int(today_calories_burned),  # NOUVEAU: calories brûlées aujourd'hui
        'total_calories_burned_week': int(total_calories_burned_week),  # NOUVEAU: calories brûlées cette semaine
        'total_meals': Meal.objects.filter(user=request.user).count(),
        'weekly_calories_data': weekly_calories_json,
        'weekly_workouts_data': weekly_workouts_data,
        'weekly_workouts_json': weekly_workouts_json,  # Pour JavaScript
        'weekly_calories_burned_data': weekly_calories_burned_data,
        'weekly_calories_burned_json': weekly_calories_burned_json,  # Pour JavaScript
        'weekly_data': weekly_data,
        'protein_percent': round(protein_percent, 1),
        'carbs_percent': round(carbs_percent, 1),
        'fat_percent': round(fat_percent, 1),
        'goal_progress': round(goal_progress),
        'weekly_activity_percent': weekly_activity_percent,
        'active_meal_plan': active_meal_plan,
        'week_days': week_days,
        'recent_activities': recent_activities,
    }

    return render(request, 'meals/home.html', context)


# ---- LES AUTRES FONCTIONS RESTENT IDENTIQUES À VOTRE VERSION ---- #

@login_required
def my_meals(request):
    """Display meals in workout_plan style layout"""
    # Supprimer les repas vides
    empty_meals = Meal.objects.filter(user=request.user, ingredients__isnull=True)
    if empty_meals.exists():
        empty_meals.delete()
        messages.info(request, "Empty meals were automatically deleted.")

    # Récupérer tous les repas avec leurs ingrédients
    meals = Meal.objects.filter(user=request.user).prefetch_related('ingredients').order_by('-date')

    # Préparer les données
    meals_data = []
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0

    for meal in meals:
        # Calculer les totaux pour ce repas
        totals = calculate_meal_totals(meal)

        meal_data = {
            'meal': meal,
            'total_calories': totals['calories'],
            'total_protein': totals['protein'],
            'total_carbs': totals['carbs'],
            'total_fat': totals['fat'],
        }

        meals_data.append(meal_data)

        # Ajouter aux totaux globaux
        total_calories += totals['calories']
        total_protein += totals['protein']
        total_carbs += totals['carbs']
        total_fat += totals['fat']

    context = {
        'meals_data': meals_data,
        'total_calories': total_calories,
        'total_protein': total_protein,
        'total_carbs': total_carbs,
        'total_fat': total_fat,
    }

    return render(request, 'meals/my_meals.html', context)


@login_required
def add_meal(request):
    """Create a new meal"""
    if request.method == 'POST':
        meal_form = MealForm(request.POST)
        if meal_form.is_valid():
            meal = meal_form.save(commit=False)
            meal.user = request.user
            meal.save()
            messages.success(request, "Meal created! Now add ingredients.")
            return redirect('add_ingredients', meal_id=meal.id)
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        meal_form = MealForm()

    return render(request, 'meals/add_meal.html', {'meal_form': meal_form})


@login_required
def add_ingredients(request, meal_id):
    """Add ingredients to a meal"""
    meal = get_object_or_404(Meal, id=meal_id, user=request.user)

    if request.method == "POST":
        ingredient_name = request.POST.get("ingredient_name", "").strip()
        
        if not ingredient_name:
            messages.error(request, "Please enter an ingredient name.")
            return redirect('add_ingredients', meal_id=meal.id)
        
        ingredient_name_lower = ingredient_name.lower()
        
        # Validation de l'ingrédient
        if not is_valid_ingredient(ingredient_name_lower):
            messages.error(request, 
                f"❌ '{ingredient_name}' is not a valid ingredient. Please enter a real food item (e.g., chicken, apple, rice).")
            return redirect('add_ingredients', meal_id=meal.id)
        
        try:
            quantity = float(request.POST.get("quantity", 100))
            if quantity <= 0:
                raise ValueError
        except ValueError:
            quantity = 100
            messages.warning(request, "Invalid quantity. Using default 100g.")

        # Récupération des données nutritionnelles (peut prendre du temps)
        cal_100, prot_100, carb_100, fat_100, source = get_nutrition_data(ingredient_name_lower)
        calories, protein, carbs, fat = calculate_nutrition_for_quantity(cal_100, prot_100, carb_100, fat_100, quantity)

        Ingredient.objects.create(
            meal=meal,
            name=ingredient_name_lower,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            quantity=quantity
        )

        # Mettre à jour le total_calories du repas
        totals = calculate_meal_totals(meal)
        meal.total_calories = totals['calories']
        meal.save()

        if "OpenFoodFacts" in source:
            messages.success(request, f"✅ {ingredient_name.title()} ({quantity}g) added: {calories:.2f} kcal (OpenFoodFacts)")
        else:
            messages.warning(request, f"⚠️ {ingredient_name.title()} ({quantity}g) added: {calories:.2f} kcal (Default values used)")
        return redirect('add_ingredients', meal_id=meal.id)

    if request.GET.get("cancel") == "1":
        if not meal.ingredients.exists():
            meal.delete()
            messages.warning(request, "Empty meal deleted.")
        else:
            messages.info(request, "Meal creation cancelled.")
        return redirect('my_meals')

    ingredients = meal.ingredients.all()
    totals = calculate_meal_totals(meal)

    return render(request, 'meals/add_ingredients.html', {
        'meal': meal,
        'ingredients': ingredients,
        'total_calories': totals['calories'],
        'total_protein': totals['protein'],
        'total_carbs': totals['carbs'],
        'total_fat': totals['fat'],
    })


@login_required
def meal_detail(request, meal_id):
    """Show meal details"""
    meal = get_object_or_404(Meal, id=meal_id, user=request.user)
    if not meal.ingredients.exists():
        messages.warning(request, "This meal has no ingredients.")
        return redirect('add_ingredients', meal_id=meal.id)

    ingredients = meal.ingredients.all()
    totals = calculate_meal_totals(meal)

    def calc_minutes(calories, rate):
        return max(1, round((calories / 100) * rate))

    context = {
        'meal': meal,
        'ingredients': ingredients,
        'total_calories': totals['calories'],
        'total_protein': totals['protein'],
        'total_carbs': totals['carbs'],
        'total_fat': totals['fat'],
        'jog_minutes': calc_minutes(totals['calories'], 15),
        'yoga_minutes': calc_minutes(totals['calories'], 25),
        'gym_minutes': calc_minutes(totals['calories'], 12),
        'walk_minutes': calc_minutes(totals['calories'], 20),
    }

    return render(request, 'meals/meal_details.html', context)


@login_required
def delete_meal(request, meal_id):
    """Delete a meal"""
    meal = get_object_or_404(Meal, id=meal_id, user=request.user)
    meal_name = meal.name
    meal.delete()
    messages.success(request, f"Meal '{meal_name}' deleted successfully.")
    return redirect('my_meals')


@login_required
def edit_meal(request, meal_id):
    """Edit meal name or ingredients"""
    meal = get_object_or_404(Meal, id=meal_id, user=request.user)

    if request.method == 'POST':
        # Update meal name
        if 'update_meal_name' in request.POST:
            new_name = request.POST.get('meal_name', '').strip()
            if new_name:
                old_name = meal.name
                meal.name = new_name
                meal.save()
                messages.success(request, f"Meal name updated from '{old_name}' to '{new_name}'.")
            else:
                messages.error(request, "Meal name cannot be empty.")
            return redirect('edit_meal', meal_id=meal.id)

        # Add ingredient
        elif 'add_ingredient' in request.POST:
            ingredient_name = request.POST.get("ingredient_name", "").strip()
            
            if not ingredient_name:
                messages.error(request, "Please enter an ingredient name.")
                return redirect('edit_meal', meal_id=meal.id)
            
            ingredient_name_lower = ingredient_name.lower()
            
            # Validation de l'ingrédient
            if not is_valid_ingredient(ingredient_name_lower):
                messages.error(request, 
                    f"❌ '{ingredient_name}' is not a valid ingredient. Please enter a real food item (e.g., chicken, apple, rice).")
                return redirect('edit_meal', meal_id=meal.id)
            
            try:
                quantity = float(request.POST.get("quantity", 100))
                if quantity <= 0:
                    raise ValueError
            except ValueError:
                quantity = 100
                messages.warning(request, "Invalid quantity. Using default 100g.")

            # Récupération des données nutritionnelles (peut prendre du temps)
            cal_100, prot_100, carb_100, fat_100, source = get_nutrition_data(ingredient_name_lower)
            calories, protein, carbs, fat = calculate_nutrition_for_quantity(cal_100, prot_100, carb_100, fat_100,
                                                                             quantity)

            Ingredient.objects.create(
                meal=meal,
                name=ingredient_name_lower,
                calories=calories,
                protein=protein,
                carbs=carbs,
                fat=fat,
                quantity=quantity
            )
            
            # Mettre à jour le total_calories du repas
            totals = calculate_meal_totals(meal)
            meal.total_calories = totals['calories']
            meal.save()
            
            # Message adapté selon la source
            if "OpenFoodFacts" in source:
                messages.success(request,
                                 f"✅ {ingredient_name.title()} ({quantity}g) added: {calories:.2f} kcal (OpenFoodFacts)")
            else:
                messages.warning(request,
                                 f"⚠️ {ingredient_name.title()} ({quantity}g) added: {calories:.2f} kcal (Default values used)")
            return redirect('edit_meal', meal_id=meal.id)

        # Update ingredient
        elif 'update_ingredient' in request.POST:
            ingredient_id = request.POST.get('ingredient_id')
            ingredient_name = request.POST.get('ingredient_name', '').strip()
            
            if not ingredient_name:
                messages.error(request, "Please enter an ingredient name.")
                return redirect('edit_meal', meal_id=meal.id)
            
            ingredient_name_lower = ingredient_name.lower()
            
            # Validation de l'ingrédient
            if not is_valid_ingredient(ingredient_name_lower):
                messages.error(request, 
                    f"❌ '{ingredient_name}' is not a valid ingredient. Please enter a real food item.")
                return redirect('edit_meal', meal_id=meal.id)
            
            try:
                quantity = float(request.POST.get('quantity', 100))
                if quantity <= 0:
                    raise ValueError
            except ValueError:
                messages.error(request, "Invalid quantity value.")
                return redirect('edit_meal', meal_id=meal.id)

            try:
                ingredient = Ingredient.objects.get(id=ingredient_id, meal=meal)
                cal_100, prot_100, carb_100, fat_100, source = get_nutrition_data(ingredient_name_lower)
                calories, protein, carbs, fat = calculate_nutrition_for_quantity(cal_100, prot_100, carb_100, fat_100,
                                                                                 quantity)

                ingredient.name = ingredient_name_lower
                ingredient.calories = calories
                ingredient.protein = protein
                ingredient.carbs = carbs
                ingredient.fat = fat
                ingredient.quantity = quantity
                ingredient.save()

                # Mettre à jour le total_calories du repas
                totals = calculate_meal_totals(meal)
                meal.total_calories = totals['calories']
                meal.save()

                if "OpenFoodFacts" in source:
                    messages.success(request,
                                     f"✏️ Ingredient updated to {ingredient_name.title()} ({quantity}g): {calories:.2f} kcal (OpenFoodFacts)")
                else:
                    messages.warning(request,
                                     f"⚠️ Ingredient updated to {ingredient_name.title()} ({quantity}g): {calories:.2f} kcal (Default values used)")

            except Ingredient.DoesNotExist:
                messages.error(request, "Ingredient not found.")
            return redirect('edit_meal', meal_id=meal.id)

    ingredients = meal.ingredients.all()
    totals = calculate_meal_totals(meal)

    return render(request, 'meals/edit_meal.html', {
        'meal': meal,
        'ingredients': ingredients,
        'total_calories': totals['calories'],
        'total_protein': totals['protein'],
        'total_carbs': totals['carbs'],
        'total_fat': totals['fat'],
    })


@login_required
def delete_ingredient(request, ingredient_id):
    """Delete an ingredient"""
    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    meal = ingredient.meal
    if meal.user != request.user:
        messages.error(request, "You don't have permission to delete this ingredient.")
        return redirect('my_meals')

    ingredient.delete()
    
    # Mettre à jour le total_calories du repas
    totals = calculate_meal_totals(meal)
    meal.total_calories = totals['calories']
    meal.save()
    
    messages.success(request, f"🗑️ Ingredient deleted successfully.")
    return redirect('edit_meal', meal_id=meal.id)


@login_required
def quick_add_meal(request):
    """Quickly create a meal with a default name"""
    default_names = ["Breakfast", "Lunch", "Dinner", "Snack", "Brunch"]
    meal_name = f"{random.choice(default_names)} - {timezone.now().strftime('%H:%M')}"
    meal = Meal.objects.create(user=request.user, name=meal_name)
    messages.success(request, f"Meal '{meal_name}' created! Now add ingredients.")
    return redirect('add_ingredients', meal_id=meal.id)


@login_required
def duplicate_meal(request, meal_id):
    """Duplicate a meal"""
    original_meal = get_object_or_404(Meal, id=meal_id, user=request.user)
    new_meal = Meal.objects.create(user=request.user, name=f"{original_meal.name} (Copy)")

    for ingredient in original_meal.ingredients.all():
        Ingredient.objects.create(
            meal=new_meal,
            name=ingredient.name,
            calories=ingredient.calories,
            protein=ingredient.protein,
            carbs=ingredient.carbs,
            fat=ingredient.fat,
            quantity=ingredient.quantity
        )

    # Mettre à jour le total_calories du nouveau repas
    totals = calculate_meal_totals(new_meal)
    new_meal.total_calories = totals['calories']
    new_meal.save()

    messages.success(request, f"Meal '{original_meal.name}' duplicated successfully.")
    return redirect('edit_meal', meal_id=new_meal.id)