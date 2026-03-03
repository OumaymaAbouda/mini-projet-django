from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Profile(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]

    GOAL_CHOICES = [
        ('lose', 'Lose Weight'),
        ('maintain', 'Maintain Weight'),
        ('gain', 'Gain Weight'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    birthday = models.DateField()
    height = models.FloatField(help_text="Height in cm")
    weight = models.FloatField(help_text="Weight in kg")
    goal = models.CharField(max_length=10, choices=GOAL_CHOICES, default='maintain')
    workout_day_streak = models.PositiveIntegerField(default=0, help_text="Consecutive days with 6+ exercises completed")

    def __str__(self):
        return self.user.username

    @property
    def age(self):
        """Calculate age from birthday"""
        today = timezone.now().date()
        return today.year - self.birthday.year - (
                (today.month, today.day) < (self.birthday.month, self.birthday.day)
        )

    def calculate_bmi(self):
        """Calculate BMI"""
        height_m = self.height / 100  # convert cm to meters
        return round(self.weight / (height_m ** 2), 1)

    def calculate_daily_calories(self):
        """Calculate daily calorie needs based on goal and gender"""
        if self.gender == 'M':
            base_factor = 1.0
        else:
            base_factor = 0.9

        if self.goal == "lose":
            daily_calories = self.weight * 22 * base_factor
        elif self.goal == "gain":
            daily_calories = self.weight * 30 * base_factor
        else:  # maintain
            daily_calories = self.weight * 26 * base_factor

        return int(daily_calories)

    def get_bmi_category(self):
        """Get BMI category"""
        bmi = self.calculate_bmi()
        if bmi < 18.5:
            return "Underweight"
        elif 18.5 <= bmi < 25:
            return "Normal"
        elif 25 <= bmi < 30:
            return "Overweight"
        else:
            return "Obese"
