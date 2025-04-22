import ZweihanderBaseItem from './base-item';
import * as ZweihanderUtils from '../../utils';

export default class ZweihanderQuality extends ZweihanderBaseItem {
  static async getQualities(uuids) {
    return await Promise.all(
      uuids.map(async (uuid) => {
        const item = await fromUuid(uuid);

        console.log('QUALITY: ', item);

        return {
          name: item.name,
          found: item !== undefined,
          effect: ZweihanderUtils.localize(item?.system?.rules?.effect),
        };
      })
    );
  }

  static async openQuality(uuid) {
    const item = await fromUuid(uuid);
    return item.sheet.render(true);
  }
}
