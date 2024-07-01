// https://docs.obsidian.md/Home
const IGNORE_FOLDERS_BASE =
  '-"archive" and -"Templates" and -"Bookmarks" and -"attachments"';
const DAILY_NOTES_PATH = 'Notes/Daily Notes';
const INCOMPLETE_ICON = '⬜️';
const COMPLETED_ICON = '✅';
const CHECKBOX = '[ ]';
const CHECKBOX_DONE = '[x]';
const IN_PROGRESS = '🚧';
const CAL = '📅';
const DATE_FORMAT = 'YYYY-MM-DD';

const isMatch = (task, text) => {
  const inputText = text.toLowerCase();
  const path = task.path.toLowerCase();
  const sectionSubpath = task.section.subpath
    ? task.section.subpath.toLowerCase()
    : '';
  const taskText = task.text.toLowerCase();
  const isAMatch =
    path.contains(inputText) ||
    taskText.contains(inputText) ||
    sectionSubpath.contains(inputText);
  return isAMatch;
};

const getFileNameOfTask = (task) =>
  task.path.split('/').pop().replace('.md', '');

const isTaskOverDue = (task) => {
  const dueDate = getDueDateFromTask(task);
  return dueDate
    ? moment(dueDate, DATE_FORMAT).isBefore(moment(), 'day')
    : false;
};
const getDueDateFromTask = (task) => {
  const isAlreadyADate = moment(task.text, DATE_FORMAT, true).isValid();
  if (isAlreadyADate) {
    return task.text;
  }
  const text = task.text;
  if (!text) {
    return null;
  }
  const match = text.match(/📅 (\d{4})-(\d{2})-(\d{2})(?:\s\d{2}:\d{2})?/);
  return match ? match[0].slice(2).trim() : null;
};
const hasDueDate = (task) => getDueDateFromTask(task) !== null;

const getValidTasks = (pages, text) => {
  let tasks = pages.file.tasks;
  if (text) {
    tasks = pages.file.tasks.where((t) => isMatch(t, text));
  }
  return tasks.where((t) => !t.completed && t.text.length > 0);
};

const getItemSectionElement = (task, text) => {
  const subpath = task.section.subpath;
  const displayText = text
    ? text.replace(`${CAL} ${getDueDateFromTask(task)}`, '') &&
      text.replace(COMPLETED_ICON, '')
    : subpath;
  const inProgress = text && text.contains(IN_PROGRESS);
  const isDone = text && text.contains(COMPLETED_ICON);
  const aEl = dv.el('a', displayText, {
    cls: 'markdown-rendered internal-link',
    attr: {
      'data-href': `${task.path}#${subpath}`,
      'aria-label': `${task.path} > ${subpath}`,
      target: '_blank',
      style: isDone
        ? 'text-decoration: line-through !important; opacity: 50%;'
        : inProgress
        ? 'color: var(--yellow) !important; opacity: 70%;'
        : '',
    },
    href: `${task.path}#${subpath}`,
  });
  aEl.addEventListener('click', async (e) => {
    const file = await app.vault.getAbstractFileByPath(task.section.path);
    if (file) {
      // open link in new tab
      let leaf = null;
      await app.workspace.iterateAllLeaves((openLeaf) => {
        if (openLeaf.view.file && openLeaf.view.file.path === task.path) {
          leaf = openLeaf;
        }
      });
      if (!leaf) {
        leaf = app.workspace.getLeaf(true);
      }
      app.workspace.setActiveLeaf(leaf);
    } else {
      new Notice('File: ' + task.path + ' Not Found', 5000);
    }
  });
  return aEl;
};
const getCheckboxElement = (task, displayText) => {
  const aEl = dv.el('span', displayText, {
    cls: 'markdown-rendered internal-link',
    attr: {
      style: 'text-decoration: none; margin-left: 22px;',
      id: `${task.text}-${getFileNameOfTask(task)}`,
    },
  });
  aEl.addEventListener('click', async (e) => {
    const file = await app.vault.getAbstractFileByPath(task.section.path);
    if (file) {
      aEl.querySelectorAll('span').forEach((e) => {
        if (e.innerText === INCOMPLETE_ICON) {
          e.innerText = COMPLETED_ICON;
        } else if (e.innerText === COMPLETED_ICON) {
          e.innerText = INCOMPLETE_ICON;
        }
      });
      const fileContent = await app.vault.cachedRead(file);
      if (fileContent) {
        const body = fileContent.split('\n').map((line, index) => {
          if (task.line === index) {
            if (line.contains(CHECKBOX_DONE)) {
              line = line.replace(CHECKBOX_DONE, CHECKBOX);
            } else if (line.contains(CHECKBOX)) {
              line = line.replace(CHECKBOX, CHECKBOX_DONE);
            }
          }
          return line;
        });
        await app.vault.modify(file, body.join('\n'));
      }
    }
  });
  return aEl;
};
const getSectionElement = (task, text) => {
  const markDoneCell = text === INCOMPLETE_ICON;
  return markDoneCell
    ? getCheckboxElement(task, text)
    : getItemSectionElement(task, text);
};

