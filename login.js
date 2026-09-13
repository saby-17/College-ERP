const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');
const loginButton = document.querySelector('#loginButton');
const passwordInput = document.querySelector('#password');

document.querySelector('#togglePassword').addEventListener('click', event => {
  const hidden = passwordInput.type === 'password';
  passwordInput.type = hidden ? 'text' : 'password';
  event.currentTarget.textContent = hidden ? 'Hide' : 'Show';
  event.currentTarget.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.hidden = true;
  loginButton.disabled = true;
  loginButton.textContent = 'Signing in…';
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username: document.querySelector('#username').value, password: passwordInput.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
    window.location.replace('/');
  } catch (error) {
    loginError.textContent = error.message || 'Unable to sign in.';
    loginError.hidden = false;
    loginButton.disabled = false;
    loginButton.innerHTML = 'Sign in <span>→</span>';
    passwordInput.focus();
  }
});
