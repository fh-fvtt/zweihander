export default class FortuneTracker extends Application {

  static get PARAMS() {
    const size = game.settings.get("zweihander", "fortuneTrackerSize");
    switch (size) {
      case "compact":
        return {
          compact: true,
          tokenSize: 25,
          padding: 0,
          areaSize: 60
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
    game.settings.register("zweihander", "fortuneTrackerPersistedStateTotal", {
      name: "fortuneTrackerPersistedStateTotal",
      hint: "",
      scope: "world",
      type: Number,
      default: 0,
      config: false
    });
    game.settings.register("zweihander", "fortuneTrackerPersistedStateUsed", {
      name: "fortuneTrackerPersistedStateUsed",
      hint: "",
      scope: "world",
      type: Number,
      default: 0,
      config: false
    });
    game.settings.register("zweihander", "fortuneTrackerPersistedStateRemoved", {
      name: "fortuneTrackerPersistedStateRemoved",
      hint: "",
      scope: "world",
      type: Number,
      default: 0,
      config: false
    });
    game.settings.register("zweihander", "fortuneTrackerRuleSystem", {
      name: "Fortune Tracker Rule System",
      hint: "Choose how you wish to implement fortune points and misfortune points in your game.",
      scope: "world",
      type: String,
      choices: {
        "remove": "Using misfortune points removes them from the game",
        "keep": "Using misfortune points returns them to the party as fortune points"
      },
      default: "remove",
      config: true
    });
    game.settings.register("zweihander", "fortuneTrackerNotifications", {
      name: "Fortune Tracker Notification Behaviour",
      hint: "Choose how you wish to be notified about spent Fortune points.",
      scope: "world",
      type: String,
      choices: {
        "none": "No Notifications (See current value on hovering tokens)",
        "notify": "Post Foundry Notifications",
        "chat": "Post Chat Messages"
      },
      default: "notify",
      config: true
    });
    game.settings.register("zweihander", "fortuneTrackerSize", {
      name: "Fortune Tracker Size",
      hint: "Choose the size of your fortune tracker.",
      scope: "client",
      type: String,
      choices: {
        "compact": "Compact (Text)",
        "normal": "Normal (Tokens)",
        "big": "Big (Tokens)",
        "huge": "Huge (Tokens)"
      },
      default: "normal",
      config: true
    });
    game.settings.register("zweihander", "fortuneTrackerFortunePath", {
      name: "Fortune Token Image",
      hint: "Customize the fortune token image. For best appearance use an image of at least 125x125 pixels.",
      scope: "world",
      type: String,
      default: "systems/zweihander/assets/fortune-life.png",
      config: true
    });
    game.settings.register("zweihander", "fortuneTrackerMisfortunePath", {
      name: "Misfortune Token Image",
      hint: "Customize the misfortune token image. For best appearance use an image of at least 125x125 pixels.",
      scope: "world",
      type: String,
      default: "systems/zweihander/assets/fortune-death.png",
      config: true
    });
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

  // this should be refactored to a getter if we ever offer the user to close the fortune tracker app
  #closable = false;



  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/zweihander/templates/fortune-tracker.hbs',
      popOut: true,
      resizable: false,
      title: 'Fortune Tracker',
      id: 'fortuneTrackerApp',
      classes: ['zweihander'],
      width: FortuneTracker.PARAMS.areaSize * 2,
      height: FortuneTracker.PARAMS.areaSize + 30,
      top: 60,
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
      } else {
        return that.state;
      }
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

  get rules() {
    return game.settings.get("zweihander", "fortuneTrackerRuleSystem");
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
      game.settings.set("zweihander", "fortuneTrackerPersistedStateTotal", this.total);
      game.settings.set("zweihander", "fortuneTrackerPersistedStateUsed", this.used);
      game.settings.set("zweihander", "fortuneTrackerPersistedStateRemoved", this.removed);
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
    const r = this.rules;
    if (r === "keep") {
      s.used--;
    } else {
      s.removed++;
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

  generateRandomPositionValues(keepFortune=0, keepMisfortune=0) {

    function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
    }

    const n = (keepFortune * 2) % 20;
    const m = 20 + (keepMisfortune * 2) % 20;
    
    for (let i = n; i < 40; i++) {
      if (i < 20 || (i >= m && i < 40)) {
        this.#positions[i] = (getRandomIntInclusive(FortuneTracker.PARAMS.padding, FortuneTracker.PARAMS.areaSize - FortuneTracker.PARAMS.tokenSize - FortuneTracker.PARAMS.padding));
      }
    }
    
  }
  //TODO implement different rule systems
  validate(updatedState, requestingUserId) {
    // console.log(this.state);
    // console.log(updatedState);
    const notifySetting = game.settings.get("zweihander", "fortuneTrackerNotifications");
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
          ui.notifications.info(`${name} used a fortune point. Current fortune points: ${updatedState.total-updatedState.used}/${updatedState.total}`);
        } else if (notifySetting === "chat") {
          ChatMessage.create({user: requestingUserId, content: `${name} used a fortune point. Let's hope they make it count! <p><b>Current fortune points: ${updatedState.total-updatedState.used}/${updatedState.total} </b></p>`})
        }
      } else if ((updatedState.remove === this.remove + 1 || updatedState.used === this.used - 1) && this.total === updatedState.total) {
        if (notifySetting === "notify") {
          ui.notifications.info(`Brace yourselves, the GM used a misfortune point! Current fortune points: ${updatedState.total-updatedState.used}/${updatedState.total}`);
        } else if (notifySetting === "chat") {
          ChatMessage.create({user: requestingUserId, content: `Brace yourselves, the GM used a misfortune point! <p><b>Current fortune points: ${updatedState.total-updatedState.used}/${updatedState.total} </b></p>`})
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
      let t = this.#positions[2 * (i % 10)];
      let l = this.#positions[2 * (i % 10) + 1];
      fortunePositions.push({ t, l })
    }
    let misfortunePositions = [];
    for (let i = 0; i < this.misfortune; i++) {
      let t = this.#positions[2 * (i % 10) + 20];
      let l = this.#positions[2 * (i % 10) + 21];
      misfortunePositions.push({ t, l })
    }
    return {
      total: this.total,
      fortune: {
        value: this.fortune,
        positions: fortunePositions,
        path: game.settings.get("zweihander", "fortuneTrackerFortunePath")
      },
      misfortune: {
        value: this.misfortune,
        positions: misfortunePositions,
        path: game.settings.get("zweihander", "fortuneTrackerMisfortunePath")
      },
      waiting: this.#waiting,
      params: FortuneTracker.PARAMS
    }
  }

  async syncState() {
    if (game.users.get(game.userId).isGM) {
      this.#state = {
        total: game.settings.get("zweihander", "fortuneTrackerPersistedStateTotal"),
        used: game.settings.get("zweihander", "fortuneTrackerPersistedStateUsed"),
        removed: game.settings.get("zweihander", "fortuneTrackerPersistedStateRemoved")
      };
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

  async requestSync(updatedState) {
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
      return this.state;
    }
  }

  // toggle() {
  //   if (this.rendered) {
  //     this.close();
  //   } else {
  //     this.render(true);
  //     this.syncState();
  //   }    
  // }

  // hookToChatTab(app, html, data) {
  //   if (app.tabName === "chat") {
  //     let controls = html.find('#chat-controls > .control-buttons');
  //     controls.css({flex: "0 0 auto"});
  //     controls.prepend(`
  //       <a class="open-fortune-tracker" title="Toggle Fortune Tracker">
  //         <i class="fas ra ra-circle-of-circles"></i>
  //       </a>
  //     `);
  //     html.find(".open-fortune-tracker").click(this.toggle.bind(this))
  //   }
  // }

  // This should go to main.js if we ever fancy to offer the user to close the fortune tracker. 
  // Hooks.on("renderSidebarTab", (app, html, data) => {
  //   fortuneTrackerApp.hookToChatTab(app, html, data);
  // })

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

  playAudio() {
    AudioHelper.play({src: 'systems/zweihander/assets/sounds/coins.mp3', volume: 0.5, loop: false}, true);
  }
}