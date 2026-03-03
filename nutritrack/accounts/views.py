import json
from datetime import datetime
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from .models import Profile
from .forms import UserForm, ProfileForm
from django.urls import reverse
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash

# 🔹 SIGN UP VIEW

@csrf_protect
@require_http_methods(["GET", "POST"])
def signup_view(request):
    if request.method == 'GET':
        # Render the signup page (2-step animation handled by JS)
        return render(request, 'accounts/signup.html')

    # POST: JSON data received from JS
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    # Extract fields
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    gender = data.get('gender', '').strip()
    birthday = data.get('birthday', '').strip()
    height = data.get('height', '')
    weight = data.get('weight', '')
    goal = data.get('goal', '').strip()  # <-- nouveau champ

    # Basic validation
    if not all([first_name, last_name, username, password, confirm_password, gender, birthday, height, weight, goal]):
        return JsonResponse({'success': False, 'error': 'Please fill all required fields.'})

    if password != confirm_password:
        return JsonResponse({'success': False, 'error': 'Passwords do not match.'})

    if User.objects.filter(username=username).exists():
        return JsonResponse({'success': False, 'error': 'Username is already taken.'})

    # Validate goal
    if goal not in ['lose', 'maintain', 'gain']:
        return JsonResponse({'success': False, 'error': 'Invalid goal selected.'})

    # Parse birthday, height, weight
    try:
        birthday_date = datetime.strptime(birthday, "%d/%m/%Y").date()

    except ValueError:
        return JsonResponse({'success': False, 'error': 'Birthday must be DD/MM/YYYY'})

    try:
        height_value = float(height)
        weight_value = float(weight)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Height and weight must be numbers.'})

    # Create user
    user = User.objects.create_user(
        username=username,
        first_name=first_name,
        last_name=last_name,
        password=password
    )

    # Create profile avec goal
    Profile.objects.create(
        user=user,
        gender=gender,
        birthday=birthday_date,
        height=height_value,
        weight=weight_value,
        goal=goal
    )

    return JsonResponse({'success': True, 'message': 'Account created successfully.'})

# -----------------------------
# 🔹 LOGIN VIEW
# -----------------------------
@csrf_protect
@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.method == 'GET':
        return render(request, 'accounts/login.html')

    # POST: JSON data
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return JsonResponse({'success': False, 'error': 'Please enter both username and password.'})

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return JsonResponse({
            'success': True,
            'message': 'Login successful.',
            'redirect_url': reverse('home')
        })
    else:
        return JsonResponse({'success': False, 'error': 'Invalid username or password.'})





# -----------------------------
# 🔹 LOGOUT VIEW
# -----------------------------
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return redirect('login')

    #JsonResponse({'success': True, 'message': 'Logged out successfully.'})
# -----------------------------
# 🔹 PROFILE VIEW (affichage seulement)
# -----------------------------
@login_required
def profile_view(request):
    try:
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        from django.contrib import messages
        messages.error(request, "Please complete your profile first.")
        return redirect('update_profile')  # Rediriger vers la création du profil
    
    # Calculer le streak actuel pour l'afficher (mais utiliser le streak sauvegardé)
    from datetime import date, timedelta
    try:
        from workouts.models import ExerciseLog
        has_workouts = True
    except ImportError:
        has_workouts = False
    
    workout_day_streak = profile.workout_day_streak or 0
    
    # Optionnel : recalculer pour vérifier (mais on garde le streak sauvegardé)
    if has_workouts:
        today = date.today()
        current_streak = 0
        current_workout_day = today
        while True:
            day_exercises_count = ExerciseLog.objects.filter(
                user=request.user,
                date=current_workout_day
            ).count()
            
            if day_exercises_count >= 6:
                current_streak += 1
                current_workout_day -= timedelta(days=1)
            else:
                break
        
        # Mettre à jour si le streak actuel est supérieur
        if current_streak > workout_day_streak:
            profile.workout_day_streak = current_streak
            profile.save()
            workout_day_streak = current_streak
    
    context = {
        'profile': profile,
        'workout_day_streak': workout_day_streak,
    }
    return render(request, 'accounts/profile.html', context)

# -----------------------------
# 🔹 UPDATE PROFILE VIEW (modification)
# -----------------------------
@login_required
def update_profile(request):
    user = request.user
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        from django.contrib import messages
        messages.warning(request, "Please complete your profile first.")
        return redirect('profile')

    if request.method == 'POST':
        user_form = UserForm(request.POST, instance=user)
        profile_form = ProfileForm(request.POST, instance=profile)
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            return redirect('profile')  
    else:
        user_form = UserForm(instance=user)
        profile_form = ProfileForm(instance=profile)

    context = {
        'user_form': user_form,
        'profile_form': profile_form
    }
    return render(request, 'accounts/update_profile.html', context)


@login_required(login_url='/accounts/login/')
def custom_password_change(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            update_session_auth_hash(request, request.user)
            return redirect('password_change_done')
    else:
        form = PasswordChangeForm(request.user)

    return render(request, 'accounts/password_change_form.html', {'form': form})


@login_required
def custom_password_change_done(request):
    return render(request, 'accounts/password_change_done.html')
