const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OpenAI = require("openai");

const app = express();
const PORT = 5000;
const DATABASE_PATH = path.join(__dirname, "database.json");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "..")));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function createInitialDatabase() {
  return {
    users: [],
    complaints: [],
    authorizedUsers: [
      {
        email: "staff1@ksu.edu.sa",
        role: "staff",
        name: "Department Staff",
        department: "Facilities Department"
      },
      {
        email: "staff2@ksu.edu.sa",
        role: "staff",
        name: "IT Staff",
        department: "IT Department"
      },
      {
        email: "admin1@ksu.edu.sa",
        role: "admin",
        name: "University Administrator",
        department: "Administration"
      }
    ],
    logs: []
  };
}

function readDatabase() {
  if (!fs.existsSync(DATABASE_PATH)) {
    writeDatabase(createInitialDatabase());
  }

  const rawData = fs.readFileSync(DATABASE_PATH, "utf8");
  return JSON.parse(rawData);
}

function writeDatabase(data) {
  fs.writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2));
}

function addLog(data, action, details) {
  data.logs.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    action,
    details,
    date: new Date().toISOString()
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isOfficialUniversityEmail(email) {
  return email.endsWith("@student.ksu.edu.sa") || email.endsWith("@ksu.edu.sa");
}

function classifyComplaint(description) {
  const text = String(description || "").toLowerCase();

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
  } else if (text.includes("urgent") || text.includes("unsafe") || text.includes("immediately")) {
    urgency = "Urgent";
  }

  const suggestions = manualReviewRequired
    ? ["No suggestions available"]
    : [
        "Attach a supporting document or image if available.",
        "Provide the exact location, course, or related details.",
        "Track the complaint status from Complaint History."
      ];

  return {
    category,
    department,
    urgency,
    manualReviewRequired,
    suggestions
  };
}

function removePassword(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend and database are working!" });
});

app.get("/api/authorized-users", (req, res) => {
  const data = readDatabase();
  res.json(data.authorizedUsers);
});

app.post("/api/register", (req, res) => {
  try {
    const data = readDatabase();
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "").trim();
    const role = String(req.body.role || "").trim();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!isOfficialUniversityEmail(email)) {
      return res.status(403).json({ error: "Please use an official university email." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    if (!["student", "faculty", "staff", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role selected." });
    }

    const emailExists = data.users.some((user) => user.email === email);
    if (emailExists) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    let department = "";

    if (role === "staff" || role === "admin") {
      const authorized = data.authorizedUsers.find(
        (user) => user.email === email && user.role === role
      );

      if (!authorized) {
        return res.status(403).json({
          error: "You are not authorized to register with this role."
        });
      }

      department = authorized.department || "";
    }

    if (role === "student" && !email.endsWith("@student.ksu.edu.sa")) {
      return res.status(403).json({
        error: "Students must use a student university email."
      });
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role,
      department,
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    addLog(data, "CREATE_ACCOUNT", `${email} registered as ${role}`);
    writeDatabase(data);

    res.status(201).json({ user: removePassword(newUser) });
  } catch (error) {
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/login", (req, res) => {
  try {
    const data = readDatabase();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "").trim();

    const matchedUser = data.users.find(
      (user) => user.email === email && user.password === password
    );

    if (!matchedUser) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    addLog(data, "LOGIN", `${email} logged in`);
    writeDatabase(data);

    res.json({ user: removePassword(matchedUser) });
  } catch (error) {
    res.status(500).json({ error: "Could not log in." });
  }
});

app.post("/api/complaints", (req, res) => {
  try {
    const data = readDatabase();
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const userEmail = normalizeEmail(req.body.userEmail);
    const userName = String(req.body.userName || "").trim();

    if (!title || !description || !userEmail) {
      return res.status(400).json({ error: "Title, description, and user email are required." });
    }

    const userExists = data.users.some((user) => user.email === userEmail);
    if (!userExists) {
      return res.status(403).json({ error: "User must be registered before submitting complaints." });
    }

    const aiResult = classifyComplaint(description);

    const complaint = {
      id: Date.now(),
      userEmail,
      userName,
      title,
      description,
      category: aiResult.category,
      urgency: aiResult.urgency,
      department: aiResult.department,
      status: "Under Review",
      response: "",
      manualReviewRequired: aiResult.manualReviewRequired,
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      suggestions: aiResult.suggestions
    };

    data.complaints.push(complaint);
    addLog(data, "SUBMIT_COMPLAINT", `${userEmail} submitted complaint ${complaint.id}`);
    writeDatabase(data);

    res.status(201).json({ complaint });
  } catch (error) {
    res.status(500).json({ error: "Could not submit complaint." });
  }
});

app.get("/api/complaints", (req, res) => {
  try {
    const data = readDatabase();
    const role = String(req.query.role || "").trim();
    const userEmail = normalizeEmail(req.query.userEmail);
    const department = String(req.query.department || "").trim();

    let complaints = data.complaints;

    if (role === "student" || role === "faculty") {
      complaints = complaints.filter((complaint) => complaint.userEmail === userEmail);
    } else if (role === "staff" && department) {
      complaints = complaints.filter(
        (complaint) => complaint.department === department || complaint.department === "Manual Review"
      );
    }

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: "Could not read complaints." });
  }
});

app.put("/api/complaints/:id", (req, res) => {
  try {
    const data = readDatabase();
    const id = Number(req.params.id);
    const complaint = data.complaints.find((item) => item.id === id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const allowedStatuses = ["Under Review", "In Progress", "Resolved"];
    const nextStatus = req.body.status;
    const nextResponse = req.body.response;

    if (nextStatus && !allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ error: "Invalid complaint status." });
    }

    if (nextStatus) complaint.status = nextStatus;
    if (typeof nextResponse === "string") complaint.response = nextResponse.trim();

    complaint.updatedAt = new Date().toISOString();

    addLog(data, "UPDATE_COMPLAINT", `Complaint ${id} updated`);
    writeDatabase(data);

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: "Could not update complaint." });
  }
});

