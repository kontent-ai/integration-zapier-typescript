import { getLanguageField } from '../fields/getLanguageField';
import { getContentTypeField } from '../fields/getContentTypeField';
import { ElementFields, getItemElementFields } from '../fields/elements/getItemElementFields';
import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../types/kontentBundle';
import { itemSearchFields, ItemSearchFieldsOutputType } from '../fields/filters/itemSearchFields';
import { contentItemSample } from '../fields/samples/contentItemSample';
import { ContentItemOutputFields, contentItemOutputFields } from '../fields/output/contentItemOutputFields';
import { Field } from '../fields/field';
import { findItemByIdentifier } from '../utils/items/get/findItemByIdentifier';
import { getVariant } from '../utils/items/get/getVariant';
import { ContentItemModels, LanguageVariantModels } from '@kontent-ai/management-sdk';
import { getWorkflow } from '../utils/workflows/getWorkflowSteps';
import { upsertVariant } from '../utils/items/update/upsertVariant';
import { getItemResult } from '../utils/items/get/getItemResult';
import { createManagementClient } from '../utils/kontentServices/managementClient';

const elementsInfoField: Field = {
  label: 'Elements',
  helpText: `#### Content item variant elements
                
The following inputs represent elements of a chosen content type as defined in Kontent.ai. Element data is stored per language version.

[Read more about elements ...](https://kontent.ai/learn/reference/management-api-v2/#tag/Elements-in-content-types)`,
  key: 'elements_header',
  type: 'copy',
};

async function execute(z: ZObject, bundle: KontentBundle<InputData>): Promise<ContentItemOutputFields> {
  const languageId = bundle.inputData.languageId;
  const searchField = bundle.inputData.searchField;
  const searchValue = bundle.inputData.searchValue;

  // Check existing content item, it may be available through the find action
  const existingItem = searchField && searchValue && await findItemByIdentifier(z, bundle, searchField, searchValue);
  if (!existingItem || existingItem.type.id !== bundle.inputData.contentTypeId) {
    throw new z.errors.HaltedError('Skipped, matching item not found.');
  }

  const existingVariant = await getVariant(z, bundle, existingItem.id, languageId);
  if (!existingVariant) {
    throw new z.errors.HaltedError('Skipped, language variant not found.');
  }

  return await tryUpdate(z, bundle, existingVariant, existingItem);
}

const createNewVersion = async (z: ZObject, bundle: KontentBundle<{}>, itemId: string, languageId: string) =>
  createManagementClient(z, bundle)
    .createNewVersionOfLanguageVariant()
    .byItemId(itemId)
    .byLanguageId(languageId)
    .toPromise();

async function tryUpdate(z: ZObject, bundle: KontentBundle<InputData>, variant: LanguageVariantModels.ContentItemLanguageVariant, item: ContentItemModels.ContentItem) {
  const workflow = await getWorkflow(z, bundle);
  const currentStepId = variant.workflow.stepIdentifier.id;

  if (currentStepId && workflow.publishedStep.id === currentStepId) {
    // Create new version first
    await createNewVersion(z, bundle, item.id, variant.language.id || '');
  }

  const result = await upsertVariant(z, bundle, {
    itemId: item.id,
    languageId: variant.language.id || '',
    contentTypeId: item.type.id,
  });

  return await getItemResult(z, bundle, item, result, false);
}

export const updateLanguageVariant = {
  noun: 'Update language variant',
  display: {
    hidden: false,
    description: 'Updates a language variant using Kontent Management API.',
    label: 'Update Language Variant',
  },
  key: 'update_variant',
  operation: {
    perform: execute,
    inputFields: [
      getLanguageField({ required: true }),
      getContentTypeField({ required: true, altersDynamicFields: true }),
      ...itemSearchFields,
      elementsInfoField,
      (z: ZObject, bundle: KontentBundle<{ contentTypeId: string }>) =>
        getItemElementFields(z, bundle, bundle.inputData.contentTypeId),
    ],
    sample: contentItemSample,
    outputFields: contentItemOutputFields,
  },
} as const;

export type InputData = Readonly<{
  languageId: string;
  contentTypeId: string;
  elements_header?: string;
}> & ItemSearchFieldsOutputType & ElementFields;
