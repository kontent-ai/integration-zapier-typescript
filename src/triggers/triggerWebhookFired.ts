import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../types/kontentBundle';
import { hasValidSignature } from '../utils/hasValidSignature';
import { unsubscribeHook } from '../utils/unsubscribeHook';
import { createManagementClient } from '../utils/kontentServices/managementClient';
import { getWorkflow } from '../utils/workflows/getWorkflow';
import { getContentTypes } from '../utils/types/getContentTypes';
import { createWebhook } from '../utils/webhooks/createWebhook';
import { createDeliveryClient } from '../utils/kontentServices/deliverClient';

async function subscribeHook(z: ZObject, bundle: KontentBundle<InputData>) {
  if (!bundle.targetUrl) {
    throw new z.errors.Error('Missing targetUrl.');
  }
  
  const normalizedInputData = {
    ...bundle.inputData,
    watchedEvents: ensureList(bundle.inputData.watchedEvents),
    workflowStepFilter: ensureList(bundle.inputData.workflowStepFilter),
    itemTypeFilter: ensureList(bundle.inputData.itemTypeFilter),
    itemCollectionFilter: ensureList(bundle.inputData.itemCollectionFilter),
    itemLanguageFilter: ensureList(bundle.inputData.itemLanguageFilter),
    contentTypeFilter: ensureList(bundle.inputData.contentTypeFilter),
    taxonomyFilter: ensureList(bundle.inputData.taxonomyFilter),
    languageFilter: ensureList(bundle.inputData.languageFilter),
  } satisfies InputData;
  
  return createWebhook(z, {
    ...bundle,
    inputData: normalizedInputData,
  });
}

async function parsePayload(z: ZObject, bundle: KontentBundle<InputData>) {
  if (!hasValidSignature(z, bundle)) {
    throw new z.errors.Error('Unable to verify webhook signature.');
  }

  return [bundle.cleanedRequest];
}

export type InputData = Readonly<{
  name: string;
  source: 'preview' | 'published';
  watchedEvents?: readonly ReturnType<typeof createEventsField>['choices'][number][];
  workflowStepFilter?: readonly string[];
  itemTypeFilter?: readonly string[];
  itemCollectionFilter?: readonly string[];
  itemLanguageFilter?: readonly string[];
  contentTypeFilter?: readonly string[];
  taxonomyFilter?: readonly string[];
  languageFilter?: readonly string[];
}>;

const createEventsField = (z: ZObject, bundle: KontentBundle<Pick<InputData, 'source'>>) => ({
  label: 'Events to watch',
  helpText: 'Fires only when these events are performed. Leave blank for all events.',
  key: 'watchedEvents',
  list: true,
  choices: [
    "item_metadata_changed",
    ...bundle.inputData.source === 'published'
      ? ['item_published', 'item_unpublished'] as const
      : ['item_created', 'item_deleted', 'item_changed', 'item_workflow_step_changed'] as const,
    "type_created",
    "type_changed",
    "type_deleted",
    "language_created",
    "language_changed",
    "language_deleted",
    "asset_created",
    "asset_changed",
    "asset_metadata_changed",
    "asset_deleted",
    "taxonomy_created",
    "taxonomy_metadata_changed",
    "taxonomy_deleted",
    "term_created",
    "term_changed",
    "term_deleted",
    "terms_moved",
  ] as const,
  required: false,
  type: 'string',
} as const);

const createWorkflowStepFilterField = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const workflow = await getWorkflow(z, bundle);

  return {
    label: 'Workflow step filter',
    helpText: 'Filters workflow step change events to specific workflow steps.',
    key: 'workflowStepFilter',
    type: 'string',
    list: true,
    required: false,
    choices: Object.fromEntries([...workflow.steps, workflow.publishedStep, workflow.archivedStep, workflow.archivedStep].map(step => [step.id, step.name])),
  };
};

const createItemTypeFilterField = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const contentTypes = await getContentTypes(z, bundle);

  return {
    label: 'Item type filter',
    helpText: 'Filters item-related events to specific items of these types.',
    key: 'itemTypeFilter',
    type: 'string',
    list: true,
    required: false,
    choices: Object.fromEntries(contentTypes.map(type => [type.system.id, type.system.name])),
  };
};

const createItemCollectionFilterField = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const collections = await createManagementClient(z, bundle)
    .listCollections()
    .toPromise()
    .then(res => res.data.collections);

  return {
    label: 'Item collection filter',
    helpText: 'Filters item-related events to specific items in these collections.',
    key: 'itemCollectionFilter',
    type: 'string',
    list: true,
    required: false,
    choices: Object.fromEntries(collections.map(collection => [collection.id, collection.name])),
  };
};

