# meals/admin.py
from django.contrib import admin
from .models import Meal, Ingredient


class IngredientInline(admin.TabularInline):
    model = Ingredient
    extra = 1
    fields = ('name', 'quantity', 'calories', 'protein', 'carbs', 'fat')
    readonly_fields = ('calories', 'protein', 'carbs', 'fat')  # Ces valeurs sont calculées


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'date', 'total_calories', 'ingredients_count', 'user_username')
    list_filter = ('date', 'user')
    search_fields = ('name', 'user__username', 'user__email')
    readonly_fields = ('total_calories', 'created_at_display')
    date_hierarchy = 'date'
    inlines = [IngredientInline]
    
    fieldsets = (
        ('Informations du repas', {
            'fields': ('user', 'name', 'date', 'total_calories')
        }),
        ('Informations complémentaires', {
            'fields': ('created_at_display',),
            'classes': ('collapse',)
        }),
    )
    
    def ingredients_count(self, obj):
        """Afficher le nombre d'ingrédients"""
        return obj.ingredients.count()
    ingredients_count.short_description = 'Nombre d\'ingrédients'
    
    def user_username(self, obj):
        """Afficher le nom d'utilisateur"""
        return obj.user.username
    user_username.short_description = 'Utilisateur'
    user_username.admin_order_field = 'user__username'
    
    def created_at_display(self, obj):
        """Afficher la date de création (si disponible)"""
        return obj.date
    created_at_display.short_description = 'Date'


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'meal', 'quantity', 'calories', 'protein', 'carbs', 'fat', 'meal_user')
    list_filter = ('meal__date', 'meal__user')
    search_fields = ('name', 'meal__name', 'meal__user__username')
    readonly_fields = ('calories', 'protein', 'carbs', 'fat')
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('meal', 'name', 'quantity')
        }),
        ('Valeurs nutritionnelles (pour 100g)', {
            'fields': ('calories', 'protein', 'carbs', 'fat')
        }),
    )
    
    def meal_user(self, obj):
        """Afficher l'utilisateur du repas"""
        return obj.meal.user.username
    meal_user.short_description = 'Utilisateur'
    meal_user.admin_order_field = 'meal__user__username'
