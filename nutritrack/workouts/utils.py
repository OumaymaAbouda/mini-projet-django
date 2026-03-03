import random
from datetime import datetime

EXERCISES = {
    "lose": [
        {"name": "Burpees", "base_time": 40, "image": "burpees.jpg", "category": "cardio"},
        {"name": "Jump Squats", "base_time": 45, "image": "jump_squats.jpg", "category": "legs"},
        {"name": "Mountain Climbers", "base_time": 30, "image": "mountain_climbers.jpg", "category": "core"},
        {"name": "Push-ups", "base_time": 40, "image": "push_ups.jpg", "category": "chest"},
        {"name": "Lunges", "base_time": 35, "image": "lunges.jpg", "category": "legs"},
        {"name": "Plank", "base_time": 60, "image": "plank.jpg", "category": "core"},
    ],
    "maintain": [
        {"name": "Squats", "base_time": 50, "image": "squats.jpg", "category": "legs"},
        {"name": "Deadlift", "base_time": 60, "image": "deadlift.jpg", "category": "back"},
        {"name": "Bench Press", "base_time": 50, "image": "bench_press.jpg", "category": "chest"},
        {"name": "Pull-ups", "base_time": 40, "image": "pull_ups.jpg", "category": "back"},
        {"name": "Shoulder Press", "base_time": 45, "image": "shoulder_press.jpg", "category": "shoulders"},
        {"name": "Plank", "base_time": 60, "image": "plank.jpg", "category": "core"},
    ],
    "gain": [
        {"name": "Deadlift", "base_time": 60, "image": "deadlift.jpg", "category": "back"},
        {"name": "Squats", "base_time": 50, "image": "squats.jpg", "category": "legs"},
        {"name": "Bench Press", "base_time": 50, "image": "bench_press.jpg", "category": "chest"},
        {"name": "Barbell Row", "base_time": 45, "image": "barbell_row.jpg", "category": "back"},
        {"name": "Pull-ups", "base_time": 40, "image": "pull_ups.jpg", "category": "back"},
        {"name": "Dips", "base_time": 35, "image": "dips.jpg", "category": "triceps"},
    ]
}


def generate_workout_plan(goal):
    plan = []
    exercises = EXERCISES[goal].copy()

    for i in range(1, 6):  # 5 jours
        day_exercises = []
        # Mélanger les exercices pour varier l'ordre chaque jour
        random.shuffle(exercises)

        for ex in exercises:
            sets = random.randint(3, 5)
            reps = random.randint(8, 15)
            rest = random.randint(30, 90)
            # Calcul du temps plus réaliste
            time_per_set = (reps * 2) + rest  # 2 secondes par répétition + temps de repos
            total_time_sec = sets * time_per_set
            total_time_min = round(total_time_sec / 60)

            day_exercises.append({
                "name": ex["name"],
                "sets": sets,
                "reps": reps,
                "rest": rest,
                "time": total_time_min,
                "image": ex["image"],
                "category": ex["category"],
                "id": f"{ex['name'].lower().replace(' ', '-')}-{i}"
            })

        # Trier par catégorie pour un meilleur flow
        day_exercises.sort(key=lambda x: x["category"])

        plan.append({
            "day": f"Day {i}",
            "date": datetime.now().strftime("%b %d"),
            "exercises": day_exercises,
            "total_time": sum(ex["time"] for ex in day_exercises),
            "categories": list(set([ex["category"] for ex in day_exercises]))
        })

    return plan