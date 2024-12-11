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

export function attachTabDefinitions(tabData) {
  const $$ = (x) => tabData.itemGroups[x];
  tabData.tabs = {
    effects: {
      itemGroups: ['effects'].map($$),
    },
  };
}
