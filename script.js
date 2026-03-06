document.addEventListener("DOMContentLoaded", () => {
  const hero = document.getElementById("hero");
  const root = document.documentElement;

  if (hero) {
    setTimeout(() => {
      hero.classList.add("hero--visible");
    }, 150);

    // Анимация фона в зависимости от положения курсора
    window.addEventListener("mousemove", (event) => {
      const xPercent = (event.clientX / window.innerWidth) * 100;
      const yPercent = (event.clientY / window.innerHeight) * 100;

      root.style.setProperty("--cursor-x", `${xPercent}%`);
      root.style.setProperty("--cursor-y", `${yPercent}%`);
    });
  }

  // ===== Блок "Мои навыки" =====
  const STORAGE_KEY = "mySkills";
  const SKILLS_INDEX_STORAGE_KEY = "skillsIndexValues";

  const skillsGrid = document.getElementById("skills-grid");
  const addSkillBtn = document.getElementById("add-skill-btn");
  const heroCta = document.querySelector(".hero__cta");
  const skillsSection = document.getElementById("skills");
  const skillsIndexSection = document.getElementById("skills-index");
  const skillsIndexSliders = document.querySelectorAll(".skills-index__slider");
  const skillsIndexAverageText = document.getElementById("skills-index-average-text");
  const skillsIndexGaugeBar = document.getElementById("skills-index-gauge-bar");
  const skillsIndexDescription = document.getElementById("skills-index-description");

  function loadSkills() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((skill) => ({
        title: typeof skill?.title === "string" ? skill.title : "",
        description: typeof skill?.description === "string" ? skill.description : "",
        learned: Boolean(skill?.learned),
      }));
    } catch {
      return [];
    }
  }

  function saveSkills(skills) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  }

  function loadSkillsIndexValues() {
    const raw = localStorage.getItem(SKILLS_INDEX_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveSkillsIndexValues(values) {
    localStorage.setItem(SKILLS_INDEX_STORAGE_KEY, JSON.stringify(values));
  }

  function createSkillElement(skill, index, { onDelete, onToggleLearned }) {
    const card = document.createElement("article");
    card.className = "skill-card";
    card.dataset.index = String(index);
    card.setAttribute("tabindex", "0");

    if (skill.learned) {
      card.classList.add("is-learned");
    }

    const titleRow = document.createElement("div");
    titleRow.className = "skill-title-row";

    const title = document.createElement("h3");
    title.textContent = skill.title || "Без названия";

    const badge = document.createElement("span");
    badge.className = "skill-badge";
    badge.textContent = "Изучено";
    if (!skill.learned) {
      badge.setAttribute("aria-hidden", "true");
      badge.hidden = true;
    }

    const desc = document.createElement("p");
    desc.className = "skill-description";
    desc.textContent = skill.description || "Без описания";

    const actions = document.createElement("div");
    actions.className = "skill-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "skill-toggle";
    toggleBtn.textContent = skill.learned ? "Снять отметку" : "Отметить изученным";

    toggleBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onToggleLearned(index);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "skill-delete";
    deleteBtn.textContent = "Удалить";

    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const ok = confirm(`Удалить навык «${title.textContent}»?`);
      if (!ok) return;
      onDelete(index);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);

    titleRow.appendChild(title);
    titleRow.appendChild(badge);

    card.appendChild(titleRow);
    card.appendChild(desc);
    card.appendChild(actions);

    const toggleExpanded = () => {
      card.classList.toggle("expanded");
    };

    card.addEventListener("click", toggleExpanded);
    card.addEventListener("keypress", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleExpanded();
      }
    });

    return card;
  }

  function renderSkills(skills) {
    if (!skillsGrid) return;
    skillsGrid.innerHTML = "";
    skills.forEach((skill, index) => {
      const el = createSkillElement(skill, index, {
        onDelete: (deleteIndex) => {
          skills.splice(deleteIndex, 1);
          saveSkills(skills);
          renderSkills(skills);
        },
        onToggleLearned: (toggleIndex) => {
          const current = skills[toggleIndex];
          if (!current) return;
          current.learned = !current.learned;
          saveSkills(skills);
          renderSkills(skills);
        },
      });
      skillsGrid.appendChild(el);
    });
  }

  function handleAddSkill() {
    const title = prompt("Введите название навыка:");
    if (!title || !title.trim()) return;

    const description = prompt("Введите краткое описание навыка:") || "";
    const skills = loadSkills();

    skills.push({
      title: title.trim(),
      description: description.trim(),
      learned: false,
    });

    saveSkills(skills);
    renderSkills(skills);
  }

  if (skillsGrid && addSkillBtn) {
    const initialSkills = loadSkills();
    renderSkills(initialSkills);
    addSkillBtn.addEventListener("click", handleAddSkill);
  }

  if (heroCta && skillsSection) {
    heroCta.addEventListener("click", () => {
      skillsSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  // ===== Блок "Мой индекс навыков" =====

  function updateSkillsIndexUIFromValues(values) {
    if (!skillsIndexSliders.length) return;

    const allValues = [];
    skillsIndexSliders.forEach((slider) => {
      const skillKey = slider.dataset.skill;
      let value = Number(slider.value);

      if (values && skillKey && Object.prototype.hasOwnProperty.call(values, skillKey)) {
        const stored = Number(values[skillKey]);
        if (!Number.isNaN(stored)) {
          value = stored;
          slider.value = String(stored);
        }
      }

      const outputId = slider.dataset.outputId;
      if (outputId) {
        const output = document.getElementById(outputId);
        if (output) {
          output.textContent = `${value}%`;
        }
      }

      allValues.push(value);
    });

    if (!allValues.length) return;

    const sum = allValues.reduce((acc, val) => acc + val, 0);
    const avg = Math.round(sum / allValues.length);
    const clampedAvg = Math.max(0, Math.min(100, avg));

    if (skillsIndexAverageText) {
      skillsIndexAverageText.textContent = `${clampedAvg}%`;
    }

    if (skillsIndexGaugeBar) {
      skillsIndexGaugeBar.style.width = `${clampedAvg}%`;
    }

    if (skillsIndexDescription) {
      let text = "";
      if (clampedAvg <= 25) {
        text = "Начинающий, верный старт";
      } else if (clampedAvg <= 50) {
        text = "Прогрессируешь, держи темп";
      } else if (clampedAvg <= 75) {
        text = "Уверенно растёшь, почти junior";
      } else {
        text = "Сильная база — готов к портфолио";
      }
      skillsIndexDescription.textContent = text;
    }

    const valuesToSave = {};
    skillsIndexSliders.forEach((slider) => {
      const key = slider.dataset.skill;
      if (!key) return;
      valuesToSave[key] = Number(slider.value);
    });
    saveSkillsIndexValues(valuesToSave);
  }

  if (skillsIndexSliders.length) {
    const storedValues = loadSkillsIndexValues();
    updateSkillsIndexUIFromValues(storedValues);

    skillsIndexSliders.forEach((slider) => {
      slider.addEventListener("input", () => {
        updateSkillsIndexUIFromValues(null);
      });
    });
  }
});
