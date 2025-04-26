import { normalizedEquals } from '../utils';
import { HTMLZweihanderTagsElement } from './zweihander-tags';

const { AbstractMultiSelectElement } = foundry.applications.elements;

export class HTMLZweihanderMultiSelectElement extends AbstractMultiSelectElement {
  /** @override */
  static tagName = 'zweihander-multi-select';

  /**
   * A select element used to choose options.
   * @type {HTMLSelectElement}
   */
  #select;

  /**
   * A display element which lists the chosen options.
   * @type {HTMLDivElement}
   */
  #tags;

  /**
   * Preserve existing <option> and <optgroup> elements which are defined in the original HTML.
   * @protected
   */
  _initialize() {
    this._options = [...this.children];

    // @todo: refactor atob
    const initial = JSON.parse(atob(this.dataset['skillRanks']));

    for (const option of this.querySelectorAll('option')) {
      if (!option.value) continue; // Skip predefined options which are already blank
      this._choices[option.value] = option.innerText;
      if (option.selected) {
        this._value.add(initial.find((i) => i.name.trim().toLowerCase() === option.value));
        option.selected = false;
      }
    }

    // console.log('_CHOICES: ', this._choices, ' | _VALUE: ', this._value);
  }

  /* -------------------------------------------- */

  /** @override */
  _buildElements() {
    // Create select element
    this.#select = this._primaryInput = document.createElement('select');
    this.#select.insertAdjacentHTML('afterbegin', '<option value=""></option>');
    this.#select.append(...this._options);
    this.#select.disabled = !this.editable;

    // Create a div element for display
    this.#tags = document.createElement('div');
    this.#tags.className = 'tags input-element-tags';
    return [this.#tags, this.#select];
  }

  /* -------------------------------------------- */

  /** @override */
  _refresh() {
    // Update the displayed tags
    const tags = Array.from(this._value).map((id) => {
      return HTMLZweihanderTagsElement.renderTag(this._choices[id.name.toLowerCase()], id.name, this.editable);
    });
    this.#tags.replaceChildren(...tags);

    // Disable selected options
    for (const option of this.#select.querySelectorAll('option')) {
      option.disabled = this._some(this._value, (el) => normalizedEquals(el.name, option.value));
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _activateListeners() {
    this.#select.addEventListener('change', this.#onChangeSelect.bind(this));
    this.#tags.addEventListener('click', this.#onClickTag.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle changes to the Select input, marking the selected option as a chosen value.
   * @param {Event} event         The change event on the select element
   */
  #onChangeSelect(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const select = event.currentTarget;
    if (!select.value) return; // Ignore selection of the blank value
    this.select(select.value);
    select.value = '';
  }

  /**
   * Mark a choice as selected.
   * @param {string} value      The value to add to the chosen set
   */
  select(value) {
    // const exists = this._value.has(value);

    const exists = this._some(this._value, (el) => el.name.trim().toLowerCase() === value.trim().toLowerCase());

    if (!exists) {
      if (!(value in this._choices)) {
        throw new Error(`"${value}" is not an option allowed by this multi-select element`);
      }
      this._value.add({ name: value, purchased: false });
      this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      this._refresh();
    }
  }

  /**
   * Mark a choice as un-selected.
   * @param {string} value      The value to delete from the chosen set
   */
  unselect(value) {
    // const exists = this._value.has(value);

    const exists = this._some(this._value, (el) => el.name.trim().toLowerCase() === value.trim().toLowerCase());

    if (exists) {
      this._value.forEach((el) => {
        if (el.name.trim().toLowerCase() === value.trim().toLowerCase()) this._value.delete(el);
      });
      this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      this._refresh();
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle click events on a tagged value, removing it from the chosen set.
   * @param {PointerEvent} event    The originating click event on a chosen tag
   */
  #onClickTag(event) {
    event.preventDefault();
    if (!event.target.classList.contains('remove')) return;
    if (!this.editable) return;
    const tag = event.target.closest('.tag');
    this.unselect(tag.dataset.key);
  }

  _some(set, predicate) {
    for (const item of set) if (predicate(item)) return true;
    return false;
  }

  /* -------------------------------------------- */

  /** @override */
  _toggleDisabled(disabled) {
    this.#select.toggleAttribute('disabled', disabled);
    this.toggleAttribute('disabled', disabled);
  }

  /* -------------------------------------------- */

  /**
   * Create a HTMLMultiSelectElement using provided configuration data.
   * @param {FormInputConfig<string[]> & Omit<SelectInputConfig, "blank">} config
   * @returns {HTMLMultiSelectElement}
   */
  static create(config) {
    return foundry.applications.fields.createMultiSelectInput(config);
  }
}
