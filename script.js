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

  const users = JSON.parse(localStorage.getItem("wethaqUsers")) || [];

  const matchedUser = users.find(function (user) {
    return user.email === email && user.password === password;
  });

  if (!matchedUser) {
    emailError.textContent = "Invalid email or password.";
    return;
  }

  localStorage.setItem("wethaqUserEmail", matchedUser.email);
  localStorage.setItem("wethaqUserName", matchedUser.name);
  localStorage.setItem("wethaqUserRole", matchedUser.role);

  if (matchedUser.role === "student") {
    window.location.href = "dashboard.html";
  } else if (matchedUser.role === "staff") {
    window.location.href = "staff.html";
  } else if (matchedUser.role === "admin") {
    window.location.href = "admin.html";
  }
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

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function rewriteComplaint() {
  const description = document.getElementById("complaintDescription");
  const aiSuggestionBox = document.getElementById("aiSuggestionBox");

  if (!description || !aiSuggestionBox) return;

  const text = description.value.trim();

  if (text === "") {
    alert("Please write a complaint description first.");
    return;
  }

  const rewrittenText =
    "I would like to formally report the following issue: " +
    text +
    " I kindly request that the responsible department reviews this complaint and takes the necessary action as soon as possible.";

  aiSuggestionBox.classList.remove("empty-state");
  aiSuggestionBox.textContent = rewrittenText;
}

function useRewrittenText() {
  const description = document.getElementById("complaintDescription");
  const aiSuggestionBox = document.getElementById("aiSuggestionBox");

  if (!description || !aiSuggestionBox) return;

  if (
    aiSuggestionBox.textContent.trim() === "" ||
    aiSuggestionBox.textContent.trim() === "No rewritten complaint yet."
  ) {
    alert("Please generate a rewritten complaint first.");
    return;
  }

  description.value = aiSuggestionBox.textContent.trim();
}

function classifyComplaint(description) {
  const text = description.toLowerCase();

  let category = "Default Category";
  let department = "Manual Review";
  let manualReviewRequired = true;

  if (
    text.includes("ac") ||
    text.includes("air conditioner") ||
    text.includes("elevator") ||
    text.includes("building") ||
    text.includes("classroom") ||
    text.includes("lab")
  ) {
    category = "Facilities";
    department = "Facilities Department";
    manualReviewRequired = false;
  } else if (
    text.includes("grade") ||
    text.includes("course") ||
    text.includes("professor") ||
    text.includes("exam") ||
    text.includes("assignment")
  ) {
    category = "Academic";
    department = "Academic Affairs Department";
    manualReviewRequired = false;
  } else if (
    text.includes("payment") ||
    text.includes("tuition") ||
    text.includes("refund") ||
    text.includes("fee")
  ) {
    category = "Financial";
    department = "Finance Department";
    manualReviewRequired = false;
  } else if (
    text.includes("login") ||
    text.includes("wifi") ||
    text.includes("wi-fi") ||
    text.includes("system") ||
    text.includes("portal")
  ) {
    category = "Technical";
    department = "IT Department";
    manualReviewRequired = false;
  } else if (
    text.includes("registration") ||
    text.includes("schedule") ||
    text.includes("certificate")
  ) {
    category = "Administrative";
    department = "Administration Department";
    manualReviewRequired = false;
  }

  let urgency = "Non-Urgent";

  if (
    text.includes("dangerous") ||
    text.includes("fire") ||
    text.includes("emergency") ||
    text.includes("electrical") ||
    text.includes("safety")
  ) {
    urgency = "Very Urgent";
  } else if (
    text.includes("urgent") ||
    text.includes("unsafe") ||
    text.includes("immediately")
  ) {
    urgency = "Urgent";
  }

  let suggestions = [];

  if (manualReviewRequired) {
    suggestions = ["No suggestions available"];
  } else {
    suggestions = [
      "Attach a supporting document or image if available.",
      "Provide the exact location, course, or related details.",
      "Track the complaint status from Complaint History."
    ];
  }

  return {
    category,
    department,
    urgency,
    manualReviewRequired,
    suggestions
  };
}

function submitComplaint(event) {
  event.preventDefault();

  const title = document.getElementById("complaintTitle").value.trim();
  const description = document.getElementById("complaintDescription").value.trim();

  const titleError = document.getElementById("titleError");
  const descriptionError = document.getElementById("descriptionError");

  titleError.textContent = "";
  descriptionError.textContent = "";

  let isValid = true;

  if (title === "") {
    titleError.textContent = "Complaint title is required.";
    isValid = false;
  }

  if (description === "") {
    descriptionError.textContent = "Complaint description is required.";
    isValid = false;
  }

  if (!isValid) return;

  const aiResult = classifyComplaint(description);

  const complaint = {
    id: Date.now(),
    title: title,
    description: description,
    category: aiResult.category,
    urgency: aiResult.urgency,
    department: aiResult.department,
    status: "Under Review",
    response: "",
    manualReviewRequired: aiResult.manualReviewRequired,
    date: new Date().toLocaleDateString(),
    suggestions: aiResult.suggestions
  };

  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  complaints.push(complaint);
  localStorage.setItem("complaints", JSON.stringify(complaints));

  document.getElementById("resultCategory").textContent = complaint.category;
  document.getElementById("resultUrgency").textContent = complaint.urgency;
  document.getElementById("resultDepartment").textContent = complaint.department;
  document.getElementById("resultStatus").textContent = complaint.status;

  const suggestionsList = document.getElementById("suggestionsList");
  suggestionsList.innerHTML = "";

  complaint.suggestions.forEach(function (suggestion) {
    const li = document.createElement("li");
    li.textContent = suggestion;
    suggestionsList.appendChild(li);
  });

document.getElementById("modalCategory").textContent = complaint.category;
document.getElementById("modalStatus").textContent = complaint.status;

document.getElementById("successModal").classList.remove("hidden");

resultCard.scrollIntoView({
  behavior: "smooth",
  block: "start"
});
  document.getElementById("complaintTitle").value = "";
  document.getElementById("complaintDescription").value = "";
}