app.delete("/api/complaints/:id", (req, res) => {
  try {
    const data = readDatabase();
    const id = Number(req.params.id);
    const index = data.complaints.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    if (data.complaints[index].status !== "Under Review") {
      return res.status(403).json({
        error: "Only complaints under review can be deleted."
      });
    }

    data.complaints.splice(index, 1);
    addLog(data, "DELETE_COMPLAINT", `Complaint ${id} deleted`);
    writeDatabase(data);

    res.json({ message: "Complaint deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Could not delete complaint." });
  }
});

app.get("/api/reports", (req, res) => {
  try {
    const data = readDatabase();
    const complaints = data.complaints;

    const byCategory = {};
    const byDepartment = {};
    const byStatus = {};

    complaints.forEach((complaint) => {
      byCategory[complaint.category] = (byCategory[complaint.category] || 0) + 1;
      byDepartment[complaint.department] = (byDepartment[complaint.department] || 0) + 1;
      byStatus[complaint.status] = (byStatus[complaint.status] || 0) + 1;
    });

    res.json({
      total: complaints.length,
      urgent: complaints.filter(
        (complaint) => complaint.urgency === "Urgent" || complaint.urgency === "Very Urgent"
      ).length,
      byCategory,
      byDepartment,
      byStatus
    });
  } catch (error) {
    res.status(500).json({ error: "Could not generate reports." });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim() === "") {
      return res.status(400).json({ error: "Complaint description is required." });
    }

    if (!client) {
      return res.json({
        rewrittenText:
          "I would like to formally report the following issue: " +
          description.trim() +
          " I kindly request that the responsible department reviews this complaint and takes the necessary action as soon as possible."
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Rewrite university complaints professionally, clearly, and politely. Keep the original meaning. Do not add new facts. Only return the rewritten complaint."
        },
        {
          role: "user",
          content: description
        }
      ]
    });

    res.json({ rewrittenText: response.choices[0].message.content });
  } catch (error) {
    console.error("OPENAI ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  readDatabase();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database file: ${DATABASE_PATH}`);
});
