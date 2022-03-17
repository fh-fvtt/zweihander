const fortuneTrackerSettings = class extends FormApplication {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/templates/app/fortune-tracker-settings.hbs',
      popOut: true,
      minimizable: true,
      resizable: false,
      title: 'Fortune Tracker Settings',
      id: 'fortuneTrackerSettings',
      classes: ['zweihander'],
      width: 600,
      height: 275,
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  getData() {
    const data = game.settings.get('zweihander', 'fortuneTrackerSettings');
    data.choices = {};
    data.choices.size = [
      { value: "compact", label: "Compact (Text)" },
      { value: "normal", label: "Normal (Tokens)" },
      { value: "big", label: "Big (Tokens)" },
      { value: "huge", label: "Huge (Tokens)" }
    ].map(option => ({ selected: (data.size ?? 'normal') === option.value ? 'selected' : '', ...option }));
    data.choices.notifications = [
      { value: "none", label: "Don't Alert" },
      { value: "notify", label: "Post Foundry Notifications" },
      { value: "chat", label: "Post Chat Messages" },
    ].map(option => ({ selected: (data.notifications ?? 'notify') === option.value ? 'selected' : '', ...option }));
    return data;
  }

  _updateObject(event, formData) {
    const data = expandObject(formData);
    game.settings.set('zweihander', 'fortuneTrackerSettings', data);
  }
}


export default class FortuneTracker extends Application {

  static INSTANCE = undefined;

  static get PARAMS() {
    const size = game.settings.get("zweihander", "fortuneTrackerSettings").size;
    switch (size) {
      case "compact":
        return {
          compact: true,
          tokenSize: 25,
          padding: 0,
          areaSize: 80
        }
      case "normal":
        return {
          tokenSize: 64,
          padding: 5,
          areaSize: 120
        }
      case "big":
        return {
          tokenSize: 83,
          padding: 10,
          areaSize: 180
        }
      case "huge":
        return {
          tokenSize: 125,
          padding: 15,
          areaSize: 300
        }
    }
  }

  static registerPersistingSettings() {
    game.settings.register("zweihander", "fortuneTrackerPersistedState", {
      scope: "world",
      config: false,
      type: Object,
      default: {
        total: 0,
        used: 0,
        removed: 0
      }
    });
    game.settings.register("zweihander", "fortuneTrackerSettings", {
      scope: "world",
      config: false,
      type: Object,
      default: {
        removeUsedMisfortune: false,
        notifications: "notify",
        size: "normal",
        fortunePath: "systems/zweihander/assets/fortune-life.webp",
        misfortunePath: "systems/zweihander/assets/fortune-death.webp"
      }
    });
    game.settings.registerMenu("zweihander", "fortuneTrackerSettingsMenu", {
      name: "Fortune Tracker Settings",
      label: "Fortune Tracker Settings",      // The text label used in the button
      hint: "Configure the look & behavior of the Fortune Tracker.",
      icon: "ra ra-scroll-unfurled",               // A Font Awesome icon used in the submenu button
      type: fortuneTrackerSettings,   // A FormApplication subclass
      restricted: true                   // Restrict this submenu to gamemaster only?
    });
    //todo remove this after a while
    const settings = game.settings.get('zweihander', 'fortuneTrackerSettings');
    if (game.user.isGM && settings.fortunePath === 'systems/zweihander/assets/fortune-life.png') {
      settings.fortunePath = 'systems/zweihander/assets/fortune-life.webp';
      settings.misfortunePath = 'systems/zweihander/assets/fortune-death.webp';
      game.settings.set('zweihander', 'fortuneTrackerSettings', settings);
    }
  }

  // business logic

  #waiting = false;

