import { KontentBundle } from '../../types/kontentBundle';
import { ITaxonomyGroup } from '@kontent-ai/delivery-sdk';

export const getSampleTaxonomyPayload = (bundle: KontentBundle<{}>, sampleGroup: ITaxonomyGroup<string>) => ({
  data: {
    items: [
      {
        id: 'e113e464-bffb-4fbd-a29b-47991d003732',
        codename: 'my_article',
        language: 'en-US',
        type: 'article'
      }
    ],
    taxonomies: [
      {
        id: sampleGroup.system.id,
        codename: sampleGroup.system.codename
      }
    ]
  },
  message: {
    id: 'e2f99f74-4111-4033-8eff-54073fbd4e32',
    project_id: bundle.authData.projectId,
    type: 'taxonomy',
    operation: 'upsert',
    api_name: 'delivery_production',
    created_timestamp: new Date().toJSON(),
    webhook_url: bundle.targetUrl ? bundle.targetUrl : 'https://hooks.zapier.com/hooks/standard/47991d003732'
  }
});
