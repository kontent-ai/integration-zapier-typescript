import { languageSearchFields, LanguageSearchFieldsOutput } from '../fields/filters/languageSearchFields';
import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../types/kontentBundle';
import { getLanguage } from '../utils/languages/getLanguage';
import { getLanguageByCodename } from '../utils/languages/getLanguageByCodename';
import { getLanguageByExternalId } from '../utils/languages/getLanguageByExternalId';
import { OutputField } from '../fields/output/outputField';
import { OutputFromOutputFields } from '../fields/output/outputFromOutputFields';
import { LanguageModels } from '@kontent-ai/management-sdk';

async function execute(z: ZObject, bundle: KontentBundle<InputData>): Promise<Output> {
  const searchField = bundle.inputData.searchField;
  const searchValue = bundle.inputData.searchValue;

  switch (searchField) {
    case 'id':
      return [await getLanguage(z, bundle, searchValue).then(prepareLanguageForOutput)];
    case 'codename':
      return [await getLanguageByCodename(z, bundle, searchValue).then(prepareLanguageForOutput)];
    case 'externalId':
      return [await getLanguageByExternalId(z, bundle, searchValue).then(prepareLanguageForOutput)];
    default:
      return [];
  }
}

const outputFields = [
  {
    key: 'id',
    label: 'Language id',
    type: 'string',
    required: true,
  },
  {
    key: 'name',
    label: 'Language name',
    type: 'string',
    required: true,
  },
  {
    key: 'codename',
    label: 'Language codename',
    type: 'string',
    required: true,
  },
  {
    key: 'externalId',
    label: 'Language externalId',
    type: 'string',
  },
  {
    key: 'isActive',
    label: 'Is language active',
    type: 'boolean',
    required: true,
  },
  {
    key: 'isDefault',
    label: 'Is this the default language',
    type: 'boolean',
    required: true,
  },
  {
    key: 'fallbackLanguage__id',
    label: 'Language id of a fallback language',
    type: 'string',
  },
] as const satisfies ReadonlyArray<OutputField>;

type Output = ReadonlyArray<OutputFromOutputFields<typeof outputFields>>;

export const findLanguage = {
  noun: 'Language search',
  display: {
    hidden: false,
    important: false,
    description: 'Finds a language based on its ID, code name, or external ID.',
    label: 'Find Language',
  },
  key: 'find_language',
  operation: {
    perform: execute,
    outputFields,
    inputFields: [
      ...languageSearchFields,
    ],
    sample: {
      id: '1c37a40c-9158-031d-9d2d-adf65a568cd6',
      name: 'Czech',
      codename: 'cz-CZ',
      external_id: 'lang_czech',
      is_active: true,
      is_default: false,
      fallback_language: {
        id: '00000000-0000-0000-0000-000000000000',
      },
    },
  },
} as const;

export type InputData = LanguageSearchFieldsOutput;

const prepareLanguageForOutput = (language: LanguageModels.LanguageModel): Output[number] => ({
  id: language.id,
  codename: language.codename,
  name: language.name,
  externalId: language.externalId,
  fallbackLanguage: { id: language.fallbackLanguage?.id },
  isActive: language.isActive,
  isDefault: language.isDefault,
});
