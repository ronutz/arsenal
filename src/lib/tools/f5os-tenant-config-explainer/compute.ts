// ============================================================================
// src/lib/tools/f5os-tenant-config-explainer/compute.ts
// ----------------------------------------------------------------------------
// F5OS TENANT CONFIG EXPLAINER - the pure engine.
//
// WHAT THIS READS. An `f5-tenants:tenants` block, as F5OS prints it from the
// CLI or returns it over RESTCONF, and says what each field means and whether
// the numbers are self-consistent.
//
// *** THE ARITHMETIC THAT MAKES THIS MORE THAN A GLOSSARY ***
//
//   min-memory = (3.5 * 1024 * vcpu-cores-per-node) + 512
//
// F5 publishes that formula. Two vCPUs therefore need 7680 MB and four need
// 14848 MB, and a tenant configured below its minimum is a misconfiguration
// that a glossary would read back approvingly. This engine checks it.
//
// *** AND THE LIFECYCLE RULE PEOPLE GET WRONG ***
//
//   configured -> provisioned -> deployed
//
// To change vCPU or memory on a tenant that is already deployed you must move
// it BACK to `provisioned` first, make the change, then return it to
// `deployed`. Editing a deployed tenant's allocation is not a live operation,
// and expecting it to be is how a maintenance window turns into an outage.
//
// PLATFORM MATTERS. VELOS is a chassis: `nodes` names blades within a chassis
// partition, and a tenant can span them. rSeries is an appliance: there are no
// blades and no chassis partitions, and `vcpu-cores-per-node` moves in
// multiples of four. Reading a VELOS example on an rSeries box is a reliable
// way to configure something that will not commit.
//
// SCOPE. Parses the text you paste. It contacts no system and cannot know how
// much of the platform is already allocated.
// ============================================================================

export type RunningState = "configured" | "provisioned" | "deployed" | "unknown";

export interface TenantField {
  key: string;
  value: string;
  explain: string;
}

export interface TenantDecode {
  name?: string;
  runningState: RunningState;
  vcpu?: number;
  memory?: number;
  /** The published minimum for the vCPU count, when one was given. */
  minMemory?: number;
  nodes: string[];
  vlans: string[];
  fields: TenantField[];
  notes: string[];
  warnings: string[];
}

export class TenantConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantConfigError";
  }
}

/** F5's published minimum-memory formula, in megabytes. */
export function minMemoryFor(vcpu: number): number {
  return Math.round(3.5 * 1024 * vcpu) + 512;
}

const EXPLAIN: Record<string, string> = {
  type: "The tenant type. BIG-IP is the usual answer; the field exists because F5OS is a platform layer rather than a BIG-IP feature.",
  image: "The tenant image bundle. The filename carries the BIG-IP version and, on a chassis, ALL-VELOS rather than ALL-F5OS - so an image built for one platform will not deploy on the other, and the filename is the fastest way to notice.",
  "mgmt-ip": "Out-of-band management address for the tenant itself, separate from the platform's own. A tenant is reached here, not through the chassis address.",
  "prefix-length": "Mask for the tenant management address.",
  gateway: "Default gateway for the tenant management address.",
  cryptos: "Whether the tenant is given access to the platform's crypto and compression hardware. It can only be changed while the tenant is in the configured or provisioned state.",
  storage: "Disk allocated to the tenant, in gigabytes.",
  "appliance-mode": "Restricts the tenant's administrators from reaching a shell. It hardens the tenant and it also removes a diagnostic route, which is worth deciding deliberately rather than inheriting from a template.",
  "mgmt-vlan": "VLAN for tenant management traffic, where the platform separates it.",
  "tenant-auth-support": "Can only be changed while the tenant is NOT deployed.",
};

