import ZweihanderBaseItem from './base-item';
import * as ZweihanderUtils from '../../utils';

export default class ZweihanderQuality extends ZweihanderBaseItem {
  static async getQualities(names) {
    return await Promise.all(
      names.split(',').map(async (q) => {
        const name = q.trim();
        const item = await ZweihanderUtils.findItemWorldWide('quality', name);
        return {
          name,
          found: item !== undefined,
          effect: ZweihanderUtils.localize(item?.system?.rules?.effect),
        };
      })
    );
  }

  static async openQuality(name) {
    const item = await ZweihanderUtils.findItemWorldWide('quality', name);
    return item.sheet.render(true);
  }
}
