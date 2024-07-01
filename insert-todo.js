// https://quickadd.obsidian.guide/docs/QuickAddAPI
const SETTINGS = {
  marker: {
    MARKER_PLACEHOLDER_NAME_SETTING:
      'Marker to insert after, can be empty string to append to end of file',
    DEFAULT_MARKER_PLACEHOLDER_SETTING: '# Daily Notes',
  },
  file: {
    FILE_NAME_TO_INSERT_INTO_NAME_SETTING: 'File name to add todo to',
    DEFAULT_FILE_NAME_TO_INSERT_INTO_SETTING:
      'Notes/Daily Notes/Daily ToDo List',
  },
  template: {
    TODO_TEMPLATE_TO_INSERT_NAME_SETTING: 'Formatted text to insert',
    DEFAULT_TODO_TEMPLATE_TO_INSERT_SETTING:
      '## {{DATE}}\n- [ ]\n\n### Comments\n\n---',
  },
  date: {
    DATE_FORMAT_NAME_SETTING: 'Format of date',
    DEFAULT_DATE_FORMAT_SETTING: 'YYYY-MM-DD',
  },
  attachment: {
    ICON_DIR_SETTING_NAME: 'Icon directory',
    DEFAULT_ICON_DIR_SETTING: 'attachments/icons',
  },
};
const CHECKBOX_MD = '- [ ]';
module.exports = params = {
  entry: async (params, settings) => {
    const {
      quickAddApi: { inputPrompt, utility, date },
      app,
      obsidian: { MarkdownView },
    } = params;

    const marker =
      settings[SETTINGS.marker.MARKER_PLACEHOLDER_NAME_SETTING] ||
      SETTINGS.marker.DEFAULT_MARKER_PLACEHOLDER_SETTING;

    const fileName =
      settings[SETTINGS.file.FILE_NAME_TO_INSERT_INTO_NAME_SETTING] ||
      SETTINGS.file.DEFAULT_FILE_NAME_TO_INSERT_INSERT_INTO_SETTING;

    const template =
      settings[SETTINGS.template.TODO_TEMPLATE_TO_INSERT_NAME_SETTING] ||
      SETTINGS.template.DEFAULT_TODO_TEMPLATE_TO_INSERT_SETTING;

    const iconDir =
      settings[SETTINGS.attachment.ICON_DIR_SETTING_NAME] ||
      SETTINGS.attachment.DEFAULT_ICON_DIR_SETTING;

    const dateFormt =
      settings[SETTINGS.date.DATE_FORMAT_NAME_SETTING] ||
      SETTINGS.date.DEFAULT_DATE_FORMAT_SETTING;

    const file = await app.vault.getAbstractFileByPath(`${fileName}.md`);
    const fileContent = await app.vault.cachedRead(file);

    const today = moment().format(dateFormt);
    const textToAdd = await inputPrompt('Todo item');
    if (!textToAdd && file && fileContent.contains(`## ${today}`)) {
      await openFileAtCursorPos(app, file, { line: 9, ch: 0 }, MarkdownView);
    } else {
      let clipboardContents = null;
      try {
        clipboardContents = await utility.getClipboard();
      } catch (e) {
        console.error(e);
      }

      const checkboxWithFormattedText = getTextToAdd(
        textToAdd,
        clipboardContents,
        dateFormt,
        iconDir,
      );
      const { body, cursorPos } = updateFileContent(
        fileContent,
        marker,
        template,
        checkboxWithFormattedText,
        today,
      );

      await app.vault.modify(file, body);
      await openFileAtCursorPos(app, file, cursorPos, MarkdownView);
    }
  },
  settings: {
    name: 'Insert Todo Item',
    author: 'Shane Kakau',
    options: {
      [SETTINGS.file.FILE_NAME_TO_INSERT_INTO_NAME_SETTING]: {
        type: 'text',
        defaultValue: SETTINGS.file.DEFAULT_FILE_NAME_TO_INSERT_INTO_SETTING,
      },
      [SETTINGS.marker.MARKER_PLACEHOLDER_NAME_SETTING]: {
        type: 'text',
        defaultValue: SETTINGS.marker.DEFAULT_MARKER_PLACEHOLDER_SETTING,
      },
      [SETTINGS.template.TODO_TEMPLATE_TO_INSERT_NAME_SETTING]: {
        type: 'text',
        defaultValue: SETTINGS.template.DEFAULT_TODO_TEMPLATE_TO_INSERT_SETTING,
      },
      [SETTINGS.date.DATE_FORMAT_NAME_SETTING]: {
        type: 'text',
        defaultValue: SETTINGS.date.DEFAULT_DATE_FORMAT_SETTING,
      },
      [SETTINGS.attachment.ICON_DIR_SETTING_NAME]: {
        type: 'text',
        defaultValue: SETTINGS.attachment.DEFAULT_ICON_DIR_SETTING,
      },
    },
  },
};

