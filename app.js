const STORAGE_KEYS = {
  USER: "skillAlignUser",
  ATTEMPTS: "skillAlignAttempts",
};

const topics = [
  {
    id: "qa_fundamentals",
    name: "QA Fundamentals",
    description: "Basic concepts, defect life cycle, and test levels.",
    questions: [
      {
        prompt: "What is the main goal of QA?",
        choices: [
          "Find all bugs",
          "Prevent defects and ensure quality",
          "Match development speed",
          "Write production code",
        ],
        answer: 1,
      },
      {
        prompt: "Which document maps requirements to test cases?",
        choices: [
          "Test plan",
          "Defect report",
          "Traceability matrix",
          "Release note",
        ],
        answer: 2,
      },
      {
        prompt: "What is a smoke test?",
        choices: [
          "Full regression",
          "Quick check of key flows after a build",
          "Performance test",
          "Security scan",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "test_design",
    name: "Test Design Techniques",
    description: "Equivalence partitioning, boundary value, and coverage.",
    questions: [
      {
        prompt: "Equivalence partitioning aims to:",
        choices: [
          "Test every input value",
          "Group inputs expected to behave the same",
          "Increase performance",
          "Find UI defects",
        ],
        answer: 1,
      },
      {
        prompt: "Boundary value analysis focuses on:",
        choices: [
          "Average values",
          "Values just inside/outside limits",
          "Random selection",
          "Code complexity",
        ],
        answer: 1,
      },
      {
        prompt: "Decision tables are best for:",
        choices: [
          "UI layout",
          "State-less inputs",
          "Complex business rules with combinations",
          "Performance profiling",
        ],
        answer: 2,
      },
    ],
  },
  {
    id: "automation_basics",
    name: "Automation Basics",
    description: "When and what to automate in testing.",
    questions: [
      {
        prompt: "A good candidate for automation is:",
        choices: [
          "Highly volatile UI copy",
          "Frequent regression scenario",
          "One-time migration",
          "Ad-hoc exploratory test",
        ],
        answer: 1,
      },
      {
        prompt: "Why avoid brittle locator strategies?",
        choices: [
          "They run faster",
          "They reduce test flakiness",
          "They improve security",
          "They improve UX",
        ],
        answer: 1,
      },
      {
        prompt: "CI integration helps by:",
        choices: [
          "Delaying feedback",
          "Providing immediate build-quality signals",
          "Reducing coverage",
          "Replacing manual testing fully",
        ],
        answer: 1,
      },
    ],
  },
];

const passThreshold = 70;
let currentUser = null;
let activeTopicId = null;

const el = {
  loginForm: document.getElementById("loginForm"),
  emailInput: document.getElementById("emailInput"),
  roleSelect: document.getElementById("roleSelect"),
  mainMenu: document.getElementById("mainMenu"),
  welcomeText: document.getElementById("welcomeText"),
  menuNote: document.getElementById("menuNote"),
  takeTestBtn: document.getElementById("takeTestBtn"),
  viewScoresBtn: document.getElementById("viewScoresBtn"),
  reportBtn: document.getElementById("reportBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  topicList: document.getElementById("topicList"),
  assessmentPanel: document.getElementById("assessmentPanel"),
  assessmentArea: document.getElementById("assessmentArea"),
  assessmentForm: document.getElementById("assessmentForm"),
  activeTopicTitle: document.getElementById("activeTopicTitle"),
  questionCount: document.getElementById("questionCount"),
  assessmentResult: document.getElementById("assessmentResult"),
  scoresPanel: document.getElementById("scoresPanel"),
  scoresTableWrap: document.getElementById("scoresTableWrap"),
  scoresEmpty: document.getElementById("scoresEmpty"),
  scoresTopicFilter: document.getElementById("scoresTopicFilter"),
  reportPanel: document.getElementById("reportPanel"),
  reportSummary: document.getElementById("reportSummary"),
  reportEmpty: document.getElementById("reportEmpty"),
};

function loadStoredUser() {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function persistUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
}

function loadAttempts() {
  const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function persistAttempts(attempts) {
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
}

function formatDate(ts) {
  return new Date(ts).toLocaleString();
}

function show(elm) {
  if (!elm) return;
  elm.hidden = false;
}

function hide(elm) {
  if (!elm) return;
  elm.hidden = true;
}

function setMenuAccess() {
  const isAdmin = currentUser?.role === "admin";
  el.welcomeText.textContent = currentUser
    ? `${currentUser.email} (${currentUser.role})`
    : "Welcome";

  el.viewScoresBtn.disabled = !isAdmin;
  el.reportBtn.disabled = !isAdmin;
  el.menuNote.textContent = isAdmin
    ? "Admin access granted: scores and reports available."
    : "Standard user: assessment available. Admins see scores and reports.";
}

function renderTopicList() {
  el.topicList.innerHTML = "";
  topics.forEach((topic) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill";
    btn.textContent = topic.name;
    btn.title = topic.description;
    btn.dataset.topicId = topic.id;
    btn.addEventListener("click", () => selectTopic(topic.id));
    el.topicList.appendChild(btn);
  });
}

function selectTopic(topicId) {
  activeTopicId = topicId;
  document
    .querySelectorAll(".pill")
    .forEach((pill) => pill.classList.toggle("active", pill.dataset.topicId === topicId));
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) return;
  el.activeTopicTitle.textContent = `${topic.name}`;
  el.questionCount.textContent = `${topic.questions.length} questions`;
  renderQuestions(topic);
  show(el.assessmentArea);
  hide(el.assessmentResult);
  clearMessage();
}

function renderQuestions(topic) {
  el.assessmentForm.innerHTML = "";
  topic.questions.forEach((q, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "question";
    const title = document.createElement("div");
    title.className = "question__title";
    title.textContent = `${idx + 1}. ${q.prompt}`;
    const choices = document.createElement("div");
    choices.className = "choices";

    q.choices.forEach((choice, cIdx) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q-${idx}`;
      input.value = String(cIdx);
      input.required = true;
      label.appendChild(input);
      label.append(` ${choice}`);
      choices.appendChild(label);
    });

    wrapper.appendChild(title);
    wrapper.appendChild(choices);
    el.assessmentForm.appendChild(wrapper);
  });
}

function computeScore(topic) {
  let correct = 0;
  topic.questions.forEach((q, idx) => {
    const selected = el.assessmentForm.querySelector(`input[name="q-${idx}"]:checked`);
    const val = selected ? Number(selected.value) : null;
    if (val === q.answer) correct += 1;
  });
  const total = topic.questions.length;
  const percent = Math.round((correct / total) * 100);
  return { correct, total, percent };
}

function sendResultEmail(email, topicName, percent) {
  // Stub: replace with SMTP/API (e.g., SendGrid, SES) when ready.
  console.info("[Email stub] Would send results", { email, topicName, percent });
}

function handleAssessmentSubmit(evt) {
  evt.preventDefault();
  const topic = topics.find((t) => t.id === activeTopicId);
  if (!topic) {
    showMessage("Please select a topic first.");
    return;
  }
  if (!currentUser) {
    showMessage("Please log in before taking the assessment.");
    return;
  }
  const { correct, total, percent } = computeScore(topic);
  const attempts = loadAttempts();
  const entry = {
    email: currentUser.email,
    role: currentUser.role,
    topicId: topic.id,
    topicName: topic.name,
    correct,
    total,
    percent,
    passed: percent >= passThreshold,
    timestamp: Date.now(),
  };
  attempts.push(entry);
  persistAttempts(attempts);
  sendResultEmail(currentUser.email, topic.name, percent);

  el.assessmentResult.innerHTML = `
    <strong>Score:</strong> ${percent}% (${correct}/${total}) — ${
      entry.passed ? "Passed" : "Keep practicing"
    }`;
  show(el.assessmentResult);
  clearMessage();
  refreshScoresView();
  refreshReportView();
}

function showMessage(text) {
  const errorEl = document.getElementById("assessmentError");
  if (!errorEl) return;
  errorEl.textContent = text;
  errorEl.hidden = false;
}

function clearMessage() {
  const errorEl = document.getElementById("assessmentError");
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.hidden = true;
}

function refreshScoresView() {
  const attempts = loadAttempts();
  const topicFilter = el.scoresTopicFilter.value || "all";
  const filtered =
    topicFilter === "all" ? attempts : attempts.filter((a) => a.topicId === topicFilter);

  el.scoresTableWrap.innerHTML = "";
  if (!filtered.length) {
    show(el.scoresEmpty);
    return;
  }
  hide(el.scoresEmpty);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Email</th>
      <th>Topic</th>
      <th>Score</th>
      <th>Status</th>
      <th>When</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  filtered
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((a) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${a.email}</td>
        <td>${a.topicName}</td>
        <td>${a.percent}% (${a.correct}/${a.total})</td>
        <td>${a.passed ? "Passed" : "Review"}</td>
        <td>${formatDate(a.timestamp)}</td>
      `;
      tbody.appendChild(row);
    });
  table.appendChild(tbody);
  el.scoresTableWrap.appendChild(table);
}

function refreshReportView() {
  const attempts = loadAttempts();
  el.reportSummary.innerHTML = "";
  if (!attempts.length) {
    show(el.reportEmpty);
    return;
  }
  hide(el.reportEmpty);

  topics.forEach((topic) => {
    const rows = attempts.filter((a) => a.topicId === topic.id);
    const total = rows.length;
    const passed = rows.filter((r) => r.passed).length;
    const passRate = total ? Math.round((passed / total) * 100) : 0;
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <div class="row-between">
        <div>
          <p class="muted small">${topic.name}</p>
          <div class="stat">${passRate}% pass rate</div>
        </div>
        <span class="tag">${total} attempt${total === 1 ? "" : "s"}</span>
      </div>
      <p class="muted small">Passed: ${passed} | Eligible threshold: ${passThreshold}%</p>
    `;
    el.reportSummary.appendChild(card);
  });
}

function populateFilters() {
  el.scoresTopicFilter.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "All topics";
  el.scoresTopicFilter.appendChild(allOpt);
  topics.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    el.scoresTopicFilter.appendChild(opt);
  });
}

function showPanel(panelId) {
  [el.assessmentPanel, el.scoresPanel, el.reportPanel].forEach((panel) => hide(panel));
  const target = document.getElementById(panelId);
  if (target) show(target);
}

function resetPanels() {
  hide(el.assessmentPanel);
  hide(el.scoresPanel);
  hide(el.reportPanel);
}

function handleLogin(evt) {
  evt.preventDefault();
  const email = el.emailInput.value.trim();
  const role = el.roleSelect.value;
  if (!email || !role) return;
  currentUser = { email, role };
  persistUser(currentUser);
  hide(document.getElementById("loginSection"));
  show(el.mainMenu);
  setMenuAccess();
}

function handleLogout() {
  currentUser = null;
  clearUser();
  resetPanels();
  hide(el.mainMenu);
  show(document.getElementById("loginSection"));
}

function initEvents() {
  el.loginForm.addEventListener("submit", handleLogin);
  el.logoutBtn.addEventListener("click", handleLogout);
  el.takeTestBtn.addEventListener("click", () => {
    showPanel("assessmentPanel");
  });
  el.viewScoresBtn.addEventListener("click", () => {
    if (currentUser?.role !== "admin") return;
    showPanel("scoresPanel");
    refreshScoresView();
  });
  el.reportBtn.addEventListener("click", () => {
    if (currentUser?.role !== "admin") return;
    showPanel("reportPanel");
    refreshReportView();
  });
  el.assessmentForm.addEventListener("submit", handleAssessmentSubmit);
  el.scoresTopicFilter.addEventListener("change", refreshScoresView);
  document.querySelectorAll("[data-close-panel]").forEach((btn) => {
    btn.addEventListener("click", () => resetPanels());
  });
}

function hydrateFromStorage() {
  const storedUser = loadStoredUser();
  if (storedUser) {
    currentUser = storedUser;
    el.emailInput.value = storedUser.email;
    el.roleSelect.value = storedUser.role;
    hide(document.getElementById("loginSection"));
    show(el.mainMenu);
    setMenuAccess();
  }
}

function init() {
  renderTopicList();
  populateFilters();
  initEvents();
  hydrateFromStorage();
}

document.addEventListener("DOMContentLoaded", init);

