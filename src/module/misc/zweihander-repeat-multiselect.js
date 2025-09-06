import { normalizedEquals } from '../utils';
import { HTMLZweihanderTagsElement } from './zweihander-tags';

const { AbstractMultiSelectElement } = foundry.applications.elements;

export class HTMLZweihanderRepeatMultiSelectElement extends AbstractMultiSelectElement {
  /** @override */
  static tagName = 'zweihander-repeat-multi-select';

  /** @override */
  _value = new Array();

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

  /* -------------------------------------------- */

  /** @override */
  _initialize() {
    this._options = [...this.children];

    // @todo: refactor atob
    const initial = JSON.parse(atob(this.dataset['bonusAdvances']));

    const occurrences = initial.reduce((acc, val) => {
      return acc[val.name] ? ++acc[val.name] : (acc[val.name] = 1), acc;
    }, {});

    const occurencesKeys = Object.keys(occurrences);

    for (const option of this.querySelectorAll('option')) {
      if (!option.value) continue; // Skip predefined options which are already blank
      this._choices[option.value] = option.innerText;

      if (occurencesKeys.includes(option.value)) {
        const flatInitial = initial.map((bao) => bao.name);
        const indexOfOption = flatInitial.indexOf(option.value);
        const toAdd = initial.splice(indexOfOption, 1);

        for (let i = 0; i < occurrences[option.value]; i++) {
          this._value.push(...toAdd);
        }

        option.selected = false;
      }
    }

    // console.log('_CHOICES: ', this._choices, ' | _VALUE: ', this._value);
  }

  /* -------------------------------------------- */

  /** @override */
  select(value) {
    if (!(value in this._choices)) {
      throw new Error(`"${value}" is not an option allowed by this multi-select element`);
    }
    this._value.push({ name: value, purchased: false });
    this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    this._refresh();
  }

  /* -------------------------------------------- */

  /** @override */
  unselect(idx) {
    if (idx > this._value.length) throw new Error(`Cannot remove element at index #${idx}: out of bounds`);

    this._value.splice(idx, 1);
    this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    this._refresh();
  }

  /* -------------------------------------------- */

  _some(set, predicate) {
    for (const item of set) if (predicate(item)) return true;
    return false;
  }

  /* -------------------------------------------- */
  /*  Form Handling                               */
  /* -------------------------------------------- */

  /** @override */
  _getValue() {
    return this._value;
  }

  /* -------------------------------------------- */

  /** @override */
  _buildElements() {
    // Create select element
    this.#select = this._primaryInput = document.createElement('select');
    this.#select.insertAdjacentHTML('afterbegin', '<option value=""></option>');
    this.#select.append(...this._options);

    // Create a div element for display
    this.#tags = document.createElement('div');
    this.#tags.className = 'tags input-element-tags';
    return [this.#tags, this.#select];
  }

  /* -------------------------------------------- */

  /** @override */
  _refresh() {
    // Update the displayed tags
    const tags = this._value.map((id, idx) => {
      return HTMLZweihanderTagsElement.renderTag(id.name, idx, this.editable);
    });
    this.#tags.replaceChildren(...tags);

    // Disable selected options
    for (const option of this.#select.querySelectorAll('option')) {
      option.disabled = this._value.includes(option.value);
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

  /* -------------------------------------------- */

  /**
   * Handle click events on a tagged value, removing it from the chosen set.
   * @param {PointerEvent} event    The originating click event on a chosen tag
   */
  #onClickTag(event) {
    event.preventDefault();
    if (!event.target.classList.contains('remove') || !this.editable) return;
    const tag = event.target.closest('.tag');
    this.unselect(tag.dataset.key);
  }

  /* -------------------------------------------- */

  /** @override */
  _toggleDisabled(disabled) {
    this.#select.disabled = disabled;
  }
}