const searchFiledHandler = (searchText) => {
  const container = dv.container;
  // remove content
  container
    .querySelectorAll('.table-view-table')
    .forEach((e) => e.parentNode.remove()),
    container.querySelectorAll('.tasklist-divider').forEach((e) => e.remove());
  container.querySelectorAll('H2').forEach((e) => e.remove());
  container.querySelectorAll('H3').forEach((e) => e.remove());
  // render filtered content
  renderContent(searchText);
};

const renderOverdueTasksTable = (allDueTasks) => {
  if (allDueTasks.length > 0) {
    dv.header('2', 'Overdue Tasks');
    for (let group of allDueTasks.groupBy((t) => getDueDateFromTask(t))) {
      dv.header(
        '3',
        dv.el('b', group.key.split(' ')[0], { cls: 'overdue-task' }),
      );
      dv.table(
        [`Task`, 'Complete', 'Note'],
        group.rows.map((t) => {
          return [
            getSectionElement(t, t.text),
            getSectionElement(t, INCOMPLETE_ICON),
            getSectionElement(t, getFileNameOfTask(t)),
          ];
        }),
      );
    }
    renderSeperator();
  }
};

const renderTodaysTasksTable = async (dailyTasks) => {
  if (dailyTasks.length > 0) {
    dv.header('2', 'Todays Tasks');
    dv.table(
      [`Task`, 'Complete', 'Section'],
      dailyTasks.map((t) => {
        return [
          getSectionElement(t, t.text),
          getSectionElement(t, INCOMPLETE_ICON),
          getSectionElement(t),
        ];
      }),
    );
    renderSeperator();
  }
};

const renderDailyTasksTable = async (dailyTasks) => {
  if (dailyTasks.length > 0) {
    for (let group of dailyTasks
      .groupBy((t) => {
        return t.section.subpath;
      })
      .sort((g) => g.key, 'asc')) {
      dv.header('2', group.key);
      dv.table(
        [`Task`, 'Complete', 'Filename'],
        group.rows.map((t) => {
          return [
            getSectionElement(t, t.text),
            getSectionElement(t, INCOMPLETE_ICON),
            getSectionElement(t, getFileNameOfTask(t)),
          ];
        }),
      );
    }
    renderSeperator();
  }
};

const renderGroupTasksTable = async (allOtherTasks) => {
  if (allOtherTasks.length > 0) {
    dv.header('2', 'Other Tasks');
    for (let group of allOtherTasks.groupBy((t) => t.path)) {
      dv.header('3', getFileNameOfTask({ path: group.key }));
      dv.table(
        [`Task`, 'Complete', 'Section'],
        group.rows.map((t) => {
          return [
            getSectionElement(t, t.text),
            getSectionElement(t, INCOMPLETE_ICON),
            getSectionElement(t),
          ];
        }),
      );
    }
    renderSeperator();
  }
};

const renderGroupNotesList = async () => {
  const notes = dv
    .pages('"Notes/Daily Notes"')
    .flatMap((page) => page.file.lists)
    .filter((item) => item.section.subpath === 'Notes')
    .filter((item) => item.parent === undefined)
    // .filter((item) => !item.text.endsWith(COMPLETED_ICON))
    .map((item) => {
      const el = getSectionElement(item, item.text.split('\n').shift());
      el.querySelectorAll('span').forEach((span) =>
        span.querySelectorAll('a').forEach((a) => a.removeAttribute('href')),
      );
      return el;
    });
  if (notes.length > 0) {
    dv.el('H2', 'Notes', {
      cls: 'notes-list-header',
    });
    dv.list(notes);
  }
};

const renderSeperator = () => {
  dv.el('br');
  dv.el('hr', ' ', { cls: 'tasklist-divider' });
};

const renderContent = (filterString) => {
  const allTasks = getValidTasks(dv.pages(IGNORE_FOLDERS_BASE), filterString);
  const dailyTasks = allTasks.filter((t) =>
    t.path.startsWith(DAILY_NOTES_PATH),
  );
  const isATodayTask = (t) => {
    const taskHasDueDateForToday = moment().isSame(
      getDueDateFromTask(t),
      'day',
    );
    const tasksListForToday = moment().isSame(
      getDueDateFromTask({
        text: getFileNameOfTask(t),
      }),
      'day',
    );
    return !isTaskOverDue(t) && (taskHasDueDateForToday || tasksListForToday);
  };
  renderOverdueTasksTable(allTasks.filter((t) => isTaskOverDue(t)));
  renderTodaysTasksTable(dailyTasks.filter((t) => isATodayTask(t)));
  renderDailyTasksTable(
    dailyTasks.filter((t) => !isATodayTask(t) && !isTaskOverDue(t)),
  );
  renderGroupTasksTable(
    allTasks.filter(
      (t) => !t.path.startsWith(DAILY_NOTES_PATH) && !hasDueDate(t),
    ),
  );
  renderGroupNotesList();
};

// render view
const inputEl = dv.el('input', '', { cls: 'dataview-table-search-input' });
inputEl.addEventListener('input', (e) => searchFiledHandler(e.target.value));
renderContent();
