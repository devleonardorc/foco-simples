const storageKey = "foco-simples-tarefas";
const themeKey = "foco-simples-tema";

const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskCategory = document.querySelector("#taskCategory");
const taskDate = document.querySelector("#taskDate");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const taskTemplate = document.querySelector("#taskTemplate");
const filterButtons = document.querySelectorAll(".filter-button");
const themeToggle = document.querySelector("#themeToggle");

const totalCount = document.querySelector("#totalCount");
const doneCount = document.querySelector("#doneCount");
const lateCount = document.querySelector("#lateCount");
const progressText = document.querySelector("#progressText");
const progressFill = document.querySelector("#progressFill");
const progressHint = document.querySelector("#progressHint");

let tasks = loadTasks();
let currentFilter = "all";

setInitialDate();
loadTheme();
render();

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskTitle.value.trim();

  if (!title) {
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    category: taskCategory.value,
    dueDate: taskDate.value,
    done: false,
    createdAt: new Date().toISOString()
  });

  taskForm.reset();
  setInitialDate();
  saveTasks();
  render();
  taskTitle.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    render();
  });
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(themeKey, document.body.classList.contains("dark") ? "dark" : "light");
});

function render() {
  taskList.innerHTML = "";

  const visibleTasks = tasks.filter(matchesCurrentFilter);

  visibleTasks.forEach((task) => {
    const taskElement = taskTemplate.content.firstElementChild.cloneNode(true);
    const title = taskElement.querySelector("h3");
    const category = taskElement.querySelector(".category-pill");
    const meta = taskElement.querySelector(".task-meta");
    const checkButton = taskElement.querySelector(".check-button");
    const deleteButton = taskElement.querySelector(".delete-button");

    title.textContent = task.title;
    category.textContent = task.category;
    meta.textContent = getDateLabel(task.dueDate, task.done);
    taskElement.classList.toggle("done", task.done);
    taskElement.classList.toggle("late", isLate(task) && !task.done);

    checkButton.addEventListener("click", () => toggleTask(task.id));
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(taskElement);
  });

  emptyState.classList.toggle("visible", visibleTasks.length === 0);
  updateStats();
}

function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id !== id) {
      return task;
    }

    return { ...task, done: !task.done };
  });

  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function updateStats() {
  const doneTasks = tasks.filter((task) => task.done).length;
  const lateTasks = tasks.filter((task) => isLate(task) && !task.done).length;
  const progress = tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100);

  totalCount.textContent = tasks.length;
  doneCount.textContent = doneTasks;
  lateCount.textContent = lateTasks;
  progressText.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;

  if (tasks.length === 0) {
    progressHint.textContent = "Adicione sua primeira tarefa para começar.";
  } else if (progress === 100) {
    progressHint.textContent = "Todas as tarefas foram concluídas.";
  } else {
    progressHint.textContent = `${tasks.length - doneTasks} tarefa(s) ainda precisam de atenção.`;
  }
}

function matchesCurrentFilter(task) {
  if (currentFilter === "done") {
    return task.done;
  }

  if (currentFilter === "open") {
    return !task.done;
  }

  if (currentFilter === "today") {
    return task.dueDate === getToday();
  }

  if (currentFilter === "week") {
    return isThisWeek(task.dueDate);
  }

  return true;
}

function getDateLabel(dateString, done) {
  const date = toLocalDate(dateString);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);

  if (done) {
    return `Concluída - prazo era ${formatted}`;
  }

  if (dateString === getToday()) {
    return `Prazo hoje - ${formatted}`;
  }

  if (date < startOfToday()) {
    return `Atrasada - prazo era ${formatted}`;
  }

  return `Prazo em ${formatted}`;
}

function isLate(task) {
  return toLocalDate(task.dueDate) < startOfToday();
}

function isThisWeek(dateString) {
  const date = toLocalDate(dateString);
  const today = startOfToday();
  const end = new Date(today);

  end.setDate(today.getDate() + 6);

  return date >= today && date <= end;
}

function setInitialDate() {
  taskDate.value = getToday();
}

function getToday() {
  return startOfToday().toISOString().slice(0, 10);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = localStorage.getItem(storageKey);

  if (!savedTasks) {
    return [
      {
        id: crypto.randomUUID(),
        title: "Criar meu primeiro repositório no GitHub",
        category: "Estudo",
        dueDate: getToday(),
        done: false,
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Escrever um README explicando o projeto",
        category: "Estudo",
        dueDate: getToday(),
        done: false,
        createdAt: new Date().toISOString()
      }
    ];
  }

  return JSON.parse(savedTasks);
}

function loadTheme() {
  if (localStorage.getItem(themeKey) === "dark") {
    document.body.classList.add("dark");
  }
}
