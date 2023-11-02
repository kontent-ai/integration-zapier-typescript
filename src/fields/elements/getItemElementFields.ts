import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../../types/kontentBundle';
import { getContentTypeElements } from './getContentTypeElements';
import { ContentTypeElements, TaxonomyModels } from '@kontent-ai/management-sdk';
import { Field } from '../field';
import { getTaxonomyGroup } from '../../utils/taxonomies/getTaxonomyGroup';

export const getItemElementFields = (z: ZObject, bundle: KontentBundle<{}>, contentTypeId: string) =>
  getContentTypeElements(z, bundle, contentTypeId)
    .then(async elements => [elements, await getTermsForTaxonomyElements(z, bundle)(elements)] as const)
    .then(([elements, termsByElementId]) => elements.map(getSimpleElementField(termsByElementId)));

const getTermsForTaxonomyElements = (z: ZObject, bundle: KontentBundle<{}>) =>
  (elements: readonly ContentTypeElements.ContentTypeElementModel[]) =>
    Promise.all(elements
      .filter(el => el.type === "taxonomy")
      .map(async el => [el.id, await getTaxonomyGroup(z, bundle)((el as ContentTypeElements.ITaxonomyElement).taxonomy_group.id || '')] as const))
      .then(entries => entries.map(([elId, group]) => [elId, group.terms.flatMap(createTermData)] as const))
      .then(entries => new Map(entries));

type TermData = Readonly<{
  id: string;
  name: string;
  codename: string;
}>;

const createTermData = (term: TaxonomyModels.Taxonomy): ReadonlyArray<TermData> => [
  {
    id: term.id,
    name: term.name,
    codename: term.codename,
  },
  ...term.terms.flatMap(createTermData),
];

export type ElementFields = Readonly<{
  [key: `elements__${string}`]: string | string[] | number | undefined;
}>;

const getSimpleElementField = (termsByElementId: ReadonlyMap<string, readonly TermData[]>) =>
  (element: ContentTypeElements.ContentTypeElementModel) => {
    switch (element.type) {
      case 'text':
      case 'rich_text':
      case 'custom':
        return getField(element, { type: 'text' });

      case 'number':
        return getField(element, { type: 'float' });

      case 'date_time':
        return getField(element, { type: 'datetime' });

      case 'modular_content':
        const opts = {
          search: 'find_item.id',
          list: true,
          dynamic: 'get_linked_items.id.name',
          type: 'string',
          altersDynamicFields: false,
        } as const;

        return getField(element, opts);

      case 'multiple_choice': {
        const choices = element.options.map(o => ({ label: o.name, value: o.codename || '', sample: '' }));

        return getField(element, { type: 'unicode', list: element.mode === 'multiple', choices });
      }
      case 'asset':
        return getField(element, { type: 'unicode', list: true });

      case 'taxonomy': {
        const terms = termsByElementId.get(element.id) ?? [];
        const idChoices = terms.map(t => ({ value: t.id, label: t.name, sample: t.id }));
        const codenameChoices = terms.map(t => ({ value: t.codename, label: `${t.name} (codename)`, sample: t.codename }));

        return getField(element, { type: 'unicode', choices: [...idChoices, ...codenameChoices], list: true });
      }

      case 'url_slug':
        return getField(element, { type: 'unicode' });

      case 'guidelines':
        return getField(element, { type: 'copy' });
      default:
        return undefined;
    }
  }

function getField(element: ElementWithoutSnippets, extra?: Partial<Field>) {
  const base = {
    key: `elements__${element.codename}`,
    label: getElementName(element),
    helpText: createElementHelpText(element),
    required: element.type !== 'guidelines' && !!element.is_required,
  };

  return {
    ...base,
    ...extra,
  };
}

type ElementWithoutSnippets = Exclude<ContentTypeElements.ContentTypeElementModel, ContentTypeElements.ISnippetElement>;

const getElementName = (element: ElementWithoutSnippets): string => {
  switch (element.type) {
    case 'guidelines':
    case 'taxonomy':
      return element.codename || '';
    default:
      return element.name || element.codename || '';
  }
};

const createElementHelpText = (element: ElementWithoutSnippets): string | undefined => {
  const guidelines = element.guidelines ?? '';
  switch (element.type) {
    case 'modular_content':
      return guidelines + ' The value of this field should be a comma-separated list of content item IDs or [external IDs](https://kontent.ai/learn/reference/management-api-v2/#section/Reference-object), or a single value on each line.';
    case 'multiple_choice':
    case 'asset':
    case 'taxonomy':
      return guidelines + ' The value of this field should be a comma-separated list of IDs or codenames, or a single value on each line.';
    default:
      return guidelines
  }
};
