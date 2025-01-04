const { AbstractFormInputElement } = foundry.applications.elements;

/**
 * A custom HTML element which allows for arbitrary assignment of a set of string tags.
 * This element may be used directly or subclassed to impose additional validation or functionality.
 * @extends {AbstractFormInputElement<string[]>}
 */
export class HTMLZweihanderTagsElement extends AbstractFormInputElement {
  constructor() {
    super();
    this._value = new Array();
    this._initializeTags();
  }

  /** @override */
  static tagName = 'zweihander-tags';

  static icons = {
    add: 'fa-solid fa-plus',
    remove: 'fa-solid fa-times',
  };

  static labels = {
    add: 'Add Value',
    remove: 'Remove Value',
    placeholder: '',
  };

  /**
   * The button element to add a new tag.
   * @type {HTMLButtonElement}
   */
  #button;

  /**
   * The input element to enter a new tag.
   * @type {HTMLInputElement}
   */
  #input;

  /**
   * The tags list of assigned tags.
   * @type {HTMLDivElement}
   */
  #tags;

  connectedCallback() {
    const elements = this._buildElements();
    this.replaceChildren(...elements);
    this._toggleDisabled(!this.editable);
    this._refresh();
    this.addEventListener('click', this._onClick.bind(this));
    this._activateListeners();
  }

  /* -------------------------------------------- */

  /**
   * Initialize innerText or an initial value attribute of the element as a comma-separated list of currently assigned
   * string tags.
   * @protected
   */
  _initializeTags() {
    const type = this.getAttribute('type');

    if (type === 'bonus-advances-ancestry') this._initializeStrings();
    else if (type === 'bonus-advances-profession') this._initializeObjects();

    this.innerText = '';
    this.removeAttribute('value');
  }

  _initializeStrings() {
    const initial = this.getAttribute('value') || this.innerText || '';
    const tags = initial ? initial.split(',') : [];

    // console.log('INITIALIZED STRING TAGS: ', tags);

    for (let tag of tags) {
      tag = tag.trim();
      if (tag) {
        try {
          this._validateTag(tag);
        } catch (err) {
          console.warn(err.message);
          continue;
        }
        this._value.push(tag);
      }
    }
  }

