const API_BASE = "http://localhost:5000";

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("wethaqCurrentUser") || "null");
}

function setCurrentUser(user) {
  sessionStorage.setItem("wethaqCurrentUser", JSON.stringify(user));
}

function requireLogin() {
  const user = getCurrentUser();
  const publicPages = ["index.html", "register.html", ""];
  const currentPage = window.location.pathname.split("/").pop();

  if (!user && !publicPages.includes(currentPage)) {
    window.location.href = "index.html";
    return null;
  }

  return user;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(API_BASE + url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function showText(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = message;
}

function getStatusClass(status) {
  if (status === "In Progress") return "status-in-progress";
  if (status === "Resolved") return "status-resolved";
  return "status-under-review";
}

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const showButton = document.querySelector(".show-btn");

  if (!passwordInput || !showButton) return;

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

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToLogin() {
  window.location.href = "index.html";
}

function logout() {
  sessionStorage.removeItem("wethaqCurrentUser");
  window.location.href = "index.html";
}

async function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  showText("emailError", "");
  showText("passwordError", "");

  let isValid = true;

  if (email === "") {
    showText("emailError", "University email is required.");
    isValid = false;
  } else if (!email.includes("@")) {
    showText("emailError", "Please enter a valid university email.");
    isValid = false;
  }

  if (password === "") {
    showText("passwordError", "Password is required.");
    isValid = false;
  } else if (password.length < 6) {
    showText("passwordError", "Password must be at least 6 characters.");
    isValid = false;
  }

  if (!isValid) return;

  try {
    const data = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setCurrentUser(data.user);

    if (data.user.role === "student" || data.user.role === "faculty") {
      window.location.href = "dashboard.html";
    } else if (data.user.role === "staff") {
      window.location.href = "staff.html";
    } else if (data.user.role === "admin") {
      window.location.href = "admin.html";
    }
  } catch (error) {
    showText("emailError", error.message);
  }
}

async function createAccount(event) {
  event.preventDefault();

  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const role = document.getElementById("registerRole").value;
  const password = document.getElementById("registerPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  showText("nameError", "");
  showText("registerEmailError", "");
  showText("roleError", "");
  showText("registerPasswordError", "");
  showText("confirmPasswordError", "");

  let isValid = true;

  if (name === "") {
    showText("nameError", "Full name is required.");
    isValid = false;
  }

  if (email === "") {
    showText("registerEmailError", "University email is required.");
    isValid = false;
  } else if (!email.includes("@")) {
    showText("registerEmailError", "Please enter a valid university email.");
    isValid = false;
  }

  if (role === "") {
    showText("roleError", "Please select your role.");
    isValid = false;
  }

  if (password === "") {
    showText("registerPasswordError", "Password is required.");
    isValid = false;
  } else if (password.length < 6) {
    showText("registerPasswordError", "Password must be at least 6 characters.");
    isValid = false;
  }

  if (confirmPassword === "") {
    showText("confirmPasswordError", "Please confirm your password.");
    isValid = false;
  } else if (password !== confirmPassword) {
    showText("confirmPasswordError", "Passwords do not match.");
    isValid = false;
  }

  if (!isValid) return;

  try {
    await apiRequest("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role })
    });

    document.getElementById("accountModal").classList.remove("hidden");
  } catch (error) {
    showText("registerEmailError", error.message);
  }
}

async function rewriteComplaint() {
  const description = document.getElementById("complaintDescription");
  const aiSuggestionBox = document.getElementById("aiSuggestionBox");

  if (!description || !aiSuggestionBox) return;

  const text = description.value.trim();

  if (text === "") {
    alert("Please write a complaint description first.");
    return;
  }

  aiSuggestionBox.classList.remove("empty-state");
  aiSuggestionBox.textContent = "Rewriting...";

  try {
    const data = await apiRequest("/chat", {
      method: "POST",
      body: JSON.stringify({ description: text })
    });

    aiSuggestionBox.textContent = data.rewrittenText;
  } catch (error) {
    aiSuggestionBox.textContent =
      "I would like to formally report the following issue: " +
      text +
      " I kindly request that the responsible department reviews this complaint and takes the necessary action as soon as possible.";
  }
}

function useRewrittenText() {
  const description = document.getElementById("complaintDescription");
  const aiSuggestionBox = document.getElementById("aiSuggestionBox");

  if (!description || !aiSuggestionBox) return;

  if (
    aiSuggestionBox.textContent.trim() === "" ||
    aiSuggestionBox.textContent.trim() === "No rewritten complaint yet." ||
    aiSuggestionBox.textContent.trim() === "Rewriting..."
  ) {
    alert("Please generate a rewritten complaint first.");
    return;
  }

  description.value = aiSuggestionBox.textContent.trim();
}

async function submitComplaint(event) {
  event.preventDefault();

  const user = requireLogin();
  if (!user) return;

  const title = document.getElementById("complaintTitle").value.trim();
  const description = document.getElementById("complaintDescription").value.trim();

  showText("titleError", "");
  showText("descriptionError", "");

  let isValid = true;

  if (title === "") {
    showText("titleError", "Complaint title is required.");
    isValid = false;
  }

  if (description === "") {
    showText("descriptionError", "Complaint description is required.");
    isValid = false;
  }

  if (!isValid) return;

  try {
    const data = await apiRequest("/api/complaints", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        userEmail: user.email,
        userName: user.name
      })
    });

    const complaint = data.complaint;

    showText("resultCategory", complaint.category);
    showText("resultUrgency", complaint.urgency);
    showText("resultDepartment", complaint.department);
    showText("resultStatus", complaint.status);

    const suggestionsList = document.getElementById("suggestionsList");
    if (suggestionsList) {
      suggestionsList.innerHTML = "";
      complaint.suggestions.forEach(function (suggestion) {
        const li = document.createElement("li");
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
      });
    }

    showText("modalCategory", complaint.category);
    showText("modalStatus", complaint.status);

    const resultCard = document.getElementById("resultCard");
    if (resultCard) {
      resultCard.classList.remove("hidden");
      resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const successModal = document.getElementById("successModal");
    if (successModal) successModal.classList.remove("hidden");

    document.getElementById("complaintTitle").value = "";
    document.getElementById("complaintDescription").value = "";

    loadDashboardOverview();
  } catch (error) {
    showText("descriptionError", error.message);
  }
}

