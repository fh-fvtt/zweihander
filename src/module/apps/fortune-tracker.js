const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class FortuneTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  static INSTANCE = undefined;

  static get PARAMS() {
    const size = game.settings.get('zweihander', 'fortuneTrackerSettings').size;
    switch (size) {
      case 'compact':
        return {
          compact: true,
          tokenSize: 25,
          padding: 0,
          areaSize: 80,
        };
      case 'normal':
        return {
          tokenSize: 64,
          padding: 5,
          areaSize: 120,
        };
      case 'big':
        return {
          tokenSize: 83,
          padding: 10,
          areaSize: 180,
        };
      case 'huge':
        return {
          tokenSize: 125,
          padding: 15,
          areaSize: 300,
        };
    }
  }

  #waiting = false;

  #state = {
    total: 0,
    used: 0,
    removed: 0,
  };

  #socket;

  #positions = [];

  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: 'fortuneTrackerApp',
    classes: ['zweihander'],
    window: {
      minimizable: false,
      resizable: false,
      icon: 'ra ra-clover',
    },
    position: {
      top: 150,
      left: 125,
    },
  };

  static PARTS = {
    tracker: { template: 'systems/zweihander/src/templates/app/fortune-tracker.hbs' },
  };

  constructor(socket) {
    super();
    const that = this;
    function requestSync(state, requestingUserId) {
      if (state) {
        let validationError = that.validate(state, requestingUserId);
        if (!validationError) {
          socket.executeForEveryone('broadcastState', state);
        } else {
          socket.executeForEveryone('broadcastState', that.state);
          socket.executeAsUser('showIllegalStateNotification', requestingUserId, validationError);
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

    socket.register('requestSync', requestSync);
    socket.register('broadcastState', broadcastState);
    socket.register('showIllegalStateNotification', showIllegalStateNotification);

    this.#socket = socket;

    // generate random positions
    this.generateRandomPositionValues();
  }

  generateRandomPositionValues(keepFortune = 0, keepMisfortune = 0) {
    function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
    }

    const n = keepFortune > 100 ? 200 : (keepFortune * 2) % 201;
    const m = keepMisfortune > 100 ? 400 : 200 + ((keepMisfortune * 2) % 201);

    for (let i = n; i < 400; i++) {
      if (i < 200 || (i >= m && i < 400)) {
        this.#positions[i] = getRandomIntInclusive(
          FortuneTracker.PARAMS.padding,
          FortuneTracker.PARAMS.areaSize - FortuneTracker.PARAMS.tokenSize - FortuneTracker.PARAMS.padding
        );
      }
    }
  }

  get title() {
    return game.i18n.localize('ZWEI.settings.ftsettings.title');
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);

    initialized.position.width = FortuneTracker.PARAMS.areaSize * 2;
    initialized.position.height = FortuneTracker.PARAMS.areaSize + 40;

    return initialized;
  }

  get resetRule() {
    return game.i18n.localize('ZWEI.othermessages.setfortune');
  }

  get removeUsedMisfortune() {
    return game.settings.get('zweihander', 'fortuneTrackerSettings').removeUsedMisfortune;
  }

  get state() {
    return {
      total: this.#state.total,
      used: this.#state.used,
      removed: this.#state.removed,
    };
  }

  set state(updatedState) {
    if (updatedState.used !== this.used || updatedState.removed !== this.removed || updatedState.total !== this.total) {
      this.playAudio();
    }
    this.#waiting = false;
    this.#state = updatedState;
    if (game.users.get(game.userId).isGM) {
      game.settings.set('zweihander', 'fortuneTrackerPersistedState', updatedState);
    }
    this.render({ force: !this.closable });
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

    const n = keepFortune > 100 ? 200 : (keepFortune * 2) % 201;
    const m = keepMisfortune > 100 ? 400 : 200 + ((keepMisfortune * 2) % 201);

    for (let i = n; i < 400; i++) {
      if (i < 200 || (i >= m && i < 400)) {
        this.#positions[i] = getRandomIntInclusive(
          FortuneTracker.PARAMS.padding,
          FortuneTracker.PARAMS.areaSize - FortuneTracker.PARAMS.tokenSize - FortuneTracker.PARAMS.padding
        );
      }
    }
  }
  //TODO implement different rule systems
  validate(updatedState, requestingUserId) {
    // console.log(this.state);
    // console.log(updatedState);
    const notifySetting = game.settings.get('zweihander', 'fortuneTrackerSettings').notifications;
    const user = game.users.get(requestingUserId);
    if (updatedState.total !== this.total && !user.isGM) {
      return game.i18n.localize('ZWEI.othermessages.changefortune');
    } else if (updatedState.removed !== this.removed && !user.isGM) {
      return game.i18n.localize('ZWEI.othermessages.spendmisfortune1');
    } else if (updatedState.used < this.used && !user.isGM) {
      return game.i18n.localize('ZWEI.othermessages.spendmisfortune2');
    } else if (updatedState.total < 0) {
      return game.i18n.localize('ZWEI.othermessages.negativefortune');
    } else if (updatedState.used < 0) {
      return game.i18n.localize('ZWEI.othermessages.nomisfortuneleft');
    } else if (updatedState.removed < 0) {
      return game.i18n.localize('ZWEI.othermessages.negativeremoved');
    } else if (updatedState.used > updatedState.total) {
      return game.i18n.localize('ZWEI.othermessages.nofortuneleft');
    } else if (updatedState.removed > updatedState.used) {
      return game.i18n.localize('ZWEI.othermessages.nomisfortuneleft');
    } else {
      if (updatedState.used === this.used + 1) {
        const name = user.charname ? user.charname : user.name;
        if (notifySetting === 'notify') {
          ui.notifications.info(
            game.i18n.format('ZWEI.othermessages.usedfortune', {
              name: name,
              points: updatedState.total - updatedState.used,
              total: updatedState.total,
            })
          );
        } else if (notifySetting === 'chat') {
          ChatMessage.create({
            user: requestingUserId,
            content: game.i18n.format('ZWEI.othermessages.usedfortunecount', {
              name: name,
              points: updatedState.total - updatedState.used,
              total: updatedState.total,
            }),
          });
        }
      } else if (
        (updatedState.remove === this.remove + 1 || updatedState.used === this.used - 1) &&
        this.total === updatedState.total
      ) {
        if (notifySetting === 'notify') {
          ui.notifications.info(
            game.i18n.format('ZWEI.othermessages.usedmisfortune1', {
              points: updatedState.total - updatedState.used,
              total: updatedState.total,
            })
          );
        } else if (notifySetting === 'chat') {
          ChatMessage.create({
            user: requestingUserId,
            content: game.i18n.format('ZWEI.othermessages.usedmisfortune2', {
              points: updatedState.total - updatedState.used,
              total: updatedState.total,
            }),
          });
        }
      }
      return false;
    }
  }

  // Foundry methods
  async _prepareContext(options) {
    this.generateRandomPositionValues(this.fortune, this.misfortune);
    let fortunePositions = [];
    for (let i = 0; i < this.fortune; i++) {
      let t = this.#positions[2 * (i % 100)];
      let l = this.#positions[2 * (i % 100) + 1];
      fortunePositions.push({ t, l });
    }
    let misfortunePositions = [];
    for (let i = 0; i < this.misfortune; i++) {
      let t = this.#positions[2 * (i % 100) + 200];
      let l = this.#positions[2 * (i % 100) + 201];
      misfortunePositions.push({ t, l });
    }
    return {
      total: this.total,
      fortune: {
        value: this.fortune,
        positions: fortunePositions,
        path: game.settings.get('zweihander', 'fortuneTrackerSettings').fortunePath,
      },
      misfortune: {
        value: this.misfortune,
        positions: misfortunePositions,
        path: game.settings.get('zweihander', 'fortuneTrackerSettings').misfortunePath,
      },
      waiting: this.#waiting,
      params: FortuneTracker.PARAMS,
    };
  }

  async syncState() {
    if (game.users.get(game.userId).isGM) {
      this.#state = game.settings.get('zweihander', 'fortuneTrackerPersistedState');
      this.#waiting = false;
      this.#socket.executeForOthers('broadcastState', this.state);
    } else {
      this.#state = await this.requestSync();
    }
    await this.render({ force: !this.closable });
  }

  resetState() {
    if (game.users.get(game.userId).isGM) {
      const activePlayers = game.users.players.map((x) => (x.active ? 1 : 0)).reduce((x, y) => x + y, 0);
      this.state = {
        total: activePlayers + 1, //TODO: customize this for rule systems
        used: 0,
        removed: 0,
      };
      this.#socket.executeForOthers('broadcastState', this.state);
    } else {
      ui.notifications.error(game.i18n.localize('ZWEI.othermessages.errorft'));
    }
  }

  async requestSync(updatedState, rethrow = false) {
    try {
      if (updatedState) {
        return await this.#socket.executeAsGM('requestSync', updatedState, game.userId);
      } else {
        return await this.#socket.executeAsGM('requestSync');
      }
    } catch (e) {
      if (!e?.name || e.name !== 'SocketlibNoGMConnectedError') {
        console.error(e);
      }
      this.#waiting = true;
      await this.render({ force: !this.closable });
      ui.notifications.warn(game.i18n.localize('ZWEI.othermessages.ftwaiting'));
      if (rethrow) {
        throw e;
      }
      return this.state;
    }
  }

  async close(event) {
    // Delegate closing event (which I assume to be triggered by pressing ESC)
    //TODO remove this after fortune tracker redesign
    if (game.user.isGM && canvas.activeLayer && Object.keys(canvas.activeLayer.controlled).length) {
      if (!canvas.activeLayer.preview?.children.length) canvas.activeLayer.releaseAll();
      return true;
    }

    // Save the fog immediately rather than waiting for the 3s debounced save as part of commitFog.
    if (canvas.ready) canvas.fog.save();
  }

  _onRender(context, options) {
    // @todo: refactor jQuery
    const app = $(this.element);
    const html = $(this.element);

    //const app = html.parents('#fortuneTrackerApp');

    let plusTrigger;
    let minusTrigger;

    const isUserGM = game.users.get(game.userId).isGM;

    if (!app.find('#b1').length) {
      let btn = app.find('*[data-action="close"]');

      if (isUserGM) {
        btn.before(`
          <button id="a1" class=" header-control icon fa-solid fa-minus waiting-${this.#waiting}"></button>
          <button id="b1" class=" header-control icon fa-solid fa-plus waiting-${this.#waiting}"></button>
          <button class="fortune-tracker-reset header-control icon fas fa-sync-alt" data-tooltip="${
            this.resetRule
          }" data-tooltip-direction="UP"></button>
        `);
        let resetTrigger = app.find('.fortune-tracker-reset');
        resetTrigger.click((event) => {
          event.preventDefault();
          this.resetState();
        });
        plusTrigger = app.find('#b1');
        minusTrigger = app.find('#a1');
      }

      app.find('*[data-action="close"]').remove();
    } else {
      if (isUserGM) {
        app
          .find('#b1')
          .replaceWith(
            `<button id="b1" class="header-control icon fa-solid fa-plus waiting-${this.#waiting}"></button>`
          );
        app
          .find('#a1')
          .replaceWith(
            `<button id="a1" class="header-control icon fa-solid fa-minus waiting-${this.#waiting}"></button>`
          );
        plusTrigger = app.find('#b1');
        minusTrigger = app.find('#a1');
      }
    }
    if (isUserGM) {
      plusTrigger.click((event) => {
        event.preventDefault();
        this.requestSync(this.increaseTotal());
      });
      minusTrigger.click((event) => {
        event.preventDefault();
        this.requestSync(this.decreaseTotal());
      });
    }

    let fortuneTrigger = html.find('.fortune-tracker-fortune-trigger');
    fortuneTrigger.click((event) => {
      event.preventDefault();
      this.requestSync(this.spendFortune());
    });

    let misfortuneTrigger = html.find('.fortune-tracker-misfortune-trigger');
    misfortuneTrigger.click((event) => {
      event.preventDefault();
      this.requestSync(this.spendMisfortune());
    });
  }

  async useFortune() {
    const fortuneBefore = this.fortune;
    this.state = await this.requestSync(this.spendFortune(), true);
    if (fortuneBefore === this.fortune) {
      throw game.i18n.localize('ZWEI.othermessages.nofortune');
    }
    return true;
  }

  async useMisfortune() {
    const misfortuneBefore = this.misfortune;
    this.state = await this.requestSync(this.spendMisfortune(), true);
    if (misfortuneBefore === this.misfortune) {
      throw game.i18n.localize('ZWEI.othermessages.nomisfortune');
    }
    return true;
  }

  playAudio() {
    AudioHelper.play(
      {
        src: 'systems/zweihander/assets/sounds/coins.mp3',
        volume: 0.5,
        loop: false,
      },
      true
    );
  }
}
