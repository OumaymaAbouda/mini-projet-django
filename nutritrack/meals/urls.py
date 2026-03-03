from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('my-meals/', views.my_meals, name='my_meals'),
    path('add/', views.add_meal, name='add_meal'),
    path('meal/<int:meal_id>/', views.meal_detail, name='meal_details'),
    path('meal/<int:meal_id>/delete/', views.delete_meal, name='delete_meal'),
    path('meal/<int:meal_id>/ingredients/', views.add_ingredients, name='add_ingredients'),
    path('meal/<int:meal_id>/edit/', views.edit_meal, name='edit_meal'),
    path('ingredient/<int:ingredient_id>/delete/', views.delete_ingredient, name='delete_ingredient'),
    path('quick-add/', views.quick_add_meal, name='quick_add_meal'),
    path('meal/<int:meal_id>/duplicate/', views.duplicate_meal, name='duplicate_meal'),
]