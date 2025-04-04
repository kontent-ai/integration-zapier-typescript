import { getWorkflow } from '../../utils/workflows/getWorkflow';
import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../../types/kontentBundle';
import { OutputField } from '../../fields/output/outputField';
import { OutputFromOutputFields } from '../../fields/output/outputFromOutputFields';

const execute = (z: ZObject, bundle: KontentBundle<{}>): Promise<Output> =>
  getWorkflow(z, bundle)
    .then(wf => [...wf.steps, wf.publishedStep, wf.archivedStep].map(s => ({ id: s.id, name: s.name })));

const outputFields = [
  {
    key: 'id',
    label: 'Workflow step ID',
    type: 'string',
  },
  {
    key: 'name',
    label: 'Workflow step name',
    type: 'string',
  },
] as const satisfies ReadonlyArray<OutputField>;

type Output = ReadonlyArray<OutputFromOutputFields<typeof outputFields>>;

export default {
  noun: 'Workflow step',
  display: {
    hidden: true,
    description: 'Gets workflow steps for the input dropdown, in the order, in which they are defined in Kontent.ai.',
    label: 'Get Workflow Steps',
  },
  key: 'get_workflow_steps',
  operation: {
    perform: execute,
    sample: {
      id: '88ac5e6e-1c5c-4638-96e1-0d61221ad5bf',
      name: 'Draft',
    },
    outputFields,
  },
} as const;
