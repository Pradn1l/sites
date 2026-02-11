/*
 * Interactive logic for the Couple's Quest Tracker.
 *
 * The application state (names, tagline, overlay darkness, background image and quest lists)
 * is stored in localStorage under the key `coupleQuestData`.  Upon load the script
 * hydrates the interface from storage or falls back to sensible defaults.  Users can
 * toggle between view and edit modes via a floating button.  In edit mode the hero
 * names, tagline, background image, overlay darkness and quest lists are all
 * editable.  Completed quests may be checked/unchecked in either mode.  All
 * changes persist automatically.
 */

// Default data structure used when nothing exists in localStorage.
const defaultData = {
  names: 'You & Me',
  tagline: 'Adventures, dreams and memories together',
  background: 'images/cosmos.jpg',
  overlay: 0.6,
  sections: [
    {
      title: 'Travel Adventures',
      tasks: [
        { text: 'Visit Paris, France', completed: false },
        { text: 'Road trip across Iceland', completed: false },
        { text: 'See the Northern Lights together', completed: false },
        { text: 'Tokyo cherry blossoms', completed: false },
      ],
    },
    {
      title: 'Personal Goals',
      tasks: [
        { text: 'Learn Spanish together', completed: false },
        { text: 'Cook 50 new recipes', completed: false },
        { text: 'Run a 5K together', completed: false },
        { text: 'Read 12 books together', completed: false },
      ],
    },
  ],
};

// Retrieve stored data or fall back to default.
function getData() {
  try {
    const saved = localStorage.getItem('coupleQuestData');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to parse stored data:', err);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

// Persist the current state to localStorage.
function saveData() {
  try {
    localStorage.setItem('coupleQuestData', JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
}

// Application state and mode variables.
let data = getData();
let editMode = false;

// Main render function which rebuilds the DOM tree from scratch.
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Ensure the body uses the selected background image.
  document.body.style.backgroundImage = `url(${data.background})`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundAttachment = 'fixed';

  // Remove any existing overlay and insert a new one with current opacity.
  const existingOverlay = document.querySelector('.overlay');
  if (existingOverlay) existingOverlay.remove();
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.style.backgroundColor = `rgba(0, 0, 0, ${data.overlay})`;
  document.body.insertBefore(overlay, document.body.firstChild);

  // Create the floating edit button.
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'toggle-btn';
  toggleBtn.textContent = editMode ? 'Done' : 'Edit';
  toggleBtn.onclick = () => {
    editMode = !editMode;
    render();
  };
  app.appendChild(toggleBtn);

  // Build the scroll container.
  const main = document.createElement('main');

  // ----- First page: Hero + first category -----
  const page1 = document.createElement('section');
  // Hero container
  const hero = document.createElement('div');
  hero.style.textAlign = 'center';
  hero.style.width = '100%';
  hero.style.maxWidth = '600px';

  // Names
  if (editMode) {
    const namesInput = document.createElement('input');
    namesInput.type = 'text';
    namesInput.value = data.names;
    namesInput.onchange = (e) => {
      data.names = e.target.value || '';
      saveData();
    };
    namesInput.placeholder = 'Enter your names';
    hero.appendChild(namesInput);
  } else {
    const namesEl = document.createElement('h1');
    namesEl.textContent = data.names;
    hero.appendChild(namesEl);
  }

  // Tagline
  if (editMode) {
    const taglineInput = document.createElement('input');
    taglineInput.type = 'text';
    taglineInput.value = data.tagline;
    taglineInput.onchange = (e) => {
      data.tagline = e.target.value || '';
      saveData();
    };
    taglineInput.placeholder = 'Enter your tagline';
    taglineInput.style.marginTop = '0.5rem';
    hero.appendChild(taglineInput);
  } else {
    const taglineEl = document.createElement('p');
    taglineEl.className = 'tagline';
    taglineEl.textContent = data.tagline;
    hero.appendChild(taglineEl);
  }

  // Background upload and overlay slider in edit mode
  if (editMode) {
    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          data.background = event.target.result;
          saveData();
          render();
        };
        reader.readAsDataURL(file);
      }
    };
    editContainer.appendChild(fileInput);

    // Overlay darkness slider
    const rangeContainer = document.createElement('div');
    rangeContainer.className = 'range-container';
    const rangeLabel = document.createElement('label');
    rangeLabel.textContent = 'Overlay darkness';
    rangeLabel.htmlFor = 'overlay-range';
    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    rangeInput.min = '0';
    rangeInput.max = '0.9';
    rangeInput.step = '0.05';
    rangeInput.value = data.overlay;
    rangeInput.id = 'overlay-range';
    rangeInput.oninput = (e) => {
      data.overlay = parseFloat(e.target.value);
      overlay.style.backgroundColor = `rgba(0, 0, 0, ${data.overlay})`;
      saveData();
    };
    rangeContainer.appendChild(rangeLabel);
    rangeContainer.appendChild(rangeInput);
    editContainer.appendChild(rangeContainer);
    hero.appendChild(editContainer);
  }

  page1.appendChild(hero);

  // Render the first category (index 0) into page1
  page1.appendChild(createCategorySection(0));
  main.appendChild(page1);

  // ----- Second page: second category only -----
  const page2 = document.createElement('section');
  page2.appendChild(createCategorySection(1));
  main.appendChild(page2);

  app.appendChild(main);
}

/**
 * Creates a DOM fragment representing a single quest category.  The index maps into
 * the `data.sections` array.  This function does not directly append to the DOM,
 * allowing the caller to insert it into the desired parent.
 *
 * @param {number} idx - Index of the section to render
 * @returns {HTMLElement} A DOM element representing the category
 */
function createCategorySection(idx) {
  const sectionData = data.sections[idx];
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.maxWidth = '600px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.marginTop = '1rem';

  // Category title
  const titleEl = document.createElement('h2');
  titleEl.className = 'category-title';
  if (editMode) {
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = sectionData.title;
    titleInput.onchange = (e) => {
      data.sections[idx].title = e.target.value || '';
      saveData();
    };
    titleInput.placeholder = 'Category name';
    titleEl.appendChild(titleInput);
  } else {
    titleEl.textContent = sectionData.title;
  }
  container.appendChild(titleEl);

  // Quest list container
  const list = document.createElement('div');
  list.className = 'quest-list';
  sectionData.tasks.forEach((task, taskIndex) => {
    const item = document.createElement('div');
    item.className = 'quest-item';
    if (task.completed) item.classList.add('completed');

    // Label holds the checkbox and text
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.onchange = () => {
      task.completed = checkbox.checked;
      saveData();
      render();
    };
    label.appendChild(checkbox);
    const span = document.createElement('span');
    span.textContent = task.text;
    label.appendChild(span);
    item.appendChild(label);

    // Delete button in edit mode
    if (editMode) {
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => {
        data.sections[idx].tasks.splice(taskIndex, 1);
        saveData();
        render();
      };
      item.appendChild(delBtn);
    }
    list.appendChild(item);
  });
  container.appendChild(list);

  // Add new quest input in edit mode
  if (editMode) {
    const addContainer = document.createElement('div');
    addContainer.className = 'add-container';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add new quest...';
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.onclick = () => {
      const text = input.value.trim();
      if (text) {
        data.sections[idx].tasks.push({ text, completed: false });
        input.value = '';
        saveData();
        render();
      }
    };
    addContainer.appendChild(input);
    addContainer.appendChild(addBtn);
    container.appendChild(addContainer);
  }
  return container;
}

// Initialise the app on first load.
document.addEventListener('DOMContentLoaded', () => {
  render();
});