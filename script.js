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

