import { getVariant } from '../utils/items/get/getVariant';
import { getContentItemField } from '../fields/getContentItemField';
import { getWorkflowStepField } from '../fields/getWorkflowStepField';
import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../types/kontentBundle';
import { getWorkflow } from '../utils/workflows/getWorkflowSteps';
import { Field } from '../fields/field';
import { createManagementClient } from '../utils/kontentServices/managementClient';
import { OutputField } from '../fields/output/outputField';
import { OutputFromOutputFields } from '../fields/output/outputFromOutputFields';

const execute = async (z: ZObject, bundle: KontentBundle<InputData>): Promise<Output> => {
  const createNewVersion = (itemId: string, languageId: string) =>
    createManagementClient(z, bundle)
      .createNewVersionOfLanguageVariant()
      .byItemId(itemId)
      .byLanguageId(languageId)
      .toPromise();

  const publish = (itemId: string, languageId: string) =>
    createManagementClient(z, bundle)
      .publishLanguageVariant()
      .byItemId(itemId)
      .byLanguageId(languageId)
      .withoutData()
      .toPromise();

  const schedulePublishing = (itemId: string, languageId: string, publishDate: string) =>
    createManagementClient(z, bundle)
      .publishLanguageVariant()
      .byItemId(itemId)
      .byLanguageId(languageId)
      .withData({ scheduled_to: publishDate })
      .toPromise();

  const cancelScheduling = (itemId: string, languageId: string) =>
    createManagementClient(z, bundle)
      .cancelSheduledPublishingOfLanguageVariant()
      .byItemId(itemId)
      .byLanguageId(languageId)
      .toPromise();

  const changeWorkflowStep = (itemId: string, languageId: string, workflowStepId: string) =>
    createManagementClient(z, bundle)
      .changeWorkflowOfLanguageVariant()
      .byItemId(itemId)
      .byLanguageId(languageId)
      .withData({
        workflow_identifier: { codename: "default" }, // using custom workflows is not supported here yet
        step_identifier: { id: workflowStepId },
      })
      .toPromise();

  const setWorkflowStep = async (itemId: string, languageId: string, workflowStepId: string) => {
    const variant = await getVariant(z, bundle, itemId, languageId);
    const workflow = await getWorkflow(z, bundle);

    const targetIsScheduled = workflow.scheduledStep.id === workflowStepId;

    const currentStepId = variant.workflow.stepIdentifier.id || '';
    if ((currentStepId === workflowStepId) && !targetIsScheduled) {
      // Already in that step (except for scheduled)
      return { message: 'Content item is already in the requested workflow step' };
    }

    const targetIsFirst = workflow.steps[0]?.id === workflowStepId;

    if (workflow.publishedStep.id === currentStepId) {
      // Create new version first
      await createNewVersion(itemId, languageId);
      if (targetIsFirst) {
        // New version ends up in first WF step
        return { message: 'New Draft version has been created' };
      }
    }
    else if (workflow.scheduledStep.id === currentStepId) {
      // Cancel scheduling first
      await cancelScheduling(itemId, languageId);
      if (targetIsFirst) {
        // Cancelled scheduling ends up in first WF step
        return { message: 'Scheduling cancelled and content item has retuned to Draft' };
      }
    }

    if (workflow.publishedStep.id === workflowStepId) {
      await publish(itemId, languageId);

      return { message: 'Content item has been published' };
    }
    else if (targetIsScheduled) {
      const publishDate = bundle.inputData.publishDate;
      if (!publishDate) {
        throw new Error('Missing required field publishDate.');
      }

      // If publish date is soon (within a minute from now) or in the past, we need to publish as scheduling may fail
      const isInPast = new Date(publishDate).getTime() < new Date(new Date().toUTCString()).getTime() + 60_000;
      if (isInPast) {
        await publish(itemId, languageId);

        return { message: 'Content item has been published instead of scheduling in a moment' };
      }
      else {
        await schedulePublishing(itemId, languageId, publishDate);

        return { message: 'Content item has been scheduled to publishing' };
      }
    }
    else {
      await changeWorkflowStep(itemId, languageId, workflowStepId);

      return { message: 'Content item workflow step has changed' };
    }
  };

  // ID = "<item id>/<language id>"
  const fullItemId = bundle.inputData.fullItemId;
  if (!fullItemId) {
    throw new Error('Missing full item ID');
  }

  const [itemId, languageId] = fullItemId.split('/');

  if (!itemId || !languageId) {
    throw new Error(`Full item ID has to be in format "[item id]/[language id]", found "${fullItemId}"`);
  }

  const workflowStepId = bundle.inputData.workflowStepIds;
  if (!workflowStepId) {
    throw new Error('Missing target workflow step ID');
  }

  return await setWorkflowStep(itemId, languageId, workflowStepId);
};

const getScheduledPublishingFields = async (z: ZObject, bundle: KontentBundle<InputData>): Promise<ReadonlyArray<Field>> => {
  const workflow = await getWorkflow(z, bundle);
  const stepId = bundle.inputData.workflowStepIds;

  if (workflow.scheduledStep.id === stepId) {
    // Only display the datetime field for Scheduled workflow step
    return [{
      type: 'datetime',
      key: 'publishDate',
      label: 'To be published on',
      helpText: 'In case the publishing time is in the past, the content item gets published immediately.',
      required: true,
    }];
  }

  return [];
};

const outputFields = [
  {
    key: 'message',
    label: 'Operation result message',
    type: 'string',
  },
] as const satisfies ReadonlyArray<OutputField>;

type Output = OutputFromOutputFields<typeof outputFields>;

export const changeContentItemWorkflow = {
  noun: 'Language variant workflow change',
  display: {
    'hidden': false,
    'description': 'Changes a language variant\'s workflow.',
    'label': 'Change Language Variant Workflow Step',
  },
  key: 'change_item_workflow',
  operation: {
    perform: execute,
    inputFields: [
      getContentItemField({
        helpText: 'Select the content item to update.\n\nFor a custom value use compound content item id in a form of "[item id]/[language id]"',
      }),
      getWorkflowStepField({
        required: true,
        helpText: 'Select a workflow step to which the content item should move.\n\n[More about workflow in Kontent.ai ...](https://kontent.ai/learn/tutorials/manage-kontent-ai/roles-and-workflow/manage-workflows/)',
        search: 'find_workflow_step.id',
      }),
      getScheduledPublishingFields,
    ],
    outputFields,
    sample: {
      message: 'Content item workflow step has changed',
    },
  },
} as const;

export type InputData = Readonly<{
  fullItemId?: string;
  workflowStepIds: string;
  publishDate?: string;
}>;
