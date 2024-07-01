// https://docs.obsidian.md/Home
const IGNORE_FOLDERS =
  '-"archive" and -"Templates" and -"Bookmarks" and -"attachments"';
const IMPORTANT = '🚨🚨️🚨';
const CAL = '📅';
const IN_PROGRESS = '🚧';
const INCOMPLETE_ICON = '⬜️';
const COMPLETED_ICON = '✅';
const CHECKBOX = '[ ]';
const CHECKBOX_DONE = '[x]';
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

const getNameFromPath = (path) => path.split('/').pop().replace('.md', '');
const isTaskInProgress = (task) => task.text && task.text.contains(IN_PROGRESS);
const isTaskImportant = (task) => task.text && task.text.contains(IMPORTANT);
const getDueDateFromTask = (task) => getDueDateTimeFromTask(task, true);
const getDueDateTimeFromTask = (task, justDate) => {
  let text = task.text;
  if (!text) {
    return null;
  }
  const isAlreadyADate = moment(text, DATE_FORMAT, true).isValid();
  if (isAlreadyADate) {
    return text;
  }
  const match = text.match(/📅 (\d{4})-(\d{2})-(\d{2})(?:\s\d{2}:\d{2})?/);
  if (match) {
    let result = match[0].slice(2).trim();
    return justDate ? result.split(' ')[0] : result;
  }
  return null;
};
const hasDueDate = (task) => {
  if (task.text.contains(CAL)) {
    const dueDateMatch = getDueDateTimeFromTask(task);
    return dueDateMatch?.length > 0;
  }
  return false;
};
const isTaskOverDue = (task) => {
  if (task.text.contains(CAL)) {
    const dueDate = getDueDateFromTask(task);
    const taskDueDate = moment(dueDate, DATE_FORMAT);
    return moment().isAfter(taskDueDate, 'day');
  }
  return false;
};

const isTodaysTask = (task) => {
  const today = moment().format(DATE_FORMAT);
  return today === task.header.subpath || today === getDueDateFromTask(task);
};

const getValidTasks = (pages, text) => {
  let tasks = pages.file.tasks;
  if (text) {
    tasks = pages.file.tasks.where((t) => isMatch(t, text));
  }
  return tasks.where((t) => !t.completed && t.text.length > 0);
};

const getCheckBoxElement = (task) => {
  const aEl = dv.el('span', INCOMPLETE_ICON, {
    cls: 'markdown-rendered internal-link',
    attr: {
      style: 'text-decoration: none; margin-left: 22px;',
      id: `${task.text}-${getNameFromPath(task.path)}`,
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
    } else {
      new Notice('File: ' + task.path + ' Not Found', 5000);
    }
  });
  return aEl;
};

const getSectionElement = (task, customTextToDisplay, customCSS) => {
  if (customTextToDisplay === INCOMPLETE_ICON) {
    return getCheckBoxElement(task);
  }
  const subpath = task.section.subpath ? task.section.subpath : '';
  const displayText = customTextToDisplay ? customTextToDisplay : subpath;
  const aEl = dv.el('a', displayText, {
    cls: `markdown-rendered internal-link 
      ${isTaskInProgress(task) ? 'task-in-progress' : ''}
      ${isTaskImportant(task) ? 'task-is-important' : ''}`,
    attr: {
      'data-href': `${task.path}#${subpath}`,
      'aria-label': `${task.path} > ${subpath}`,
      target: '_blank',
      tag: 'note-link',
    },
    href: `${task.path}#${subpath}`,
  });
  const spanEl = dv.el('span', aEl, {
    cls: `${customCSS}`,
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
  return spanEl;
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

const renderDueTasksTable = (allDueTasks, customHeader, groupByFn) => {
  for (let group of allDueTasks.groupBy((t) =>
    groupByFn ? groupByFn(t) : getDueDateFromTask(t),
  )) {
    dv.header(
      '3',
      dv.el('b', customHeader ? customHeader : getNameFromPath(group.key), {
        cls: isTaskOverDue({ text: `${CAL} ${group.key}` })
          ? 'overdue-task'
          : 'not-overdue-task',
      }),
    );
    dv.table(
      [`Task`, 'Note', 'Complete'],
      group.rows.map((t) => {
        const fileName = getNameFromPath(t.path);
        const dueDateText = CAL + ' ' + getDueDateTimeFromTask(t);
        let displayText = t.text.replace(dueDateText, '');
        return [
          getSectionElement(t, displayText),
          getSectionElement(t, fileName),
          getSectionElement(t, INCOMPLETE_ICON),
        ];
      }),
    );
  }
};

const renderGroupTasksTable = async (tasks, groupByFn) => {
  for (let group of tasks.groupBy((t) => (groupByFn ? groupByFn(t) : t.path))) {
    dv.header('3', getNameFromPath(group.key));
    dv.table(
      [`Task`, 'Section', 'Complete'],
      group.rows.map((t) => {
        return [
          getSectionElement(t, t.text.split('\n').shift()),
          getSectionElement(t),
          getSectionElement(t, INCOMPLETE_ICON),
        ];
      }),
    );
  }
};

const renderContent = (filterString) => {
  const specialFolders = [
    'Notes/Daily Notes/Daily ToDo List',
    'Tech/EM',
    'Teams',
  ];
  const allTasks = getValidTasks(dv.pages(IGNORE_FOLDERS), filterString);
  const tasksOverDue = allTasks.filter((t) => isTaskOverDue(t));
  if (tasksOverDue.length > 0) {
    dv.el('H2', 'Due');
    // Tasks Overdue
    renderDueTasksTable(tasksOverDue);
  }
  // Today's Tasks
  renderDueTasksTable(
    allTasks
      .filter(
        (t) =>
          t.path.contains(moment().format('YYYY-MM-DD')) || isTodaysTask(t),
      )
      .map((t) => {
        return { ...t, today: moment().format('YYYY-MM-DD') };
      }),
    'Todays Tasks',
    (t) => t.tdday,
  );
  dv.el('hr', ' ', { cls: 'tasklist-divider' });
  const tasksWithoutDueDate = allTasks.filter(
    (t) =>
      !isTaskOverDue(t) &&
      !t.path.contains(moment().format('YYYY-MM-DD')) &&
      !isTodaysTask(t),
  );
  if (tasksWithoutDueDate.length > 0) {
    dv.el('H2', 'Tasks');
    // Daily Tasks
    renderGroupTasksTable(
      tasksWithoutDueDate.filter((t) => t.path.startsWith(specialFolders[0])),
    );
    // EM Tasks
    renderGroupTasksTable(
      tasksWithoutDueDate.filter((t) => t.path.startsWith(specialFolders[1])),
    );
    // Teams Tasks
    renderGroupTasksTable(
      tasksWithoutDueDate.filter((t) => t.path.startsWith(specialFolders[2])),
      (t) => {
        return t.path.split('/')[1]; // group by team name
      },
    );
    // The Rest
    renderGroupTasksTable(
      tasksWithoutDueDate.filter((t) =>
        specialFolders.map((p) => !t.path.startsWith(p)).every((v) => v),
      ),
    );
  }
};

// render view
dv.el('div', '', { attr: { style: 'margin-top: 0px' } });
const inputEl = dv.el('input', '', { cls: 'dataview-table-search-input' });
inputEl.addEventListener('input', (e) => searchFiledHandler(e.target.value));
renderContent();
