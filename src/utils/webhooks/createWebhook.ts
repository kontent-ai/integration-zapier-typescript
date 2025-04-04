import { ZObject } from "zapier-platform-core";
import { InputData } from "../../triggers/triggerWebhookFired";
import { KontentBundle } from "../../types/kontentBundle";
import { createManagementClient } from "../kontentServices/managementClient";
import { getSecret } from "../getSecret";

export const createWebhook = (z: ZObject, bundle: KontentBundle<InputData>) => {
  return createManagementClient(z, bundle)
    .addWebhook()
    .withData({
      name: `${bundle.inputData.name} (Zapier)`,
      url: bundle.targetUrl ?? '',
      secret: getSecret(z, bundle),
      delivery_triggers: {
        events: bundle.inputData.watchedEvents || hasItemFilters(bundle.inputData) || bundle.inputData.contentTypeFilter?.length || bundle.inputData.taxonomyFilter?.length || bundle.inputData.languageFilter?.length
          ? 'specific' 
          : 'all',
        slot: bundle.inputData.source,
        content_item: hasItemFilters(bundle.inputData) 
          ? {
            enabled: true,
            actions: orAllEvents(allItemEvents, bundle.inputData.watchedEvents
              ?.filter(createHasPrefix('item_'))
              .map(createRemoveEventPrefix('item_')))
              .map(action => action === 'workflow_step_changed' && bundle.inputData.workflowStepFilter 
                ? { action, transition_to: bundle.inputData.workflowStepFilter.map(step => ({ workflow_identifier: { codename: 'default' }, step_identifier: { id: step } })) }
                : { action }),
            filters: {
              collections: bundle.inputData.itemCollectionFilter ? bundle.inputData.itemCollectionFilter.map(id => ({ id })) : undefined,
              content_types: bundle.inputData.itemTypeFilter ? bundle.inputData.itemTypeFilter.map(id => ({ id })) : undefined,
              languages: bundle.inputData.itemLanguageFilter ? bundle.inputData.itemLanguageFilter.map(id => ({ id })) : undefined,
            },
          }
          : undefined,
        asset: bundle.inputData.watchedEvents?.some(createHasPrefix('asset_'))
          ? {
            enabled: true,
            actions: bundle.inputData.watchedEvents
              ?.filter(createHasPrefix('asset_'))
              .map(createRemoveEventPrefix('asset_'))
              .map(action => ({ action })),
          }
          : undefined,
        taxonomy: bundle.inputData.watchedEvents?.some(or(createHasPrefix('taxonomy_'), createHasPrefix('term_'))) || bundle.inputData.taxonomyFilter?.length
          ? {
            enabled: true,
            actions: orAllEvents(allTaxonomyEvents, bundle.inputData.watchedEvents
              ?.filter(or(createHasPrefix('taxonomy_'), createHasPrefix('term_')))
              .map(createRemoveEventPrefix('taxonomy_')))
              .map(action => ({ action })),
            filters: {
              taxonomies: bundle.inputData.taxonomyFilter ? bundle.inputData.taxonomyFilter.map(id => ({ id })) : undefined,
            },
          }
          : undefined,
        language: bundle.inputData.watchedEvents?.some(createHasPrefix('language_')) || bundle.inputData.languageFilter?.length
          ? {
            enabled: true,
            actions: orAllEvents(allLanguageEvents, bundle.inputData.watchedEvents
              ?.filter(createHasPrefix('language_'))
              .map(createRemoveEventPrefix('language_')))
              .map(action => ({ action })),
            filters: {
              languages: bundle.inputData.languageFilter ? bundle.inputData.languageFilter.map(id => ({ id })) : undefined,
            },
          }
          : undefined,
        content_type: bundle.inputData.watchedEvents?.some(createHasPrefix('type_')) || bundle.inputData.contentTypeFilter?.length
          ? {
            enabled: true,
            actions: orAllEvents(allContentTypeEvents, bundle.inputData.watchedEvents
              ?.filter(createHasPrefix('type_'))
              .map(createRemoveEventPrefix('type_')))
              .map(action => ({ action })),
            filters: {
              content_types: bundle.inputData.contentTypeFilter ? bundle.inputData.contentTypeFilter.map(id => ({ id })) : undefined,
            },
          }
          : undefined,
      },
    })
    .toPromise()
    .then(res => res.data._raw);
};

type Event = Exclude<InputData['watchedEvents'], undefined>[number];
type EventPrefix = 'item_' | 'type_' | 'language_' | 'asset_' | 'taxonomy_' | 'term_' | 'terms_' | 'workflow_step_';

const hasItemFilters = (inputData: InputData) =>
  inputData.itemTypeFilter?.length || inputData.itemCollectionFilter?.length || inputData.itemLanguageFilter?.length || inputData.workflowStepFilter?.length ||
  inputData.watchedEvents?.some(createHasPrefix('item_'));

const createRemoveEventPrefix = <Prefix extends Exclude<EventPrefix, 'terms_' | 'term_'>>(prefix: Prefix) =>
  (event: `${Prefix}${string}`): PrefixedEvent<Prefix, Event> => 
    event.replace(prefix, '') as PrefixedEvent<Prefix, Event>;

type PrefixedEvent<Prefix extends EventPrefix, Event> = Event extends `${Prefix}${infer Rest}` ? Rest : never;

const createHasPrefix = <Prefix extends EventPrefix>(prefix: Prefix) =>
  (event: Event): event is Event extends `${Prefix}${string}` ? Event : never =>
    event.startsWith(prefix);

const or = <Input, Guarded1 extends Input, Guarded2 extends Input>(guard1: (input: Input) => input is Guarded1, guard2: (input: Input) => input is Guarded2) =>
  (input: Input): input is Guarded1 | Guarded2 =>
    guard1(input) || guard2(input);

const allItemEvents: PrefixedEvent<'item_', Event>[] = Object.values({
  metadata_changed: 'metadata_changed',
  published: 'published',
  unpublished: 'unpublished',
  created: 'created',
  deleted: 'deleted',
  changed: 'changed',
  workflow_step_changed: 'workflow_step_changed',
} satisfies { [K in PrefixedEvent<'item_', Event>]: K });

type TaxonomyEvent = PrefixedEvent<'taxonomy_', Event> | EventsWithPrefix<'terms_' | 'term_', Event>;

const allTaxonomyEvents: TaxonomyEvent[] = Object.values({
  metadata_changed: 'metadata_changed',
  created: 'created',
  deleted: 'deleted',
  term_changed: 'term_changed',
  term_created: 'term_created',
  term_deleted: 'term_deleted',
  terms_moved: 'terms_moved',
} satisfies { [K in TaxonomyEvent]: K });

const allLanguageEvents: PrefixedEvent<'language_', Event>[] = Object.values({
  created: 'created',
  deleted: 'deleted',
  changed: 'changed',
} satisfies { [K in PrefixedEvent<'language_', Event>]: K });

const allContentTypeEvents: PrefixedEvent<'type_', Event>[] = Object.values({
  created: 'created',
  deleted: 'deleted',
  changed: 'changed',
} satisfies { [K in PrefixedEvent<'type_', Event>]: K });

type EventsWithPrefix<Prefix extends EventPrefix, Event> = Event extends infer Res extends `${Prefix}${string}` ? Res : never;

const orAllEvents = <Event>(allEvents: Event[], selectedEvents: Event[] | undefined) =>
  selectedEvents?.length ? selectedEvents : allEvents;