const openFileAtCursorPos = async (app, file, cursorPos, MarkdownView) => {
  const activeView = app.workspace.getActiveViewOfType(MarkdownView);
  if (!activeView) {
    throw new Error('No active view or file not found.');
  }
  let leaf = null;
  await app.workspace.iterateAllLeaves((openLeaf) => {
    if (
      openLeaf.view.modes &&
      openLeaf.view.file &&
      openLeaf.view.file.path === file.path
    ) {
      leaf = openLeaf;
    }
  });
  if (!leaf) {
    leaf = app.workspace.getLeaf(true);
  }
  app.workspace.setActiveLeaf(leaf);
  await activeView.editor.setCursor(cursorPos);
  await activeView.editor.scrollIntoView(
    {
      from: cursorPos,
      to: cursorPos,
    },
    'center',
  );
};

const getIconFromClipboard = (input, clipboardContents, iconDir) => {
  let icon = null;
  if (input && clipboardContents) {
    if (clipboardContents.includes('teams.microsoft.com')) {
      icon = 'teams';
    }
    if (clipboardContents.includes('kry.slack.com')) {
      icon = 'slack';
    }
    if (clipboardContents.includes('miro.com')) {
      icon = 'miro';
    }
    if (clipboardContents.includes('github.com')) {
      icon = 'github';
    }
    if (clipboardContents.includes('figma.com')) {
      icon = 'figma';
    }
    if (clipboardContents.includes('atlassian.net')) {
      icon = 'jira';
    }
    if (clipboardContents.includes('app.datadoghq.eu')) {
      icon = 'datadog';
    }
    if (clipboardContents.includes('docs.google.com')) {
      if (clipboardContents.includes('document')) {
        icon = 'doc';
      }
      if (clipboardContents.includes('presentation')) {
        icon = 'slide';
      }
      if (clipboardContents.includes('spreadsheets')) {
        icon = 'sheet';
      }
    }
  }
  return icon ? `![icon](${iconDir}/${icon}.png)` : null;
};

const getTextToAdd = (textToAdd, clipboardContents, dateFormt, iconDir) => {
  const icon = getIconFromClipboard(textToAdd, clipboardContents, iconDir);
  if (icon) {
    return `${CHECKBOX_MD} [${textToAdd} ${icon}](${clipboardContents})`;
  }
  let finalResult = textToAdd
    ? `${CHECKBOX_MD} ${textToAdd}`
    : `${CHECKBOX_MD} `;
  if (finalResult?.endsWith('today')) {
    finalResult = finalResult.replace(
      'today',
      `📅 ${moment().format(dateFormt)}`,
    );
  }
  if (finalResult?.endsWith('tomorrow')) {
    finalResult = finalResult.replace(
      'tomorrow',
      `📅 ${moment().add(1, 'days').format(dateFormt)}`,
    );
  }
  return finalResult;
};

const updateFileContent = (
  body,
  marker,
  template,
  checkboxWithFormattedText,
  today,
) => {
  const todoTemplate = template
    .split('\\n')
    .join('\n')
    .replace('{{DATE}}', today)
    .replace(CHECKBOX_MD, checkboxWithFormattedText);
  let textToReplace = null;
  let textToInsert = null;
  const splitContent = body.split('\n');
  const cursorPos = { line: 9, ch: 0 };
  splitContent.forEach((line, index) => {
    const nextLine = splitContent[index + 1] || '';
    if (line.includes(marker)) {
      cursorPos.line = index + 2;
      if (!nextLine.includes(today)) {
        textToReplace = marker;
        textToInsert = `${textToReplace}\n${todoTemplate}`;
        cursorPos.ch = checkboxWithFormattedText.length;
      } else {
        cursorPos.ch = nextLine.length - CHECKBOX_MD.length + 1;
        textToReplace = nextLine;
        textToInsert = `${nextLine}\n${checkboxWithFormattedText}`;
        cursorPos.ch = checkboxWithFormattedText.length;
      }
    }
  });
  return {
    body:
      textToReplace && textToInsert
        ? `${body}`.replace(textToReplace, textToInsert)
        : `${body}`,
    cursorPos,
  };
};