const createItemLanguageFilterField = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const languages = await createManagementClient(z, bundle)
    .listLanguages()
    .toPromise()
    .then(res => res.data.items);

  return {
    label: 'Item language filter',
    helpText: 'Filters item-related events to specific languages.',
    key: 'itemLanguageFilter',
    type: 'string',
    list: true,
    required: false,
    choices: Object.fromEntries(languages.map(language => [language.id, language.name])),
  };
};

const createContentTypeFilterField = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const contentTypes = await getContentTypes(z, bundle);

  return {
    label: 'Content type filter',
    helpText: 'Filters content type-related events to specific content types.',
    key: 'contentTypeFilter',
    type: 'string',
    list: true,
    required: false,
    choices: Object.fromEntries(contentTypes.map(type => [type.system.id, type.system.name])),
  };
};

const createTaxonomyFilterField = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const taxonomies = await createManagementClient(z, bundle)
    .listTaxonomies()
    .toPromise()
    .then(res => res.data.items);

  return {
    label: 'Taxonomy filter',
    helpText: 'Filters taxonomy-related events to specific taxonomy groups.',
    key: 'taxonomyFilter',
    type: 'string',
    list: true,
    required: false,
    choices: Object.fromEntries(taxonomies.map(taxonomy => [taxonomy.id, taxonomy.name])),
  };
};

const createLanguageFilterField = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const languages = await createManagementClient(z, bundle)
    .listLanguages()
    .toPromise()
    .then(res => res.data.items);

  return {
    label: 'Language filter',
    helpText: 'Filters language-related events to specific languages.',
    key: 'languageFilter',
    type: 'string',
    list: true,
    required: false,
    choices: Object.fromEntries(languages.map(language => [language.id, language.name])),
  };
};

/**
 * Used to fetch sample data for the trigger testing before publishing. The result is an array of objects, each representing a sample payload of the webhook event.
 *https://docs.zapier.com/platform/publish/integration-checks-reference#D006
 */
const performList = async (z: ZObject, bundle: KontentBundle<InputData>) => {
  const items = await createDeliveryClient(z, bundle)
    .items()
    .queryConfig({
      usePreviewMode: bundle.inputData.source === 'preview' && !!bundle.authData.previewApiKey,
    })
    .toPromise()
    .then(res => res.data.items);

  return [{
    notifications: items.map(item => ({
      data: {
        system: {
          id: item.system.id,
          name: item.system.name,
          codename: item.system.codename,
          collection: item.system.collection,
          workflow: item.system.workflow,
          workflow_step: item.system.workflowStep,
          language: item.system.language,
          type: item.system.type,
          last_modified: item.system.lastModified,
        },
      },
      message: {
        environment_id: bundle.authData.projectId,
        object_type: "content_item",
        action: item.system.workflowStep === 'published' ? 'published' : 'item_changed',
        delivery_slot: item.system.workflowStep === 'published' ? 'published' : 'preview',
      },
    })),
  }];
};

const webhookName = 'Item, Content Type, Taxonomy, Language, or Asset Changed';

export default {
  key: 'management_webhook_fired',
  noun: webhookName,
  display: {
    label: webhookName,
    description: 'Triggers when a webhook is fired.',
  },
  operation: {
    inputFields: [
      {
        label: 'Webhook name',
        helpText: 'Enter a webhook name which will appear in the Kontent.ai admin UI.',
        key: 'name',
        required: true,
        type: 'string',
      },
      {
        label: 'Data source',
        helpText: 'Select whether you\'re interested in content changes in preview or published data.',
        key: 'source',
        choices: ['preview', 'published'],
        required: true,
      },
      createEventsField,
      createWorkflowStepFilterField,
      createItemTypeFilterField,
      createItemCollectionFilterField,
      createItemLanguageFilterField,
      createContentTypeFilterField,
      createTaxonomyFilterField,
      createLanguageFilterField,
    ],
    type: 'hook',

    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,

    perform: parsePayload,
    performList,
    sample: {
      notifications: [
        {
          data: {
            system: {
              id: '32022d85-ee58-4655-9016-e130c375820a',
              name: 'This changes everything!',
              codename: 'this_changes_everything',
              collection: 'marketing',
              workflow: 'default',
              workflow_step: 'published',
              language: 'english',
              type: 'product_update',
              last_modified: '2024-01-08T13:54:54.3153716Z',
            },
          },
          message: {
            environment_id: '5f313984-9216-0158-9068-1d194f578bce',
            object_type: 'content_item',
            action: 'published',
            delivery_slot: 'published',
          },
        },
      ],
    },
  },
} as const;

const ensureList = <T>(value: T | readonly T[] | undefined): readonly T[] | undefined => value === undefined || Array.isArray(value) ? value as readonly T[] | undefined : [value] as readonly T[];