// https://quickadd.obsidian.guide/docs/QuickAddAPI
module.exports = async (params) => {
  const {
    quickAddApi: { inputPrompt, utility, date },
    app,
    obsidian: { MarkdownView },
  } = params;

  const insertIconAndLinkIntoPage = (text, body, pos) => {
    const splitContent = body.split('\n');
    const pre = splitContent.slice(0, pos + 1).join('\n');
    const post = splitContent.slice(pos + 1).join('\n');

    return `${pre}${text}\n${post}`;
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
  let clipboardContents;
  try {
    clipboardContents = await utility.getClipboard();
  } catch (error) {
    console.log(error)
  }

  const text = getCustomInsertText(val, date, clipboardContents);
  const newFileContent = insertIconAndLinkIntoPage(
    text,
    fileContent,
    cursorPos.line,
  );

  await app.vault.modify(file, newFileContent);
  await activeView.editor.setCursor({
    ...cursorPos,
    ch: cursorPos.ch + text.length,
  });
  await activeView.editor.scrollIntoView(
    {
      from: cursorPos,
      to: cursorPos,
    },
    'center',
  );
};

/**
 * Utilities for inserting icons and links
 */
const getCustomInsertText = (inputAnycase, date, clipBoardContents) => {
  const input = inputAnycase.toLowerCase();
  if (input === 'today') {
    return `[[${date.now()}]]`;
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
  if (input === 'wont-do') {
    return '❌';
  }
  if (input === 'in-progress') {
    return '🚧';
  }
  if (clipBoardContents) {
    if (inputAnycase.startsWith('-')) {
      const r = inputAnycase.replace('-', '').trim()
      return `- [${r}](${clipBoardContents})`
    }
    return `[${inputAnycase}](${clipBoardContents})`;
  }
  return inputAnycase;
};

exports = {
  getCustomInsertText,
};
