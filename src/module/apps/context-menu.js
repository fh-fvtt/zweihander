const { ContextMenu } = foundry.applications.ux;

export default class ZweihanderContextMenu extends ContextMenu {
  /**
   * Trigger a context menu event in response to a normal click on a additional options button.
   * @param {PointerEvent} event
   */
  static triggerEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    const { clientX, clientY } = event;
    const selector = '[data-message-id]';
    const target = event.target.closest(selector) ?? event.currentTarget.closest(selector);
    target?.dispatchEvent(
      new PointerEvent('contextmenu', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
      })
    );
  }
}
