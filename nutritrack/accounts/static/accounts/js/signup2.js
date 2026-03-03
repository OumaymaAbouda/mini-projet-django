
// helper to get csrftoken (Django)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(c.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('DOMContentLoaded', function () {
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const toStep2 = document.getElementById('toStep2');
  const backToStep1 = document.getElementById('backToStep1');
  const submitBtn = document.getElementById('submitBtn');
  const messageEl = document.getElementById('message');
  const progressSteps = document.querySelectorAll('.progress-step');

  // Fonction pour afficher les messages
  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = type; // 'error' ou 'success'
  }

  // Fonction pour mettre à jour la progression
  function updateProgress(stepNumber) {
    progressSteps.forEach((step, index) => {
      if (index < stepNumber - 1) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (index === stepNumber - 1) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }

  // Passage à l'étape 2
  toStep2.addEventListener('click', () => {
    const required = ['first_name', 'last_name', 'username', 'password', 'confirm_password'];
    let isValid = true;

    for (let id of required) {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        isValid = false;
        el.style.borderColor = '#ef4444';
      } else {
        el.style.borderColor = '';
      }
    }

    const passwordEl = document.getElementById('password');
    const confirmPasswordEl = document.getElementById('confirm_password');
    if (passwordEl.value !== confirmPasswordEl.value) {
      isValid = false;
      showMessage('Passwords do not match!', 'error');
      confirmPasswordEl.style.borderColor = '#ef4444';
      return;
    }

    if (!isValid) {
      showMessage('Please fill all required fields in step 1.', 'error');
      return;
    }

    showMessage('', '');
    step1.classList.remove('active');
    step2.classList.add('active');
    updateProgress(2);
  });

  // Retour à l'étape 1
  backToStep1.addEventListener('click', () => {
    step2.classList.remove('active');
    step1.classList.add('active');
    updateProgress(1);
    showMessage('', '');
  });

  // Soumission du formulaire
  submitBtn.addEventListener('click', async () => {
    // Récupérer les valeurs de Step 2
    const genderRadio = document.querySelector('input[name="gender"]:checked');
    const gender = genderRadio ? genderRadio.value : '';

    const goalSelect = document.getElementById('goal');
    const goal = goalSelect ? goalSelect.value : '';

    const birthday = document.getElementById('birthday').value;
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);

    // Validation étape 2
    let step2Valid = true;

    if (!gender) {
      step2Valid = false;
      document.querySelectorAll('input[name="gender"]').forEach(r => r.parentElement.style.color = '#ef4444');
    } else {
      document.querySelectorAll('input[name="gender"]').forEach(r => r.parentElement.style.color = '');
    }

    if (!birthday) {
      step2Valid = false;
      document.getElementById('birthday').style.borderColor = '#ef4444';
    } else {
      document.getElementById('birthday').style.borderColor = '';
    }

    if (isNaN(height)) {
      step2Valid = false;
      document.getElementById('height').style.borderColor = '#ef4444';
    } else {
      document.getElementById('height').style.borderColor = '';
    }

    if (isNaN(weight)) {
      step2Valid = false;
      document.getElementById('weight').style.borderColor = '#ef4444';
    } else {
      document.getElementById('weight').style.borderColor = '';
    }

    if (!goal) {
      step2Valid = false;
      goalSelect.style.borderColor = '#ef4444';
    } else {
      goalSelect.style.borderColor = '';
    }

    if (!step2Valid) {
      showMessage('Please fill all fields in step 2, including your goal.', 'error');
      return;
    }

    // Préparer les données à envoyer
    const data = {
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value,
      confirm_password: document.getElementById('confirm_password').value,
      gender: gender,
      birthday: birthday,
      height: height,
      weight: weight,
      goal: goal
    };

    try {
      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;

      const resp = await fetch(window.location.pathname, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie('csrftoken') || ''
        },
        body: JSON.stringify(data),
      });

      const result = await resp.json();

      if (result.success) {
        showMessage(result.message || 'Account created successfully!', 'success');

        // Reset champs Step 1
        ['first_name','last_name','username','password','confirm_password'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
          if (el) el.style.borderColor = '';
        });

        // Reset champs Step 2
        ['birthday','height','weight'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
          if (el) el.style.borderColor = '';
        });

        // Reset radio buttons et goal
        document.querySelectorAll('input[name="gender"]').forEach(r => {
          r.checked = false;
          r.parentElement.style.color = '';
        });
        if (goalSelect) goalSelect.value = '';
        goalSelect.style.borderColor = '';

        setTimeout(() => {
          step2.classList.remove('active');
          step1.classList.add('active');
          updateProgress(1);
        }, 2000);

      } else {
        showMessage(result.error || 'Error occurred.', 'error');
      }
    } catch (err) {
      showMessage('Network error.', 'error');
    } finally {
      submitBtn.textContent = 'Create account';
      submitBtn.disabled = false;
    }
  });

  // Initialiser la progression
  updateProgress(1);
});
