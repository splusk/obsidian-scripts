// https://docs.obsidian.md/Home
// https://docs.obsidian.md/Reference/TypeScript+API/
// https://quickadd.obsidian.guide/docs/Advanced/scriptsWithSettings
const PATH_TO_NOTE_SETTING_LABEL = 'Full path and name of file';
const PATH_TO_NOTE_DEFAULT = 'Untitled';
const OPEN_MODE_SETTING_LABEL = 'Open in mode';
const OPEN_MODE_SETTING_DEFUALT = 'default';
const NEW_TAB_SETTING_LABEL = 'Open in new tab';
const NEW_TAB_SETTING_DEFAULT = true;
module.exports = {
  entry: async (params, settings) => {
    const { app, obsidian } = params;

    const note = settings[PATH_TO_NOTE_SETTING_LABEL] || PATH_TO_NOTE_DEFAULT;
    const newTab = Boolean(
      settings[NEW_TAB_SETTING_LABEL] || NEW_TAB_SETTING_DEFAULT,
    );
    const openMode =
      settings[OPEN_MODE_SETTING_LABEL] || OPEN_MODE_SETTING_DEFUALT;

    const selectedFile = app.vault.getAbstractFileByPath(`${note}.md`);
    if (selectedFile) {
      let leaf = null;
      await app.workspace.iterateAllLeaves((openLeaf) => {
        if (
          openLeaf.view.modes &&
          openLeaf.view.file &&
          openLeaf.view.file.path === selectedFile.path
        ) {
          leaf = openLeaf;
        }
      });
      if (!leaf) {
        if (newTab) {
          leaf = app.workspace.getLeaf(true);
          leaf.openFile(selectedFile, { state: { mode: openMode } });
          app.workspace.setActiveLeaf(leaf);
        } else {
          app.workspace.activeLeaf.openFile(selectedFile);
        }
      } else {
        app.workspace.setActiveLeaf(leaf);
      }
    } else {
      new Notice('File: ' + note + '.md Not Found', 5000);
    }
  },
  settings: {
    name: 'Open Note',
    author: 'Shane Kakau',
    options: {
      [PATH_TO_NOTE_SETTING_LABEL]: {
        type: 'text',
        defaultValue: PATH_TO_NOTE_DEFAULT,
      },
      [OPEN_MODE_SETTING_LABEL]: {
        type: 'dropdown',
        defaultValue: OPEN_MODE_SETTING_DEFUALT,
        options: ['default', 'preview', 'source'],
      },
      [NEW_TAB_SETTING_LABEL]: {
        type: 'dropdown',
        defaultValue: NEW_TAB_SETTING_DEFAULT,
        options: ['true', 'false'],
      },
    },
  },
};
