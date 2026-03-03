from django.urls import path
from . import views

app_name = 'nutrition'

urlpatterns = [
    path('plan/', views.nutrition_plan, name='nutrition_plan'),
    path('plan/generate/', views.generate_plan, name='generate_plan'),  # CHANGÉ ICI
    path('plan/download/', views.download_json, name='download_json'),
]