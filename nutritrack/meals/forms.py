from django import forms
from .models import Meal, Ingredient

class MealForm(forms.ModelForm):
    class Meta:
        model = Meal
        fields = ['name']

class IngredientForm(forms.ModelForm):
    class Meta:
        model = Ingredient
        fields = ['name']
