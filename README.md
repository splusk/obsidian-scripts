---
created: 2024-03-23T20:34
updated: 2024-04-25T08:12
---
## General
Files are hidden cause they are either `js` or `css` files. So you need to use something else (like  the `terminal` and `vim`) to view them

## CSS
More info [[CSS-Tips|Here]]

## Task-Calendar and Task-Timeline
These are scripts you found online.
- [Obsidian-Tasks-Calendar](https://github.com/702573N/Obsidian-Tasks-Calendar)
- [Obsidian-Tasks-Timeline](https://github.com/702573N/Obsidian-Tasks-Timeline)

## Old Stuff
Old stuff has been archived `/archive/src` (in the root of this vault)

## Example Snippets
Try to open file/leaf in edit mode 
```js
const leaf = activeView.leaf;
const viewState = leaf.getViewState();
viewState.state.mode = 'source';
leaf.setViewState(viewState);
```
Alternative way to show file in sidebar
```js
export const showFileInSideBar2 = async(app) => {
    // Create WorkspaceLeaf (a tab in the right sidebar)
    const leaf = app.workspace.getRightLeaf(false);
    // Open file in the leaf
    await updateLeafFile(leaf, app);
    // Show the leaf (tab in sidebar)
    app.workspace.revealLeaf(leaf);
    return leaf;
}
```
Open file in preview mode
```js
//set to Preview Mode
const t = leaf.getViewState();
t.state.mode = "preview";
leaf.setViewState(t, {
    focus: !0
});
```