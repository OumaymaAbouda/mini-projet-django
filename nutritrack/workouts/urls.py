from django.urls import path
from . import views

urlpatterns = [
    path('plan_workout/', views.workout_plan, name='workout_plan'),
    path('log_exercise/', views.log_exercise, name='log_exercise'),
    path('unlog_exercise/', views.unlog_exercise, name='unlog_exercise'),
    path('reset_all_exercises/', views.reset_all_exercises, name='reset_all_exercises'),
    path('regenerate_plan/', views.regenerate_workout_plan, name='regenerate_workout_plan'),
]