document.getElementById("modalCategory").textContent = complaint.category;
document.getElementById("modalStatus").textContent = complaint.status;
document.getElementById("successModal").classList.remove("hidden");

function getStatusClass(status) {
  if (status === "In Progress") {
    return "status-in-progress";
  }

  if (status === "Resolved") {
    return "status-resolved";
  }

  return "status-under-review";
}

function loadComplaintHistory() {
  const historyList = document.getElementById("historyList");
  const statusFilter = document.getElementById("statusFilter");

  if (!historyList) return;

  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  const selectedStatus = statusFilter ? statusFilter.value : "All";

  const filteredComplaints = selectedStatus === "All"
    ? complaints
    : complaints.filter(function (complaint) {
        return complaint.status === selectedStatus;
      });

  updateHistorySummary(complaints);

  if (filteredComplaints.length === 0) {
    historyList.innerHTML = `
      <div class="empty-history">
        <h3>No complaints found</h3>
        <p>Your submitted complaints will appear here after submission.</p>
      </div>
    `;
    return;
  }

  historyList.innerHTML = "";

  filteredComplaints.reverse().forEach(function (complaint) {
    const responseText = complaint.response && complaint.response.trim() !== ""
      ? complaint.response
      : "No department response yet.";

    const card = document.createElement("div");
    card.className = "complaint-card";

    card.innerHTML = `
      <div class="complaint-card-header">
        <div>
          <h3>${complaint.title}</h3>
          <p class="complaint-date">Submitted on ${complaint.date}</p>
        </div>

        <span class="status-badge ${getStatusClass(complaint.status)}">
          ${complaint.status}
        </span>
      </div>

      <div class="complaint-meta">
        <div class="meta-item">
          <span>Category</span>
          <strong>${complaint.category}</strong>
        </div>

        <div class="meta-item">
          <span>Urgency</span>
          <strong>${complaint.urgency}</strong>
        </div>

        <div class="meta-item">
          <span>Department</span>
          <strong>${complaint.department}</strong>
        </div>
      </div>

      <p class="complaint-description">
        ${complaint.description}
      </p>

      <div class="complaint-response">
        <strong>Department Response:</strong>
        <p>${responseText}</p>
      </div>
    `;

    historyList.appendChild(card);
  });
}

function updateHistorySummary(complaints) {
  const totalElement = document.getElementById("historyTotal");
  const inProgressElement = document.getElementById("historyInProgress");
  const resolvedElement = document.getElementById("historyResolved");

  const total = complaints.length;
  const inProgress = complaints.filter(function (complaint) {
    return complaint.status === "In Progress";
  }).length;
  const resolved = complaints.filter(function (complaint) {
    return complaint.status === "Resolved";
  }).length;

  if (totalElement) totalElement.textContent = total;
  if (inProgressElement) inProgressElement.textContent = inProgress;
  if (resolvedElement) resolvedElement.textContent = resolved;
}

window.addEventListener("DOMContentLoaded", function () {
  const userEmailText = document.getElementById("userEmailText");
  const welcomeName = document.getElementById("welcomeName");
  const navUserName = document.getElementById("navUserName");

  const savedEmail = localStorage.getItem("wethaqUserEmail");
  const savedName = localStorage.getItem("wethaqUserName");

  if (userEmailText && savedEmail) {
    userEmailText.textContent = savedEmail;
  }

  if (welcomeName && savedName) {
    welcomeName.textContent = "Welcome back, " + savedName;
  }

  if (navUserName && savedName) {
    navUserName.textContent = savedName;
  }

  loadDashboardOverview();
});

function createAccount(event) {
  event.preventDefault();

  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const role = document.getElementById("registerRole").value;
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("registerEmailError");
  const roleError = document.getElementById("roleError");
  const passwordError = document.getElementById("registerPasswordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  nameError.textContent = "";
  emailError.textContent = "";
  roleError.textContent = "";
  passwordError.textContent = "";
  confirmPasswordError.textContent = "";

  let isValid = true;

  if (name === "") {
    nameError.textContent = "Full name is required.";
    isValid = false;
  }

  if (email === "") {
    emailError.textContent = "University email is required.";
    isValid = false;
  } else if (!email.includes("@")) {
    emailError.textContent = "Please enter a valid university email.";
    isValid = false;
  }

  if (role === "") {
    roleError.textContent = "Please select your role.";
    isValid = false;
  }

  if (password === "") {
    passwordError.textContent = "Password is required.";
    isValid = false;
  } else if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
    isValid = false;
  }

  if (confirmPassword === "") {
    confirmPasswordError.textContent = "Please confirm your password.";
    isValid = false;
  } else if (password !== confirmPassword) {
    confirmPasswordError.textContent = "Passwords do not match.";
    isValid = false;
  }

  if (!isValid) return;

  const users = JSON.parse(localStorage.getItem("wethaqUsers")) || [];

  const emailExists = users.some(function (user) {
    return user.email === email;
  });

  if (emailExists) {
    emailError.textContent = "An account with this email already exists.";
    return;
  }

  const newUser = {
    id: Date.now(),
    name: name,
    email: email,
    password: password,
    role: role
  };

  users.push(newUser);
  localStorage.setItem("wethaqUsers", JSON.stringify(users));

  document.getElementById("accountModal").classList.remove("hidden");
}

function goToLogin() {
  window.location.href = "index.html";
}