import { ZObject } from "zapier-platform-core";
import { KontentBundle } from "../../types/kontentBundle";
import { createManagementClient } from "../kontentServices/managementClient";

export const getTaxonomyGroup = (z: ZObject, bundle: KontentBundle<{}>) => (groupId: string) =>
  createManagementClient(z, bundle)
    .getTaxonomy()
    .byTaxonomyId(groupId)
    .toPromise()
    .then(res => res.data);
