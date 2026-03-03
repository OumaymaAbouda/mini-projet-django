# admin.py
from django.contrib import admin
from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'gender', 'birthday', 'height', 'weight', 'goal', 'workout_day_streak', 'age_display', 'bmi_display')
    list_filter = ('gender', 'goal', 'birthday')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('age_display', 'bmi_display', 'daily_calories_display', 'bmi_category_display')
    
    fieldsets = (
        ('Informations utilisateur', {
            'fields': ('user',)
        }),
        ('Informations personnelles', {
            'fields': ('gender', 'birthday', 'height', 'weight')
        }),
        ('Objectifs et Statistiques', {
            'fields': ('goal', 'workout_day_streak')
        }),
        ('Calculs automatiques', {
            'fields': ('age_display', 'bmi_display', 'daily_calories_display', 'bmi_category_display'),
            'classes': ('collapse',)
        }),
    )
    
    def age_display(self, obj):
        """Afficher l'âge calculé"""
        return obj.age
    age_display.short_description = 'Âge'
    
    def bmi_display(self, obj):
        """Afficher le BMI calculé"""
        return obj.calculate_bmi()
    bmi_display.short_description = 'BMI'
    
    def daily_calories_display(self, obj):
        """Afficher les calories quotidiennes recommandées"""
        return f"{obj.calculate_daily_calories()} kcal"
    daily_calories_display.short_description = 'Calories quotidiennes'
    
    def bmi_category_display(self, obj):
        """Afficher la catégorie BMI"""
        return obj.get_bmi_category()
    bmi_category_display.short_description = 'Catégorie BMI'
