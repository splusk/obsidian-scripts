const currFile = dv.current()?.file;

// Fetch all notes ordered by date
const pages = await dv
  .pages('"Notes/Daily Notes"')
  .filter((p) => p.file.day)
  .sort((p) => p.file.day);

// Variables used when looking for previous and next links
let thisPrevious = null;
let thisNext = null;
let previous = null; // Intermediate candidate for previous link

// Loop through looking for next and previous links
for (let page of pages) {
  if (previous && page.file.path === currFile.path) {
    thisPrevious = previous.file;
  }

  if (previous && previous.file.path === currFile.path) {
    thisNext = page.file;
    break;
  }

  // We've not found both, so update previous candidate
  // and lets loop again
  previous = page;
}

// Output the links
dv.span(
  [
    thisPrevious ? '<< ' + thisPrevious.link : '<< No previous',
    thisNext ? thisNext.link + ' >>' : 'No next >>',
  ].join(' | '),
);
