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

function goToDashboard() {
  window.location.href = "dashboard.html";
}

function goToLogin() {
  window.location.href = "index.html";
}

function logout() {
  localStorage.removeItem("wethaqUserEmail");
  localStorage.removeItem("wethaqUserName");
  localStorage.removeItem("wethaqUserRole");
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

  if (totalElement) totalElement.textContent = total;
  if (inProgressElement) inProgressElement.textContent = inProgress;
  if (resolvedElement) resolvedElement.textContent = resolved;
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

  const resultCategory = document.getElementById("resultCategory");
  const resultUrgency = document.getElementById("resultUrgency");
  const resultDepartment = document.getElementById("resultDepartment");
  const resultStatus = document.getElementById("resultStatus");
  const suggestionsList = document.getElementById("suggestionsList");
  const modalCategory = document.getElementById("modalCategory");
  const modalStatus = document.getElementById("modalStatus");
  const successModal = document.getElementById("successModal");
  const resultCard = document.getElementById("resultCard");

  if (resultCategory) resultCategory.textContent = complaint.category;
  if (resultUrgency) resultUrgency.textContent = complaint.urgency;
  if (resultDepartment) resultDepartment.textContent = complaint.department;
  if (resultStatus) resultStatus.textContent = complaint.status;

  if (suggestionsList) {
    suggestionsList.innerHTML = "";

    complaint.suggestions.forEach(function (suggestion) {
      const li = document.createElement("li");
      li.textContent = suggestion;
      suggestionsList.appendChild(li);
    });
  }

  if (modalCategory) modalCategory.textContent = complaint.category;
  if (modalStatus) modalStatus.textContent = complaint.status;
  if (successModal) successModal.classList.remove("hidden");

  if (resultCard) {
    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  document.getElementById("complaintTitle").value = "";
  document.getElementById("complaintDescription").value = "";
}

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

  const filteredComplaints =
    selectedStatus === "All"
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

  filteredComplaints.slice().reverse().forEach(function (complaint) {
    const responseText =
      complaint.response && complaint.response.trim() !== ""
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

  const accountModal = document.getElementById("accountModal");
  if (accountModal) accountModal.classList.remove("hidden");
}

/* ===== Department Staff Dashboard ===== */

function loadStaffComplaints() {
  const staffList = document.getElementById("staffComplaintsList");

  if (!staffList) return;

  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

  updateStaffOverview(complaints);

  if (complaints.length === 0) {
    staffList.innerHTML = `
      <div class="empty-history">
        <h3>No complaints assigned yet</h3>
        <p>Complaints submitted by students or faculty members will appear here.</p>
      </div>
    `;
    return;
  }

  staffList.innerHTML = "";

  complaints.slice().reverse().forEach(function (complaint) {
    const originalIndex = complaints.findIndex(function (item) {
      return item.id === complaint.id;
    });

    const responseText = complaint.response || "";

    const card = document.createElement("div");
    card.className = "staff-complaint-card";

    card.innerHTML = `
      <div class="staff-card-header">
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

      <div class="staff-update-box">
        <div class="input-group">
          <label>Status</label>
          <select id="status-${complaint.id}">
            <option value="Under Review" ${complaint.status === "Under Review" ? "selected" : ""}>Under Review</option>
            <option value="In Progress" ${complaint.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Resolved" ${complaint.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </div>

        <div class="input-group">
          <label>Department Response</label>
          <textarea id="response-${complaint.id}" placeholder="Write department response here...">${responseText}</textarea>
        </div>

        <button class="primary-btn" onclick="saveStaffUpdate(${originalIndex}, ${complaint.id})">
          Save Update
        </button>
      </div>
    `;

    staffList.appendChild(card);
  });
}

function updateStaffOverview(complaints) {
  const totalElement = document.getElementById("staffTotalComplaints");
  const underReviewElement = document.getElementById("staffUnderReview");
  const inProgressElement = document.getElementById("staffInProgress");
  const resolvedElement = document.getElementById("staffResolved");

  const total = complaints.length;

  const underReview = complaints.filter(function (complaint) {
    return complaint.status === "Under Review";
  }).length;

  const inProgress = complaints.filter(function (complaint) {
    return complaint.status === "In Progress";
  }).length;

  const resolved = complaints.filter(function (complaint) {
    return complaint.status === "Resolved";
  }).length;

  if (totalElement) totalElement.textContent = total;
  if (underReviewElement) underReviewElement.textContent = underReview;
  if (inProgressElement) inProgressElement.textContent = inProgress;
  if (resolvedElement) resolvedElement.textContent = resolved;
}

function saveStaffUpdate(index, complaintId) {
  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

  const statusInput = document.getElementById("status-" + complaintId);
  const responseInput = document.getElementById("response-" + complaintId);

  if (!statusInput || !responseInput) return;

  complaints[index].status = statusInput.value;
  complaints[index].response = responseInput.value.trim();

  localStorage.setItem("complaints", JSON.stringify(complaints));

  alert("Complaint update saved successfully.");

  loadStaffComplaints();
}

/* ===== Admin Dashboard ===== */

function loadAdminDashboard() {
  const adminTableBody = document.getElementById("adminComplaintsTable");
  const categoryFilter = document.getElementById("adminCategoryFilter");
  const departmentFilter = document.getElementById("adminDepartmentFilter");

  if (!adminTableBody) return;

  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

  updateAdminOverview(complaints);
  updateAdminCategoryStats(complaints);
  updateAdminDepartmentStats(complaints);
  fillAdminFilters(complaints);

  const selectedCategory = categoryFilter ? categoryFilter.value : "All";
  const selectedDepartment = departmentFilter ? departmentFilter.value : "All";

  const filteredComplaints = complaints.filter(function (complaint) {
    const categoryMatch =
      selectedCategory === "All" || complaint.category === selectedCategory;

    const departmentMatch =
      selectedDepartment === "All" || complaint.department === selectedDepartment;

    return categoryMatch && departmentMatch;
  });

  if (filteredComplaints.length === 0) {
    adminTableBody.innerHTML = `
      <tr>
        <td colspan="6">No complaints found.</td>
      </tr>
    `;
    return;
  }

  adminTableBody.innerHTML = "";

  filteredComplaints.slice().reverse().forEach(function (complaint) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${complaint.title}</td>
      <td>${complaint.category}</td>
      <td>${complaint.department}</td>
      <td>${complaint.urgency}</td>
      <td>
        <span class="status-badge ${getStatusClass(complaint.status)}">
          ${complaint.status}
        </span>
      </td>
      <td>${complaint.date}</td>
    `;

    adminTableBody.appendChild(row);
  });
}

function updateAdminOverview(complaints) {
  const totalElement = document.getElementById("adminTotalComplaints");
  const underReviewElement = document.getElementById("adminUnderReview");
  const inProgressElement = document.getElementById("adminInProgress");
  const resolvedElement = document.getElementById("adminResolved");
  const urgentElement = document.getElementById("adminUrgent");

  const total = complaints.length;

  const underReview = complaints.filter(function (complaint) {
    return complaint.status === "Under Review";
  }).length;

  const inProgress = complaints.filter(function (complaint) {
    return complaint.status === "In Progress";
  }).length;

  const resolved = complaints.filter(function (complaint) {
    return complaint.status === "Resolved";
  }).length;

  const urgent = complaints.filter(function (complaint) {
    return complaint.urgency === "Urgent" || complaint.urgency === "Very Urgent";
  }).length;

  if (totalElement) totalElement.textContent = total;
  if (underReviewElement) underReviewElement.textContent = underReview;
  if (inProgressElement) inProgressElement.textContent = inProgress;
  if (resolvedElement) resolvedElement.textContent = resolved;
  if (urgentElement) urgentElement.textContent = urgent;
}

function countByField(complaints, fieldName) {
  const counts = {};

  complaints.forEach(function (complaint) {
    const value = complaint[fieldName] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
  });

  return counts;
}

function updateAdminCategoryStats(complaints) {
  const categoryList = document.getElementById("adminCategoryStats");

  if (!categoryList) return;

  const categories = [
    "Academic",
    "Facilities",
    "Financial",
    "Technical",
    "Administrative",
    "Default Category"
  ];

  const counts = countByField(complaints, "category");

  categoryList.innerHTML = "";

  categories.forEach(function (category) {
    const item = document.createElement("div");
    item.className = "admin-stat-row";

    item.innerHTML = `
      <span>${category}</span>
      <strong>${counts[category] || 0}</strong>
    `;

    categoryList.appendChild(item);
  });
}

function updateAdminDepartmentStats(complaints) {
  const departmentList = document.getElementById("adminDepartmentStats");

  if (!departmentList) return;

  const counts = countByField(complaints, "department");
  const departments = Object.keys(counts);

  departmentList.innerHTML = "";

  if (departments.length === 0) {
    departmentList.innerHTML = `
      <div class="admin-stat-row">
        <span>No departments yet</span>
        <strong>0</strong>
      </div>
    `;
    return;
  }

  departments.forEach(function (department) {
    const item = document.createElement("div");
    item.className = "admin-stat-row";

    item.innerHTML = `
      <span>${department}</span>
      <strong>${counts[department]}</strong>
    `;

    departmentList.appendChild(item);
  });
}

function fillAdminFilters(complaints) {
  const categoryFilter = document.getElementById("adminCategoryFilter");
  const departmentFilter = document.getElementById("adminDepartmentFilter");

  if (!categoryFilter || !departmentFilter) return;

  const currentCategory = categoryFilter.value || "All";
  const currentDepartment = departmentFilter.value || "All";

  const categories = [
    ...new Set(
      complaints.map(function (complaint) {
        return complaint.category;
      })
    )
  ];

  const departments = [
    ...new Set(
      complaints.map(function (complaint) {
        return complaint.department;
      })
    )
  ];

  categoryFilter.innerHTML = `<option value="All">All Categories</option>`;
  departmentFilter.innerHTML = `<option value="All">All Departments</option>`;

  categories.forEach(function (category) {
    categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
  });

  departments.forEach(function (department) {
    departmentFilter.innerHTML += `<option value="${department}">${department}</option>`;
  });

  categoryFilter.value = currentCategory;
  departmentFilter.value = currentDepartment;
}

/* ===== Page Loader ===== */

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
  loadComplaintHistory();
  loadStaffComplaints();
  loadAdminDashboard();
});