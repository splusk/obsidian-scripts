// https://docs.obsidian.md/Home
// https://docs.obsidian.md/Reference/TypeScript+API/
// https://quickadd.obsidian.guide/docs/Advanced/scriptsWithSettings
const REFRESH_SETTING_NAME = 'Reflesh interval (sec)';
const REFRESH_DEFAULT_SETTING = '10';
const PATH_TO_NOTE_SETTING_NAME = 'Full path and name of note';
const PATH_TO_NOTE = 'Untitled';

module.exports = {
  entry: async (params, settings) => {
    const { app, obsidian } = params;

    const note = settings[PATH_TO_NOTE_SETTING_NAME] || PATH_TO_NOTE;

    const getNote = async (app) => {
      const path = `${note}.md`;
      let file = app.vault.getAbstractFileByPath(path);
      if (!file) {
        file = await app.vault.create(path, '');
      }
      return file;
    };

    const updateLeafFile = async (leaf, app, note) => {
      if (leaf) {
        const file = note ? note : await getNote(app);
        if (leaf.view.file != file) {
          await leaf.openFile(file, {
            active: false,
            state: { mode: 'preview' },
          });
        }
      }
    };

    const showFileInSideBar = async (app) => {
      const selectedFile = await getNote(app);
      if (selectedFile) {
        let leaf = null;
        await app.workspace.iterateAllLeaves((openLeaf) => {
          if (
            openLeaf.parent.containerEl.className.indexOf(
              'mod-top-right-space',
            ) > -1 &&
            openLeaf.view.modes &&
            openLeaf.view.file &&
            openLeaf.view.file.path === selectedFile.path
          ) {
            leaf = openLeaf;
          }
        });
        if (!leaf) {
          leaf = app.workspace.getRightLeaf(false);
        }
        updateLeafFile(leaf, app, selectedFile);
        app.workspace.revealLeaf(leaf);
        return leaf;
      } else {
        new Notice('File: ' + note + '.md Not Found', 5000);
      }
    };

    const leaf = await showFileInSideBar(app);

    // get reflesh interval from the user's settings
    const refleshInterval = +(
      settings[REFRESH_SETTING_NAME] || REFRESH_DEFAULT_SETTING
    );
    // register auto-update of the daily note opened in the sidebar
    // It will be disabled when closing the leaf (tab).
    const component = new obsidian.Component();
    component.load();
    component.registerInterval(
      window.setInterval(() => {
        if (leaf.parent) {
          updateLeafFile(leaf, app);
        } else {
          leaf.detach();
          component.unload();
        }
      }, Number(refleshInterval) * 1000),
    );
  },
  settings: {
    name: 'Pin Note in Sidebar',
    author: 'Shane Kakau',
    options: {
      [PATH_TO_NOTE_SETTING_NAME]: {
        type: 'text',
        defaultValue: PATH_TO_NOTE,
      },
      [REFRESH_SETTING_NAME]: {
        type: 'text',
        defaultValue: REFRESH_DEFAULT_SETTING,
      },
    },
  },
};

// export const showFileInSideBar2 = async(app) => {
//     // Create WorkspaceLeaf (a tab in the right sidebar)
//     const leaf = app.workspace.getRightLeaf(false);
//     // Open file in the leaf
//     await updateLeafFile(leaf, app);
//     // Show the leaf (tab in sidebar)
//     app.workspace.revealLeaf(leaf);
//     return leaf;
// }

// set to Preview Mode
// const t = leaf.getViewState();
// t.state.mode = "preview";
// leaf.setViewState(t, {
//     focus: !0
// });