  #state = {
    total: 0,
    used: 0,
    removed: 0
  }

  #socket;

  #positions = [];

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/templates/app/fortune-tracker.hbs',
      popOut: true,
      minimizable: false,
      resizable: false,
      title: 'Fortune Tracker',
      id: 'fortuneTrackerApp',
      classes: ['zweihander'],
      width: FortuneTracker.PARAMS.areaSize * 2,
      height: FortuneTracker.PARAMS.areaSize + 40,
      top: 150,
      left: 125
    });
  }

  constructor(socket) {
    super();
    const that = this;
    function requestSync(state, requestingUserId) {
      if (state) {
        let validationError = that.validate(state, requestingUserId);
        if (!validationError) {
          socket.executeForEveryone("broadcastState", state);
        } else {
          socket.executeForEveryone("broadcastState", that.state);
          socket.executeAsUser("showIllegalStateNotification", requestingUserId, validationError);
        }
      }
      return that.state;
    }

    function broadcastState(state) {
      that.state = state;
    }

    function showIllegalStateNotification(validationError) {
      ui.notifications.error(validationError);
    }

    socket.register("requestSync", requestSync);
    socket.register("broadcastState", broadcastState);
    socket.register("showIllegalStateNotification", showIllegalStateNotification);

    this.#socket = socket;

    // generate random positions
    this.generateRandomPositionValues();
  }

  get resetRule() {
    return "Set total fortune points to the number of connected players plus one.";
  }

  get removeUsedMisfortune() {
    return game.settings.get("zweihander", "fortuneTrackerSettings").removeUsedMisfortune;
  }

  get state() {
    return {
      total: this.#state.total,
      used: this.#state.used,
      removed: this.#state.removed
    }
  }

  set state(updatedState) {
    if (updatedState.used !== this.used || updatedState.removed !== this.removed || updatedState.total !== this.total) {
      this.playAudio();
    }
    this.#waiting = false;
    this.#state = updatedState;
    if (game.users.get(game.userId).isGM) {
      game.settings.set("zweihander", "fortuneTrackerPersistedState", updatedState);
    }
    this.render(!this.closable);
  }

  get total() {
    return this.#state.total;
  }

  increaseTotal() {
    const s = this.state;
    s.total++;
    return s;
  }

  decreaseTotal() {
    const s = this.state;
    s.total--;
    if (s.total < s.used) {
      s.used--;
    }
    if (s.total < s.removed) {
      s.removed--;
    }
    return s;
  }

  //TODO implement different rule systems
  spendFortune() {
    const s = this.state;
    s.used++;
    return s;
  }

  //TODO implement different rule systems
  spendMisfortune() {
    const s = this.state;
    if (this.removeUsedMisfortune) {
      s.removed++;
    } else {
      s.used--;
    }
    return s;
  }

  get used() {
    return this.#state.used;
  }

  get removed() {
    return this.#state.removed;
  }

  get fortune() {
    return this.total - this.used;
  }

  get misfortune() {
    return this.used - this.removed;
  }

  generateRandomPositionValues(keepFortune = 0, keepMisfortune = 0) {

    function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
    }

    const n = (keepFortune > 100) ? 200 : (keepFortune * 2) % 201;
    const m = (keepMisfortune > 100) ? 400 : 200 + (keepMisfortune * 2) % 201;

    for (let i = n; i < 400; i++) {
      if (i < 200 || (i >= m && i < 400)) {
        this.#positions[i] = (getRandomIntInclusive(FortuneTracker.PARAMS.padding, FortuneTracker.PARAMS.areaSize - FortuneTracker.PARAMS.tokenSize - FortuneTracker.PARAMS.padding));
      }
    }

  }
  //TODO implement different rule systems
  validate(updatedState, requestingUserId) {
    // console.log(this.state);
    // console.log(updatedState);
    const notifySetting = game.settings.get("zweihander", "fortuneTrackerSettings").notifications;
    const user = game.users.get(requestingUserId);
    if (updatedState.total !== this.total && !user.isGM) {
      return "You are not privileged to change the total amount of fortune in the game!";
    } else if (updatedState.removed !== this.removed && !user.isGM) {
      return "You are not privileged to spend misfortune! Know your place peasant, or be smited!";
    } else if (updatedState.used < this.used && !user.isGM) {
      return "You are not privileged to spend misfortune! Know your place, peasant!";
    } else if (updatedState.total < 0) {
      return "Sorry, but you can't have a negative amount of fortune. Kindly turn a demon or a foul god for the equivalent outcome!";
    } else if (updatedState.used < 0) {
      return "There is no misfortune left for the GM at this time.";
    } else if (updatedState.removed < 0) {
      return "Can't have negative removed tokens! (You should never see this error. If you do, please contact the developer.)";
    } else if (updatedState.used > updatedState.total) {
      return "There is no fortune left for the party at this time."
    } else if (updatedState.removed > updatedState.used) {
      return "There is no misfortune left for the GM at this time."
    } else {
      if (updatedState.used === this.used + 1) {
        const name = user.charname ? user.charname : user.name;
        if (notifySetting === "notify") {
          ui.notifications.info(`${name} used a fortune point. Current fortune points: ${updatedState.total - updatedState.used}/${updatedState.total}`);
        } else if (notifySetting === "chat") {
          ChatMessage.create({ user: requestingUserId, content: `${name} used a fortune point. Let's hope they make it count! <p><b>Current fortune points: ${updatedState.total - updatedState.used}/${updatedState.total} </b></p>` })
        }
      } else if ((updatedState.remove === this.remove + 1 || updatedState.used === this.used - 1) && this.total === updatedState.total) {
        if (notifySetting === "notify") {
          ui.notifications.info(`Brace yourselves, the GM used a misfortune point! Current fortune points: ${updatedState.total - updatedState.used}/${updatedState.total}`);
        } else if (notifySetting === "chat") {
          ChatMessage.create({ user: requestingUserId, content: `Brace yourselves, the GM used a misfortune point! <p><b>Current fortune points: ${updatedState.total - updatedState.used}/${updatedState.total} </b></p>` })
        }
      }
      return false;
    }
  }

  // Foundry methods
  getData() {
    this.generateRandomPositionValues(this.fortune, this.misfortune);
    let fortunePositions = [];
    for (let i = 0; i < this.fortune; i++) {
      let t = this.#positions[2 * (i % 100)];
      let l = this.#positions[2 * (i % 100) + 1];
      fortunePositions.push({ t, l })
    }
    let misfortunePositions = [];
    for (let i = 0; i < this.misfortune; i++) {
      let t = this.#positions[2 * (i % 100) + 200];
      let l = this.#positions[2 * (i % 100) + 201];
      misfortunePositions.push({ t, l })
    }
    return {
      total: this.total,
      fortune: {
        value: this.fortune,
        positions: fortunePositions,
        path: game.settings.get("zweihander", "fortuneTrackerSettings").fortunePath
      },
      misfortune: {
        value: this.misfortune,
        positions: misfortunePositions,
        path: game.settings.get("zweihander", "fortuneTrackerSettings").misfortunePath
      },
      waiting: this.#waiting,
      params: FortuneTracker.PARAMS
    }
  }

  async syncState() {
    if (game.users.get(game.userId).isGM) {
      this.#state = game.settings.get("zweihander", "fortuneTrackerPersistedState");
      this.#waiting = false;
      this.#socket.executeForOthers("broadcastState", this.state);
    } else {
      this.#state = await this.requestSync();
    }
    this.render(!this.closable);
  }

  resetState() {
    if (game.users.get(game.userId).isGM) {
      const activePlayers = game.users.players.map(x => (x.active ? 1 : 0)).reduce((x, y) => x + y, 0);
      this.state = {
        total: activePlayers + 1, //TODO: customize this for rule systems
        used: 0,
        removed: 0
      }
      this.#socket.executeForOthers("broadcastState", this.state);
    } else {
      ui.notifications.error("Only the GM may reset the fortune tracker. Keep your dirty hands to yourself, foolish thing!");
    }
  }

  async requestSync(updatedState, rethrow = false) {
    try {
      if (updatedState) {
        return await this.#socket.executeAsGM("requestSync", updatedState, game.userId);
      } else {
        return await this.#socket.executeAsGM("requestSync");
      }
    } catch (e) {
      console.error(e);
      this.#waiting = true;
      this.render(!this.closable);
      ui.notifications.warn("Fortune Tracker is waiting for a GM to (re)connect.");
      if (rethrow) {
        throw e;
      }
      return this.state;
    }
  }

  async close() {
    // can't touch (close) this
  }

  activateListeners(html) {
    const app = html.parents("#fortuneTrackerApp");
    let totalTrigger;
    if (!app.find('#fortuneTrackerAppTotal').length) {
      app.find('a.header-button.close').before(`
        <a id="fortuneTrackerAppTotal" class="waiting-${this.#waiting}">
          Total: ${this.total}
        </a>
        <a class="fortune-tracker-reset" title="${this.resetRule}">
          <i class="fas fa-sync-alt"></i>
        </a>
      `);
      let resetTrigger = app.find('.fortune-tracker-reset');
      resetTrigger.click(event => {
        event.preventDefault();
        this.resetState();
      });
      totalTrigger = app.find('#fortuneTrackerAppTotal');
      app.find('a.header-button.close').remove();
    } else {
      app.find('#fortuneTrackerAppTotal')
        .replaceWith(`<a id="fortuneTrackerAppTotal" class="waiting-${this.#waiting}">Total: ${this.total}</a>`);
      totalTrigger = app.find('#fortuneTrackerAppTotal')
    }
    totalTrigger.click(event => {
      event.preventDefault();
      this.requestSync(this.increaseTotal());
    });
    totalTrigger.contextmenu(event => {
      event.preventDefault();
      this.requestSync(this.decreaseTotal());
    });

    let fortuneTrigger = html.find('.fortune-tracker-fortune-trigger');
    fortuneTrigger.click(event => {
      event.preventDefault();
      this.requestSync(this.spendFortune());
    });

    let misfortuneTrigger = html.find('.fortune-tracker-misfortune-trigger');
    misfortuneTrigger.click(event => {
      event.preventDefault();
      this.requestSync(this.spendMisfortune());
    });
  }

  async useFortune() {
    const fortuneBefore = this.fortune;
    this.state = await this.requestSync(this.spendFortune(), true);
    if (fortuneBefore === this.fortune) {
      throw "Can't use fortune!";
    }
    return true;
  }

  async useMisfortune() {
    const misfortuneBefore = this.misfortune;
    this.state = await this.requestSync(this.spendMisfortune(), true);
    if (misfortuneBefore === this.misfortune) {
      throw "Can't use misfortune!";
    }
    return true;
  }

  playAudio() {
    AudioHelper.play({ src: 'systems/zweihander/assets/sounds/coins.mp3', volume: 0.5, loop: false }, true);
  }
}