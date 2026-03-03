from django.db import models
from django.contrib.auth.models import User
from accounts.models import Profile

class MealPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_plans')
    created_at = models.DateField(auto_now_add=True)
    goal = models.CharField(max_length=20)
    bmi = models.FloatField()
    total_calories = models.IntegerField()
    plan_json = models.JSONField(default=dict)  # Comme dans WorkoutPlan

    def __str__(self):
        return f"{self.user.username} - {self.created_at}"


class MealItem(models.Model):
    MEAL_TYPES = [
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
        ("snack", "Snack"),
    ]

    plan = models.ForeignKey(MealPlan, related_name="items", on_delete=models.CASCADE)
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES)
    name = models.CharField(max_length=255)
    calories = models.IntegerField()
    day = models.IntegerField(default=1)  # Jour 1-7

    class Meta:
        ordering = ['day', 'meal_type']

    def __str__(self):
        return f"Day {self.day} - {self.meal_type} - {self.name}"