from django.db import models
from django.contrib.auth.models import User

class Meal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    date = models.DateField(auto_now_add=True)
    total_calories = models.FloatField(default=0)

    def __str__(self):
        return f"{self.name} ({self.date})"


class Ingredient(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=100)
    calories = models.FloatField(default=0)
    protein = models.FloatField(default=0)  # en grammes
    carbs = models.FloatField(default=0)    # en grammes
    fat = models.FloatField(default=0)      # en grammes
    quantity = models.FloatField(default=100)

    def __str__(self):
        return f"{self.name} ({self.quantity}g) - {self.calories} kcal"