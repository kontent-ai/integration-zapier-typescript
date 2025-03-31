import { getContentTypeElements } from '../../fields/elements/getContentTypeElements';
import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../../types/kontentBundle';
import { ContentTypeElements, ElementModels, LanguageVariantElementsBuilder } from '@kontent-ai/management-sdk';
import { ElementFields } from '../../fields/elements/getItemElementFields';

type ElementValue = ElementModels.ContentItemElement['value'];
type RawElementValue = string | string[] | number | undefined;

const getElementValue = (value: RawElementValue, element: ContentTypeElements.ContentTypeElementModel): ElementValue => {
  switch (element.type) {
    case 'rich_text': {
      if (typeof value !== 'string') {
        return undefined;
      }
      if (value.trim().startsWith('<')) {
        return value;
      }
      return `<p>${value}</p>`;
    }

    case 'text':
    case 'custom':
    case 'number':
    case 'date_time':
    case 'url_slug': {
      if (Array.isArray(value)) {
        return undefined;
      }

      return value;
    }

    case 'modular_content':
      return parseList(value)
        ?.map(x => isInternalId(x)
          ? { id: x }
          : { external_id: x }
        );

    case 'multiple_choice':
    case 'asset':
    case 'taxonomy':
      return parseList(value)
        ?.map(x => isInternalId(x)
          ? { id: x }
          : { codename: x }
        );

    case 'guidelines':
    default:
      return undefined;
  }
};

type Element = Omit<ElementModels.ContentItemElement, '_raw' | 'components' | 'display_timezone'> & { components?: ElementModels.ContentItemElement['components'], display_timezone?: null | string };

export const getElementsForUpsert = (z: ZObject, bundle: KontentBundle<ExpectedInputData>, contentTypeId: string): Promise<ReadonlyArray<Element>> =>
  getContentTypeElements(z, bundle, contentTypeId)
    .then(typeElements => typeElements
      .map(element => {
        const value = getElementValue(bundle.inputData[`elements__${element.codename}`], element);
        if (!value) {
          return undefined;
        }

        const resultElement = {
          element: {
            id: element.id,
          },
          value: value,
        };

        switch (element.type) {
          case 'url_slug':
            return {
              ...resultElement,
              mode: value !== '' ? 'custom' as const : undefined,
            };
          case 'rich_text':
            return {
              ...resultElement,
              components: [],
            };
          case 'date_time':
            return {
              ...resultElement,
            display_timezone: null,
            };
          default:
            return resultElement;
        }
      })
      .filter(notUndefined),
    );

export type ExpectedInputData = ElementFields;

const notUndefined = <T>(v: T | undefined): v is T =>
  v !== undefined;

const internalIdRegex = /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/;
// It would be nice to change this, but we can't without a breaking change. Please change this api once you introduce some breaking change.
const isInternalId = (possibleId: string): boolean => internalIdRegex.test(possibleId);

const parseList = (value: RawElementValue): undefined | readonly string[] => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const firstElement = value[0];

  // This behaviour (if exactly one element it is a comma-separated string of elements) is not pretty either. Again, I want to avoid breaking changes at the moment, but it would be nice to get rid of it in the future.
  return value.length === 1 && firstElement
    ? firstElement.split(',').map(v => v.trim())
    : value;
}
