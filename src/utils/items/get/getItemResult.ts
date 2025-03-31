import { getItemVariant } from './getItemVariant';
import { findItemByIdentifier } from './findItemByIdentifier';
import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../../../types/kontentBundle';
import { getContentType } from '../../types/getContentType';
import { getLanguage } from '../../languages/getLanguage';
import {
  ContentItemModels,
  ContentTypeElements,
  ContentTypeModels,
  ContentTypeSnippetModels,
  ElementModels,
  LanguageVariantModels,
  SharedModels,
} from '@kontent-ai/management-sdk';
import { getContentTypeSnippets } from '../../types/getContentTypeSnippets';

async function findContentItemByIdentifier(z: ZObject, bundle: KontentBundle<{}>, languageId: string, itemId: string) {
  const item = await findItemByIdentifier(z, bundle, 'id', itemId);
  if (!item) {
    // Not found
    return null;
  }

  const variant = await getItemVariant(z, bundle, item.id, languageId);
  if (!variant) {
    // Not found
    return null;
  }

  // Found
  return await getItemResult(z, bundle, item, variant, false);
}

const isReferenceObjectsArray = (v: string | number | undefined | SharedModels.IReferenceObject[]): v is SharedModels.IReferenceObject[] =>
  Array.isArray(v) && !!v.length && v.some(o => typeof o === 'object' && o !== null);

function getElementValue(element: ElementModels.ContentItemElement, typeElement: ContentTypeElements.ContentTypeElementModel): string | number | string[] | undefined {
  const value = element.value;
  switch (typeElement.type) {
    case 'text':
    case 'rich_text':
    case 'custom':
    case 'number':
    case 'date_time':
    case 'url_slug': {
      if (isReferenceObjectsArray(value)) {
        throw new Error(`Element of type ${typeElement.type} contains reference objects. This should not happen.`);
      }
      return value;
    }

    case 'modular_content':
    case 'multiple_choice':
    case 'asset':
    case 'taxonomy':
      return (value as SharedModels.IReferenceObject[] | undefined)?.map(item => item.id || '');

    default: {
      if (isReferenceObjectsArray(value)) {
        throw new Error(`Element of type ${typeElement.type} contains reference objects. This should not happen.`);
      }
      return value;
    }
  }
}

const getElements = (
  z: ZObject, 
  bundle: KontentBundle<{}>, 
  variant: LanguageVariantModels.ContentItemLanguageVariant, 
  contentType: ContentTypeModels.ContentType, 
  contentTypeSnippets: ContentTypeSnippetModels.ContentTypeSnippet[]
) =>
  Object.fromEntries(variant.elements
    .flatMap(element => {
      const typeElement = contentType.elements.find(el => el.id === element.element.id) 
      || contentTypeSnippets
          .find(snippet => snippet.elements.find(el => el.id === element.element.id))?.elements
          .find(el => el.id === element.element.id);
      
      if (!typeElement || typeElement.type === 'guidelines') {
        return [];
      }

      return [
        // bad SDK types, even snippet element should have codename
        [
          (typeElement as Exclude<ContentTypeElements.ContentTypeElementModel, ContentTypeElements.ISnippetElement>).codename || '',
          getElementValue(element, typeElement),
        ] as const,
      ];
    }));

async function getLinkedItems(z: ZObject, bundle: KontentBundle<{}>, variant: LanguageVariantModels.ContentItemLanguageVariant, contentType: ContentTypeModels.ContentType) {
  const linkeditemsPromises = contentType.elements
    .filter((el): el is ContentTypeElements.ILinkedItemsElement => el.type === 'modular_content')
    .map(typeEl => variant.elements.find(el => el.element.id === typeEl.id))
    .flatMap(el => {
      if (!el || !Array.isArray(el.value)) {
        return [];
      }
      return el.value.map(item => findContentItemByIdentifier(z, bundle, variant.language.id || '', item.id || ''));
    });

  return Promise.all(linkeditemsPromises);
}

export async function getItemResult(z: ZObject, bundle: KontentBundle<{}>, item: ContentItemModels.ContentItem, variant: LanguageVariantModels.ContentItemLanguageVariant, doModular = true): Promise<ItemResult> {
  const contentType = await getContentType(z, bundle, item.type.id);
  const language = await getLanguage(z, bundle, variant.language.id || '');
  const contentTypeSnippets = await getContentTypeSnippets(z, bundle);
  const elements = getElements(z, bundle, variant, contentType, contentTypeSnippets);

  //get modular content and set doModular to false in order prevent too much depth
  const modular = doModular
    ? await getLinkedItems(z, bundle, variant, contentType)
    : [];

  const projectId = bundle.authData.projectId;
  const fullId = `${item.id}/${variant.language.id}`;

  return {
    system: {
      projectId,
      id: item.id,
      name: item.name,
      codename: item.codename,
      type: contentType.codename,
      language: language.codename,
      externalId: item.externalId || '',
      lastModified: variant.lastModified.toISOString(),
      fullId: fullId,
      workflowStepId: variant.workflow.stepIdentifier.id || '',
      contentTypeId: item.type.id,
      languageId: variant.language.id || '',
    },
    elements: elements,
    modular_content: z.JSON.stringify(modular),
  };
}

type ItemResult = Readonly<{
  system: Readonly<{
    projectId: string;
    id: string;
    name: string;
    codename: string;
    type: string;
    language: string;
    externalId: string;
    lastModified: string;
    fullId: string;
    workflowStepId: string;
    contentTypeId: string;
    languageId: string;
  }>;
  elements: Readonly<Record<string, string | number | string[] | undefined>>;
  modular_content: string;
}>;
