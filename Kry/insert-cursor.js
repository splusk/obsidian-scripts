// https://quickadd.obsidian.guide/docs/QuickAddAPI
const CURSOR_PLACEHOLDER_SETTING_NAME = 'Marker for cursor position';
const DEFAULT_CURSOR_PLACEHOLDER_TEXT = '<% tp.file.cursor() %>';
module.exports = params = {
  entry: async (params, settings) => {
    const {
      quickAddApi,
      app,
      obsidian: { MarkdownView },
    } = params;

    const marker =
      settings[CURSOR_PLACEHOLDER_SETTING_NAME] ||
      DEFAULT_CURSOR_PLACEHOLDER_TEXT;

    const file = app.workspace.getActiveFile();
    const activeView = app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      throw new Error('No active view.');
    }

    // const currentCursorPos = activeView.editor.getCursor();
    const fileContent = await app.vault.cachedRead(file);

    const { body, cursorPos } = getNewContentsWithCursPos(fileContent, marker);

    await app.vault.modify(file, body);
    await activeView.editor.setCursor(cursorPos);
    await activeView.editor.scrollIntoView(
      {
        from: { ch: cursorPos.ch, line: cursorPos.line },
        to: { ch: cursorPos.ch, line: cursorPos.line },
      },
      'center',
    );
  },
  settings: {
    name: 'Insert Cursor',
    author: 'Shane Kakau',
    options: {
      [CURSOR_PLACEHOLDER_SETTING_NAME]: {
        type: 'text',
        defaultValue: DEFAULT_CURSOR_PLACEHOLDER_TEXT,
      },
    },
  },
};

const getNewContentsWithCursPos = (body, marker) => {
  const splitContent = body.split('\n');
  // const pre = splitContent.slice(0, pos + 1).join('\n');
  // const post = splitContent.slice(pos + 1).join('\n');
  const cursorPos = { line: 0, ch: 0 };
  splitContent.forEach((line, index) => {
    if (line.includes(marker)) {
      cursorPos.line = index;
      cursorPos.ch = line.indexOf(marker);
    }
  });
  // body: `${pre}\n${post}`.replace(marker, ''),
  return {
    body: `${body}`.replace(marker, ''),
    cursorPos,
  };
};

exports = {
  getNewContentsWithCursPos,
};