/** Decode an f5-tenants block, CLI-style or JSON-style. */
export function decodeTenant(input: string): TenantDecode {
  const raw = (input ?? "").trim();
  if (!raw) throw new TenantConfigError("Nothing to decode: paste an f5-tenants:tenants block, as the CLI prints it or as RESTCONF returns it.");

  const notes: string[] = [];
  const warnings: string[] = [];
  const fields: TenantField[] = [];

  /** Read a scalar written either `config key value` or `"key": value`. */
  const scalar = (key: string): string | undefined => {
    const cli = new RegExp(`(?:config|state)\\s+${key}\\s+("[^"]*"|\\S+)`, "i").exec(raw);
    if (cli) return cli[1].replace(/^"|"$/g, "");
    const json = new RegExp(`"${key}"\\s*:\\s*("[^"]*"|[^,}\\s]+)`, "i").exec(raw);
    return json ? json[1].replace(/^"|"$/g, "") : undefined;
  };
  /** Read a list written `[ 1 2 ]` or `[1, 2]`. */
  const list = (key: string): string[] => {
    const m = new RegExp(`(?:config|state)?\\s*"?${key}"?\\s*:?\\s*\\[([^\\]]*)\\]`, "i").exec(raw);
    return m ? m[1].split(/[\s,]+/).filter(Boolean).map((x) => x.replace(/"/g, "")) : [];
  };

  const name = /tenants?\s+tenant\s+(\S+)/i.exec(raw)?.[1] ?? scalar("name");
  const stateRaw = (scalar("running-state") ?? "").toLowerCase();
  const runningState: RunningState =
    stateRaw === "configured" || stateRaw === "provisioned" || stateRaw === "deployed" ? stateRaw : "unknown";

  const vcpuRaw = scalar("vcpu-cores-per-node");
  const memRaw = scalar("memory");
  const vcpu = vcpuRaw ? Number(vcpuRaw) : undefined;
  const memory = memRaw ? Number(memRaw) : undefined;
  const nodes = list("nodes");
  const vlans = list("vlans");

  for (const k of Object.keys(EXPLAIN)) {
    const v = scalar(k);
    if (v !== undefined) fields.push({ key: k, value: v, explain: EXPLAIN[k] });
  }

  if (fields.length === 0 && vcpu === undefined && runningState === "unknown") {
    throw new TenantConfigError(
      "Nothing recognisable found. This expects an f5-tenants block containing fields such as running-state, vcpu-cores-per-node and memory.",
    );
  }

  // --- the lifecycle -------------------------------------------------------
  const stateExplain: Record<RunningState, string> = {
    configured: "Configured: the tenant is defined and no resources have been assigned. Nothing is running and nothing is reserved.",
    provisioned: "Provisioned: the platform has assigned the tenant to its nodes and created its virtual disks, and the image is installed. It is ready to deploy and it is not running.",
    deployed: "Deployed: the tenant is running.",
    unknown: "No running-state was found in this block. The field is what tells the platform what you WANT the tenant to be doing.",
  };
  notes.push(stateExplain[runningState]);
  if (runningState === "deployed") {
    notes.push(
      "To change vCPU or memory on a deployed tenant, move it back to provisioned first, make the change, then return it to deployed. It is not a live operation, and treating it as one is how a maintenance window becomes an outage.",
    );
  }

  // --- the arithmetic ------------------------------------------------------
  let minMemory: number | undefined;
  if (vcpu !== undefined && Number.isFinite(vcpu) && vcpu > 0) {
    minMemory = minMemoryFor(vcpu);
    notes.push(
      `F5 publishes the minimum memory as (3.5 x 1024 x vCPU) + 512, so ${vcpu} vCPU requires at least ${minMemory} MB. More than the minimum can be configured deliberately.`,
    );
    if (memory !== undefined && Number.isFinite(memory)) {
      if (memory < minMemory) {
        warnings.push(
          `Memory is ${memory} MB and the published minimum for ${vcpu} vCPU is ${minMemory} MB. This allocation is BELOW the minimum.`,
        );
      } else if (memory > minMemory) {
        notes.push(
          `Memory is ${memory} MB against a minimum of ${minMemory} MB - ${memory - minMemory} MB above it. That is legitimate, and worth knowing was a decision rather than a default.`,
        );
      }
    }
  }
  if (vcpu !== undefined && memory === undefined) {
    warnings.push("A vCPU count is present with no memory value. When expanding a tenant, both must be changed together - raising vCPU alone leaves the tenant below its new minimum.");
  }

  // --- platform shape ------------------------------------------------------
  if (nodes.length > 0) {
    fields.push({
      key: "nodes",
      value: nodes.join(", "),
      explain:
        nodes.length > 1
          ? "The blades within the chassis partition this tenant runs on. More than one means the tenant spans blades, which is a VELOS arrangement - rSeries is an appliance and has none."
          : "The node this tenant is scheduled on. On VELOS this is a blade within the chassis partition; on rSeries there is a single node.",
    });
  }
  if (vlans.length > 0) {
    fields.push({
      key: "vlans",
      value: vlans.join(", "),
      explain: "VLANs presented to the tenant from the platform. The tenant sees these and nothing else, which is the actual boundary between tenants on shared hardware.",
    });
  }

  const looksVelos = /velos/i.test(raw) || nodes.length > 1;
  if (looksVelos) {
    notes.push(
      "This looks like VELOS: a chassis, with chassis partitions and blades. Each blade offers up to 22 vCPUs, around 95 GB of memory and roughly 600 GB of disk to tenants, so partition capacity is what limits how many tenants fit.",
    );
  }
  if (/rseries|-r\d{4}/i.test(raw)) {
    notes.push(
      "This looks like rSeries: an appliance rather than a chassis. There are no chassis partitions and no blades, vcpu-cores-per-node moves in multiples of four with a default of four, and the default memory is 12288 MB.",
    );
  }
  if (vcpu !== undefined && vcpu % 4 !== 0) {
    notes.push(
      `A vCPU count of ${vcpu} is valid on VELOS. On rSeries the value must be a multiple of four, so this configuration is chassis-shaped - which matters if it is being copied between platforms.`,
    );
  }

  const image = scalar("image");
  if (image) {
    if (/ALL-VELOS/i.test(image)) notes.push("The image name contains ALL-VELOS, so it is built for the chassis platform and will not deploy on rSeries.");
    else if (/ALL-F5OS/i.test(image)) notes.push("The image name contains ALL-F5OS, the appliance-platform build.");
  }

  return { name, runningState, vcpu, memory, minMemory, nodes, vlans, fields, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): TenantDecode {
  return decodeTenant(input);
}
