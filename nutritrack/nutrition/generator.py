import random
from .meals_data import MEALS

def generate_daily_meals(goal, bmi):
    breakfast = random.choice(MEALS["breakfast"][goal])
    lunch = random.choice(MEALS["lunch"][goal])
    dinner = random.choice(MEALS["dinner"][goal])

    total = breakfast["cal"] + lunch["cal"] + dinner["cal"]
    return total, breakfast, lunch, dinner
