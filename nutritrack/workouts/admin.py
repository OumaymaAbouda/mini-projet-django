from django.contrib import admin
from .models import WorkoutPlan, ExerciseLog


@admin.register(WorkoutPlan)
class WorkoutPlanAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'plan_days_count', 'total_exercises')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'plan_json_display')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('user', 'created_at')
        }),
        ('Détails du plan (JSON)', {
            'fields': ('plan_json_display',),
            'classes': ('collapse',)
        }),
    )
    
    def plan_days_count(self, obj):
        """Afficher le nombre de jours dans le plan"""
        if obj.plan_json and isinstance(obj.plan_json, list):
            return len(obj.plan_json)
        return 0
    plan_days_count.short_description = 'Nombre de jours'
    
    def total_exercises(self, obj):
        """Afficher le nombre total d'exercices dans le plan"""
        if obj.plan_json and isinstance(obj.plan_json, list):
            total = sum(len(day.get('exercises', [])) for day in obj.plan_json)
            return total
        return 0
    total_exercises.short_description = 'Total exercices'
    
    def plan_json_display(self, obj):
        """Afficher le JSON du plan de manière lisible"""
        import json
        return json.dumps(obj.plan_json, indent=2, ensure_ascii=False) if obj.plan_json else "{}"
    plan_json_display.short_description = 'Plan JSON'


@admin.register(ExerciseLog)
class ExerciseLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'date', 'calories_burned', 'workout_type', 'created_at')
    list_filter = ('workout_type', 'date', 'created_at')
    search_fields = ('title', 'user__username', 'user__email', 'description')
    readonly_fields = ('created_at',)
    date_hierarchy = 'date'
    ordering = ('-created_at', '-date')
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('user', 'title', 'workout_type', 'date')
        }),
        ('Détails de l\'exercice', {
            'fields': ('description', 'calories_burned', 'created_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimiser les requêtes avec select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('user')