async function getVisibleComplaints() {
  const user = getCurrentUser();

  if (!user) return [];

  const params = new URLSearchParams({
    role: user.role,
    userEmail: user.email || "",
    department: user.department || ""
  });

  return apiRequest("/api/complaints?" + params.toString());
}

async function loadDashboardOverview() {
  const totalElement = document.getElementById("totalComplaints");
  const inProgressElement = document.getElementById("inProgressComplaints");
  const resolvedElement = document.getElementById("resolvedComplaints");

  if (!totalElement && !inProgressElement && !resolvedElement) return;

  try {
    const complaints = await getVisibleComplaints();

    const total = complaints.length;
    const inProgress = complaints.filter((complaint) => complaint.status === "In Progress").length;
    const resolved = complaints.filter((complaint) => complaint.status === "Resolved").length;

    if (totalElement) totalElement.textContent = total;
    if (inProgressElement) inProgressElement.textContent = inProgress;
    if (resolvedElement) resolvedElement.textContent = resolved;
  } catch (error) {
    console.error(error.message);
  }
}

async function loadComplaintHistory() {
  const historyList = document.getElementById("historyList");
  const statusFilter = document.getElementById("statusFilter");

  if (!historyList) return;

  try {
    const complaints = await getVisibleComplaints();
    const selectedStatus = statusFilter ? statusFilter.value : "All";

    const filteredComplaints = selectedStatus === "All"
      ? complaints
      : complaints.filter((complaint) => complaint.status === selectedStatus);

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

    filteredComplaints.slice().reverse().forEach(function (complaint) {
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

        <p class="complaint-description">${complaint.description}</p>

        <div class="complaint-response">
          <strong>Department Response:</strong>
          <p>${responseText}</p>
        </div>
      `;

      historyList.appendChild(card);
    });
  } catch (error) {
    historyList.innerHTML = `<div class="empty-history"><h3>${error.message}</h3></div>`;
  }
}

function updateHistorySummary(complaints) {
  const totalElement = document.getElementById("historyTotal");
  const inProgressElement = document.getElementById("historyInProgress");
  const resolvedElement = document.getElementById("historyResolved");

  const total = complaints.length;
  const inProgress = complaints.filter((complaint) => complaint.status === "In Progress").length;
  const resolved = complaints.filter((complaint) => complaint.status === "Resolved").length;

  if (totalElement) totalElement.textContent = total;
  if (inProgressElement) inProgressElement.textContent = inProgress;
  if (resolvedElement) resolvedElement.textContent = resolved;
}

async function loadStaffDashboard() {
  const staffList = document.getElementById("staffComplaintsList");
  if (!staffList) return;

  const user = requireLogin();
  if (!user) return;

  if (user.role !== "staff") {
    staffList.innerHTML = `<div class="empty-history"><h3>Access denied</h3><p>This page is only for department staff.</p></div>`;
    return;
  }

  try {
    const complaints = await getVisibleComplaints();

    showText("staffTotalComplaints", complaints.length);
    showText("staffUnderReview", complaints.filter((c) => c.status === "Under Review").length);
    showText("staffInProgress", complaints.filter((c) => c.status === "In Progress").length);
    showText("staffResolved", complaints.filter((c) => c.status === "Resolved").length);

    if (complaints.length === 0) {
      staffList.innerHTML = `<div class="empty-history"><h3>No assigned complaints found</h3></div>`;
      return;
    }

    staffList.innerHTML = "";

    complaints.slice().reverse().forEach(function (complaint) {
      const card = document.createElement("div");
      card.className = "complaint-card staff-complaint-card";

      card.innerHTML = `
        <div class="complaint-card-header">
          <div>
            <h3>${complaint.title}</h3>
            <p class="complaint-date">Submitted by ${complaint.userEmail} on ${complaint.date}</p>
          </div>
          <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span>
        </div>

        <div class="complaint-meta">
          <div class="meta-item"><span>Category</span><strong>${complaint.category}</strong></div>
          <div class="meta-item"><span>Urgency</span><strong>${complaint.urgency}</strong></div>
          <div class="meta-item"><span>Department</span><strong>${complaint.department}</strong></div>
        </div>

        <p class="complaint-description">${complaint.description}</p>

        <div class="staff-update-box">
          <label>Status</label>
          <select id="status-${complaint.id}">
            <option value="Under Review" ${complaint.status === "Under Review" ? "selected" : ""}>Under Review</option>
            <option value="In Progress" ${complaint.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Resolved" ${complaint.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>

          <label>Department Response</label>
          <textarea id="response-${complaint.id}" placeholder="Write response here...">${complaint.response || ""}</textarea>

          <button class="primary-btn" onclick="updateComplaintByStaff(${complaint.id})">Save Update</button>
        </div>
      `;

      staffList.appendChild(card);
    });
  } catch (error) {
    staffList.innerHTML = `<div class="empty-history"><h3>${error.message}</h3></div>`;
  }
}

async function updateComplaintByStaff(id) {
  const status = document.getElementById(`status-${id}`).value;
  const response = document.getElementById(`response-${id}`).value;

  try {
    await apiRequest(`/api/complaints/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, response })
    });

    alert("Complaint updated successfully.");
    loadStaffDashboard();
  } catch (error) {
    alert(error.message);
  }
}

