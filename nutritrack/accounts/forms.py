from django import forms
from django.contrib.auth.models import User
from .models import Profile

class SignupStep1Form(forms.Form):
    first_name = forms.CharField(max_length=50)
    last_name = forms.CharField(max_length=50)
    username = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)

class SignupStep2Form(forms.Form):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    GOAL_CHOICES = [
        ('lose', 'Lose Weight'),
        ('maintain', 'Maintain Weight'),
        ('gain', 'Gain Weight'),
    ]

    gender = forms.ChoiceField(choices=GENDER_CHOICES)
    birthday = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}))
    height = forms.FloatField()
    weight = forms.FloatField()
    goal = forms.ChoiceField(choices=GOAL_CHOICES)

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username']

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['gender', 'birthday', 'height', 'weight', 'goal']
        widgets = {
            'birthday': forms.DateInput(
                attrs={'placeholder': 'dd/mm/yyyy'},
                format='%d/%m/%Y'
            )
        }

    def __init__(self, *args, **kwargs):
        super(ProfileForm, self).__init__(*args, **kwargs)
        self.fields['birthday'].input_formats = ['%d/%m/%Y']