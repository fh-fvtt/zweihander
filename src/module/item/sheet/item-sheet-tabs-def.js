export function getEffectsGroups(groupsData) {
  return {
    effects: {
      title: 'effects',
      type: 'effect',
      isEffect: true,
      summaryTemplate: 'item-summary/effect',
      details: [
        {
          title: 'category',
          size: 140,
          key: 'system.details.category',
        },
      ],
      items: groupsData.effects,
    },
  };
}

export function attachTabDefinitions(context) {
  const $$ = (x) => context.itemGroups[x];
  tabDefinitions = {
    effects: {
      itemGroups: ['effects'].map($$),
    },
  };

  foundry.utils.mergeObject(context.tabs, tabDefinitions, { overwrite: false });
}
