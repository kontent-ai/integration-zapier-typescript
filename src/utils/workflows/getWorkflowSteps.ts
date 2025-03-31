import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../../types/kontentBundle';
import { createManagementClient } from '../kontentServices/managementClient';
import { WorkflowContracts, WorkflowModels } from '@kontent-ai/management-sdk';
import { nullMap } from '../functional';

export const getWorkflow = async (z: ZObject, bundle: KontentBundle<{}>): Promise<WorkflowModels.Workflow> =>
  {
    const res = await createManagementClient(z, bundle)
      .listWorkflows()
      .toPromise()
      .then(res => res.data.find(w => w.codename === "default"));

    if (!res) {
      throw new Error('Default workflow not found. This should never happen.');
    }

    return res;
  };