import 'fast-text-encoding';
import { pedersen_from_hex } from 'pedersen-fast';

export const computePedersenHash = (address) => {
    return pedersen_from_hex(address);
}
