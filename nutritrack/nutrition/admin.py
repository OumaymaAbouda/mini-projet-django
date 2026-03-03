from django.contrib import admin
from .models import MealPlan, MealItem


class MealItemInline(admin.TabularInline):
    model = MealItem
    extra = 0
    fields = ('day', 'meal_type', 'name', 'calories')
    ordering = ('day', 'meal_type')


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ('user', 'goal', 'created_at', 'total_calories', 'bmi', 'items_count')
    list_filter = ('goal', 'created_at', 'total_calories')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'bmi', 'total_calories', 'plan_json_display')
    date_hierarchy = 'created_at'
    inlines = [MealItemInline]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('user', 'goal', 'created_at')
        }),
        ('Paramètres nutritionnels', {
            'fields': ('bmi', 'total_calories')
        }),
        ('Données du plan (JSON)', {
            'fields': ('plan_json_display',),
            'classes': ('collapse',)
        }),
    )
    
    def items_count(self, obj):
        """Afficher le nombre d'éléments du plan"""
        return obj.items.count()
    items_count.short_description = 'Nombre d\'éléments'
    
    def plan_json_display(self, obj):
        """Afficher le JSON du plan de manière lisible"""
        import json
        return json.dumps(obj.plan_json, indent=2, ensure_ascii=False) if obj.plan_json else "{}"
    plan_json_display.short_description = 'Plan JSON'


@admin.register(MealItem)
class MealItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'plan', 'day', 'meal_type', 'calories', 'plan_user', 'plan_goal')
    list_filter = ('meal_type', 'day', 'plan__created_at', 'plan__goal')
    search_fields = ('name', 'plan__user__username')
    ordering = ('plan', 'day', 'meal_type')
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('plan', 'day', 'meal_type', 'name')
        }),
        ('Valeurs nutritionnelles', {
            'fields': ('calories',)
        }),
    )
    
    def plan_user(self, obj):
        """Afficher l'utilisateur du plan"""
        return obj.plan.user.username
    plan_user.short_description = 'Utilisateur'
    plan_user.admin_order_field = 'plan__user__username'
    
    def plan_goal(self, obj):
        """Afficher l'objectif du plan"""
        return obj.plan.goal
    plan_goal.short_description = 'Objectif'
    plan_goal.admin_order_field = 'plan__goal'
