import { ITaxonomyGroup } from '@kontent-ai/delivery-sdk';

export const taxonomyGroupSample: ITaxonomyGroup<'programming_language'> = {
  system: {
    id: 'f30c7f72-e9ab-8832-2a57-62944a038809',
    name: 'Programming language',
    codename: 'programming_language',
    lastModified: new Date('2019-08-31T09:41:06.520241Z'),
  },
  terms: [
    {
      name: 'C#',
      codename: 'c_',
      terms: [],
    },
    {
      name: 'JavaScript',
      codename: 'javascript',
      terms: [],
    },
  ],
};