function renderStats(containerId, stats) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const entries = Object.entries(stats || {});

  if (entries.length === 0) {
    container.innerHTML = `<p class="section-subtitle">No data available.</p>`;
    return;
  }

  container.innerHTML = entries
    .map(([name, count]) => `
      <div class="status-row">
        <span>${name}</span>
        <strong>${count}</strong>
      </div>
    `)
    .join("");
}

function fillFilter(selectId, values, label) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value || "All";
  select.innerHTML = `<option value="All">${label}</option>`;

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  select.value = values.includes(currentValue) ? currentValue : "All";
}

async function loadAdminDashboard() {
  const tableBody = document.getElementById("adminComplaintsTable");
  if (!tableBody) return;

  const user = requireLogin();
  if (!user) return;

  if (user.role !== "admin") {
    tableBody.innerHTML = `<tr><td colspan="6">Access denied.</td></tr>`;
    return;
  }

  try {
    const complaints = await apiRequest("/api/complaints?role=admin");
    const report = await apiRequest("/api/reports");

    showText("adminTotalComplaints", complaints.length);
    showText("adminUnderReview", complaints.filter((c) => c.status === "Under Review").length);
    showText("adminInProgress", complaints.filter((c) => c.status === "In Progress").length);
    showText("adminResolved", complaints.filter((c) => c.status === "Resolved").length);
    showText("adminUrgent", complaints.filter((c) => c.urgency === "Urgent" || c.urgency === "Very Urgent").length);

    renderStats("adminCategoryStats", report.byCategory);
    renderStats("adminDepartmentStats", report.byDepartment);

    const categories = [...new Set(complaints.map((c) => c.category))];
    const departments = [...new Set(complaints.map((c) => c.department))];

    fillFilter("adminCategoryFilter", categories, "All Categories");
    fillFilter("adminDepartmentFilter", departments, "All Colleges");

    const selectedCategory = document.getElementById("adminCategoryFilter")?.value || "All";
    const selectedDepartment = document.getElementById("adminDepartmentFilter")?.value || "All";

    const filtered = complaints.filter((complaint) => {
      const categoryMatch = selectedCategory === "All" || complaint.category === selectedCategory;
      const departmentMatch = selectedDepartment === "All" || complaint.department === selectedDepartment;
      return categoryMatch && departmentMatch;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6">No complaints found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered
      .slice()
      .reverse()
      .map((complaint) => `
        <tr>
          <td>${complaint.title}</td>
          <td>${complaint.category}</td>
          <td>${complaint.department}</td>
          <td>${complaint.urgency}</td>
          <td>${complaint.status}</td>
          <td>${complaint.date}</td>
        </tr>
      `)
      .join("");
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
  }
}

window.addEventListener("DOMContentLoaded", function () {
  const user = requireLogin();

  const userEmailText = document.getElementById("userEmailText");
  const welcomeName = document.getElementById("welcomeName");
  const navUserName = document.getElementById("navUserName");

  if (userEmailText && user) userEmailText.textContent = user.email;
  if (welcomeName && user) welcomeName.textContent = "Welcome back, " + user.name;
  if (navUserName && user) navUserName.textContent = user.name;

  loadDashboardOverview();
  loadComplaintHistory();
  loadStaffDashboard();
  loadAdminDashboard();
});
