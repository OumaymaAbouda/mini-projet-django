from django.db import models
from django.contrib.auth.models import User


class WorkoutPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    plan_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"WorkoutPlan - {self.user.username}"


class ExerciseLog(models.Model):
    """
    Journal d'exercices individuels pour avoir des valeurs réelles
    utilisables dans le dashboard (workouts, calories brûlées, activités récentes).
    """
    WORKOUT_TYPES = [
        ('cardio', 'Cardio'),
        ('strength', 'Musculation'),
        ('hiit', 'HIIT'),
        ('yoga', 'Yoga'),
        ('other', 'Autre'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workout_type = models.CharField(max_length=20, choices=WORKOUT_TYPES, default='other')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    calories_burned = models.PositiveIntegerField(default=0)
    date = models.DateField()  # jour logique du workout
    created_at = models.DateTimeField(auto_now_add=True)  # pour trier les activités récentes

    def __str__(self):
        return f"{self.title} - {self.calories_burned} kcal ({self.date})"
