// https://quickadd.obsidian.guide/docs/QuickAddAPI
module.exports = async (params) => {
  const {
    quickAddApi: { inputPrompt, utility, date },
    app,
    obsidian: { MarkdownView },
  } = params;

  const getTextToPaste = async (input, date, app) => {
    let clipboardContents = '';
    try {
      clipboardContents = await utility.getClipboard();
    } catch (e) {
      console.error(e);
    }

    const customText = await getCustomInsertText(
      input,
      date,
      app,
      clipboardContents,
    );
    if (customText) {
      return customText;
    }

    const teamIcon = await getTeamIcon(input, app);
    if (teamIcon) {
      return teamIcon;
    }

    return getIconLink(input, app, clipboardContents);
  };

  const insertIconAndLinkIntoPage = (text, body, cursorPos) => {
    const { line, ch } = cursorPos;
    const splitContent = body.split('\n');
    const pre = splitContent.slice(0, line).join('\n');
    const post = splitContent.slice(line + 1).join('\n');
    const begining = splitContent[line].slice(0, ch) + text;
    const newText = begining + splitContent[line].slice(ch);
    return {
      body: `${pre}\n${newText}\n${post}`,
      newCursorPos: { line, ch: begining.length },
    };
  };

  const val = await inputPrompt('Input');
  if (!val) {
    return;
  }

  const file = app.workspace.getActiveFile();
  const activeView = app.workspace.getActiveViewOfType(MarkdownView);
  if (!activeView) {
    throw new Error('No active view.');
  }

  const cursorPos = activeView.editor.getCursor();
  const fileContent = await app.vault.cachedRead(file);

  const text = await getTextToPaste(val, date, app);
  const { body, newCursorPos } = insertIconAndLinkIntoPage(
    text,
    fileContent,
    cursorPos,
  );

  await app.vault.modify(file, body);
  await activeView.editor.setCursor(newCursorPos);
  await activeView.editor.scrollIntoView(
    {
      from: newCursorPos,
      to: newCursorPos,
    },
    'center',
  );
};

/**
 * Utilities for inserting icons and links
 */
const ICON_DIR = 'attachments/icons';

const getCustomInsertText = async (
  inputAnycase,
  date,
  app,
  clipboardContents,
) => {
  const input = inputAnycase.toLowerCase().trim();
  const getLinkToTodaysNote = () => {
    return `[[Daily ToDo List#${date.now()}|${date.now()}]]`;
  };
  if (input.startsWith('today')) {
    const msg = inputAnycase.split(' ').slice(1).join(' ');
    return `${getLinkToTodaysNote()}${msg.length > 0 ? `: **${msg}**` : ''}\n`;
  }
  if (input === '1-1') {
    return `${getLinkToTodaysNote()}\n- [ ] Are expectations clear\n- `;
  }
  if (input.startsWith('due date')) {
    let offset = 0;
    const dueDateContents = input.split(' ');
    if (dueDateContents.length == 3) {
      offset = parseInt(dueDateContents[2]);
    }
    return `📅 ${date.now('YYYY-MM-DD', offset)}`;
  }
  if (input === 'done') {
    return '✅';
  }
  if (input === 'wip') {
    return '🚧';
  }
  if (input === 'wont-do') {
    return '❌';
  }
  if (input === 'important') {
    return '🚨🚨️🚨'; //'❗️❗️❗️';
  }
  if (input === 'triage doc') {
    return `###### ${getLinkToTodaysNote()}\n- ${await getIconLink(
      'Triage Doc',
      app,
      'https://docs.google.com/document/d/1rTZixh-xIXcQrOIYBQy5ITZ3lUz6GhRRyWR4-GBRnrM/edit',
    )}\n`;
  }
  if (input === 'miro frame') {
    const miroId = clipboardContents.startsWith('https://miro.com/app/board/')
      ? clipboardContents.split('/').find((item) => item.endsWith('='))
      : clipboardContents;
    return (
      `[Link to Miro Board ![icon](${ICON_DIR}/miro.png)](${clipboardContents})\n` +
      '```custom-frames\n' +
      'frame: miro\n' +
      `urlSuffix:  ${miroId.endsWith('=') ? miroId : miroId + '='}\n` +
      'style: height: 1000px;\n' +
      '```\n'
    );
  }
  if (
    inputAnycase.startsWith('BS-') &&
    clipboardContents.contains('https://krydev.atlassian.net/browse/BS-')
  ) {
    return `[${inputAnycase} ![icon](${ICON_DIR}/jira.png)](${clipboardContents})`;
  }
  return null;
};

const getTeamIcon = async (input, app) => {
  const icon = input.toLowerCase();
  const pathToIcon = `${ICON_DIR}/teams/${icon}.png`;
  const iconFile = app.vault.getAbstractFileByPath(pathToIcon);
  if (!iconFile) {
    return null;
  }
  return `![icon](${pathToIcon})`;
};

const getIconLink = async (input, app, clipboardContents) => {
  const iconFiles = app.vault
    .getFiles()
    .filter((f) => f.path.substring(0, f.path.lastIndexOf('/')) === ICON_DIR)
    .map((f) => f.basename);
  const icon = input
    .split(' ')
    .concat(clipboardContents.split(/[/.]/))
    .find(
      (word) =>
        iconFiles.includes(word.toLowerCase()) || iconFiles.includes(word),
    )
    ?.toLowerCase();
  const iconFile = app.vault.getAbstractFileByPath(`${ICON_DIR}/${icon}.png`);
  if (iconFile) {
    return `[${input} ![icon](${iconFile.path})](${clipboardContents})`;
  }
  return `[${input} 🔗](${clipboardContents})`;
};

exports = {
  getCustomInsertText,
  getIconLink,
  getTeamIcon,
};
