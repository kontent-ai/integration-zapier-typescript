import { getSecret } from './getSecret';
import { ZObject } from 'zapier-platform-core';
import { KontentBundle } from '../types/kontentBundle';
import { signatureHelper } from '@kontent-ai/webhook-helper';

export function hasValidSignature(z: ZObject, bundle: KontentBundle<{}>) {
    const secret = getSecret(z, bundle);
  
    return signatureHelper.isValidSignatureFromString(
      bundle.rawRequest?.content ?? '', 
      secret, 
      bundle.rawRequest?.headers?.['Http-X-Kontent-Ai-Signature'] ?? '');
}
