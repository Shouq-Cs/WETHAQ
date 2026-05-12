function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  emailError.textContent = "";
  passwordError.textContent = "";

  let isValid = true;

  if (email === "") {
    emailError.textContent = "University email is required.";
    isValid = false;
  } else if (!email.includes("@")) {
    emailError.textContent = "Please enter a valid university email.";
    isValid = false;
  }

  if (password === "") {
    passwordError.textContent = "Password is required.";
    isValid = false;
  } else if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    isValid = false;
  }

  if (!isValid) return;

  localStorage.setItem("wethaqUserEmail", email);
  alert("Login successful. Welcome to WETHAQ Beta!");

  window.location.href = "dashboard.html";
}

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const showButton = document.querySelector(".show-btn");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    showButton.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    showButton.textContent = "Show";
  }
}

function goToSubmit() {
  window.location.href = "submit.html";
}

function goToHistory() {
  window.location.href = "history.html";
}

function logout() {
  localStorage.removeItem("wethaqUserEmail");
  window.location.href = "index.html";
}

function loadDashboardOverview() {
  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

  const total = complaints.length;

  const inProgress = complaints.filter(function (complaint) {
    return complaint.status === "In Progress";
  }).length;

  const resolved = complaints.filter(function (complaint) {
    return complaint.status === "Resolved";
  }).length;

  const totalElement = document.getElementById("totalComplaints");
  const inProgressElement = document.getElementById("inProgressComplaints");
  const resolvedElement = document.getElementById("resolvedComplaints");

  if (totalElement) {
    totalElement.textContent = total;
  }

  if (inProgressElement) {
    inProgressElement.textContent = inProgress;
  }

  if (resolvedElement) {
    resolvedElement.textContent = resolved;
  }
}

window.addEventListener("DOMContentLoaded", function () {
  const userEmailText = document.getElementById("userEmailText");
  const savedEmail = localStorage.getItem("wethaqUserEmail");

  if (userEmailText && savedEmail) {
    userEmailText.textContent = savedEmail;
  }

  loadDashboardOverview();
});