  _initializeObjects() {
    const initial = JSON.parse(atob(this.dataset['advances'])) || '';
    const tags = initial ? initial : [];

    for (let tag of tags) {
      tag.name = tag.name.trim();
      if (tag) {
        try {
          this._validateTag(tag);
        } catch (err) {
          console.warn(err.message);
          continue;
        }
        this._value.push(tag);
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Subclasses may impose more strict validation on what tags are allowed.
   * @param {string} tag      A candidate tag
   * @throws {Error}          An error if the candidate tag is not allowed
   * @protected
   */
  _validateTag(tag) {
    if (!tag) throw new Error(game.i18n.localize('ELEMENTS.TAGS.ErrorBlank'));

    const advances = ['[CB]', '[BB]', '[AB]', '[PB]', '[IB]', '[WB]', '[FB]'];
    const tagName = tag?.name ?? tag;

    if (!advances.includes(tagName))
      throw new Error(`'${tagName}' is not a valid ${tag?.name ? 'Bonus Advance' : 'Ancestral Modifier'}.`);
  }

  /* -------------------------------------------- */

  /** @override */
  _buildElements() {
    // Create tags list
    const tags = document.createElement('div');
    tags.className = 'tags input-element-tags';
    this.#tags = tags;

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = game.i18n.localize(this.constructor.labels.placeholder);
    this.#input = this._primaryInput = input;

    // Create button
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `icon ${this.constructor.icons.add}`;
    button.dataset.tooltip = this.constructor.labels.add;
    button.dataset.tooltipDirection = 'UP';
    button.ariaLabel = game.i18n.localize(this.constructor.labels.add);
    this.#button = button;
    return [this.#tags, this.#input, this.#button];
  }

  /* -------------------------------------------- */

  /** @override */
  _refresh() {
    // console.log('_VALUE: ', this._value, ' | VALUE: ', this.value);
    console.log('EDITABLE: ', this.editable);
    const tags = this.value.map((tag, i) => this.constructor.renderTag(tag, i, this.editable));
    this.#tags.replaceChildren(...tags);
  }

  /* -------------------------------------------- */

  /**
   * Render the tagged string as an HTML element.
   * @param {string} tag        The raw tag value
   * @param {string} [el]    An optional tag label or the tag's index
   * @param {boolean} [editable=true]  Is the tag editable?
   * @returns {HTMLDivElement}  A rendered HTML element for the tag
   */
  static renderTag(tag, el, editable = true) {
    const div = document.createElement('div');
    div.className = `tag ${editable ? 'remove' : ''}`;
    div.dataset.key = el;
    const span = document.createElement('span');
    span.className = `${editable ? 'remove' : ''}`;
    span.textContent = tag?.name ?? tag;
    div.append(span);
    if (editable) {
      const t = game.i18n.localize(this.labels.remove);
      const a = `<a class="remove ${this.icons.remove}" data-tooltip="${t}" data-tooltip-direction="UP" aria-label="${t}"></a>`;
      div.insertAdjacentHTML('beforeend', a);
    }
    return div;
  }

  /* -------------------------------------------- */

  /** @override */
  _activateListeners() {
    this.#button.addEventListener('click', this.#addTag.bind(this));
    this.#tags.addEventListener('click', this.#onClickTag.bind(this));
    this.#input.addEventListener('keydown', this.#onKeydown.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Remove a tag from the array when its removal button is clicked.
   * @param {PointerEvent} event
   */
  #onClickTag(event) {
    if (!event.target.classList.contains('remove')) return;
    const tag = event.target.closest('.tag');

    this._value.splice(tag.dataset.key, 1);

    this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    this._refresh();
  }

  /* -------------------------------------------- */

  /**
   * Add a tag to the array when the ENTER key is pressed in the text input.
   * @param {KeyboardEvent} event
   */
  #onKeydown(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    this.#addTag();
  }

  /* -------------------------------------------- */

  _processInput(tag) {
    const tagsType = this.getAttribute('type');

    switch (tagsType) {
      case 'bonus-advances-ancestry':
        return `[${tag.replaceAll(/\[|\]/g, '').toUpperCase().trim()}]`;
      case 'bonus-advances-profession':
        const advance = `[${tag.replaceAll(/\[|\]/g, '').toUpperCase().trim()}]`;
        return { name: advance, purchased: false };
      default:
        break;
    }
  }

  /**
   * Add a new tag to the array upon user input.
   */
  #addTag() {
    let splitInput = this.#input.value.split(',');
    let tags = splitInput.map(this._processInput.bind(this));

    for (let tag of tags) {
      // Validate the proposed code
      try {
        this._validateTag(tag);
      } catch (err) {
        ui.notifications.error(err.message);
        this.#input.value = '';
        return;
      }
    }

    // console.log('ADD TAG: ', tags, ' | _VALUE:', this._value);

    // Add hex
    tags.forEach((tag) => this._value.push(tag));
    this.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    this.#input.value = '';
    this._refresh();
  }

  /* -------------------------------------------- */
  /*  Form Handling                               */
  /* -------------------------------------------- */

  /** @override */
  _getValue() {
    return Array.from(this._value);
  }

  /* -------------------------------------------- */

  /** @override */
  _setValue(value) {
    // console.log('SET VALUE:', value);
    this._value.length = 0;
    const toAdd = [];
    for (let v of value) {
      this._validateTag(v);
      toAdd.push(v);
    }

    for (const v of toAdd) this._value.push(v);
  }

  /* -------------------------------------------- */

  /** @override */
  _toggleDisabled(disabled) {
    this.#input.toggleAttribute('disabled', disabled);
    this.#button.toggleAttribute('disabled', disabled);
    this.toggleAttribute('disabled', disabled);
  }

  /* -------------------------------------------- */

  /**
   * Create a HTMLStringTagsElement using provided configuration data.
   * @param {FormInputConfig} config
   */
  static create(config) {
    const tags = document.createElement(this.tagName);
    tags.name = config.name;
    const value = Array.from(config.value || []).join(',');
    tags.setAttribute('value', value);
    foundry.applications.fields.setInputAttributes(tags, config);
    return tags;
  }
}
