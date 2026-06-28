// ============================================================================
// src/lib/tools/cidr/index.ts
// ----------------------------------------------------------------------------
// Public surface of the arsenal-local extended CIDR compute. Single-subnet
// analysis is provided by @ronutz/netcore (cidrTool.run); these three modes
// (VLSM, aggregate, overlap/gap) are pure and promotable to netcore later.
// ============================================================================

export {
  CidrInputError,
  ipToInt,
  intToIp,
  maskForPrefix,
  prefixSize,
  parseCidr,
  parseCidrList,
  allocateVlsm,
  aggregate,
  analyzeOverlapGap,
} from "./compute";

export type {
  ParsedCidr,
  VlsmRequirement,
  VlsmSubnet,
  VlsmResult,
  CidrBlock,
  AggregateResult,
  OverlapKind,
  OverlapPair,
  OverlapGapResult,
} from "./compute";

export { GOLDEN_VECTOR_SET_ID, verifyVectors } from "./golden-vectors";
export type { VerifyReport } from "./golden-vectors";
