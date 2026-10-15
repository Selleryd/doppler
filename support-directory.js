(() => {
  document.querySelectorAll('[data-support-directory]').forEach(directory => {
    if (directory.dataset.supportReady) return;
    const choices = [...directory.querySelectorAll('[data-support-choice]')];
    const detail = directory.querySelector('[data-support-detail]');
    const title = detail?.querySelector('[data-support-title]');
    const description = detail?.querySelector('[data-support-description]');
    const fallback = directory.querySelector('[data-support-fallback]');
    if (!choices.length || !detail || !title || !description || !fallback) return;

    // Anchors and native details are the no-JavaScript version. Only enhance
    // after all of the content is present; no selection is stored or submitted.
    const buttons = choices.map(choice => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = choice.className;
      button.dataset.supportIndex = choice.dataset.supportIndex;
      button.dataset.supportTitle = choice.dataset.supportTitle;
      button.dataset.supportDescription = choice.dataset.supportDescription;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-controls', `${directory.id}-detail`);
      button.append(...choice.childNodes);
      choice.replaceWith(button);
      return button;
    });

    function select(button) {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      title.textContent = button.dataset.supportTitle;
      description.textContent = button.dataset.supportDescription;
    }

    detail.id = `${directory.id}-detail`;
    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    // Keep native button tab/enter/space behavior: this is an informational
    // choice grid, not a form field or a tab interface with hidden panels.
    select(buttons[0]);
    fallback.hidden = true;
    detail.hidden = false;
    directory.dataset.supportReady = 'true';
  });
})();
