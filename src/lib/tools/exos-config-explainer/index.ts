// ============================================================================
// src/lib/tools/exos-config-explainer/index.ts
// ----------------------------------------------------------------------------
// EXTREMEXOS (EXOS / "Switch Engine") CONFIG EXPLAINER.
// A {manifest, run, vectors} triple. Paste an EXOS config and it explains each
// command, aggregates the VLANs, and groups the commands by category.
//
// Pure and deterministic (D-49): a model of the ExtremeXOS imperative command
// grammar, never a probe. It never connects to a switch, never runs a command,
// never fetches. Clean-room from the ExtremeXOS Command Reference.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, CATEGORY_LABEL } from "./compute";
export type {
  ExosResult, ExosMode, ExosCategory, ExosLine, ExosVlan, ExosGroup, ExosNote, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { ExosVector } from "./golden-vectors";

/** The D-49 declarative manifest for the exos-config-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Extreme switching & fabric (EXOS / VOSS / SPB)",
  toolSlug: "exos-config-explainer",
  canonicalAliases: [
    "exos-explainer",
    "extremexos-config",
    "switch-engine-config",
    "exos-config-decoder",
    "extreme-exos-explainer",
  ],
  inputDetectors: [
    {
      // "create vlan NAME tag N" is a hallmark EXOS line.
      kind: "regex",
      pattern: "create\\s+vlan\\s+\\S+",
      priority: 8,
      example: "create vlan engineering tag 100",
    },
    {
      // The flagship port-to-VLAN assignment.
      kind: "regex",
      pattern: "configure\\s+vlan\\s+\\S+\\s+add\\s+ports",
      priority: 8,
      example: "configure vlan engineering add ports 1:1, 1:2 tagged",
    },
    {
      // EXOS enables routing with this exact command.
      kind: "regex",
      pattern: "enable\\s+ipforwarding",
      priority: 6,
      example: "enable ipforwarding",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // A switch config carries internal IPs / hostnames / port labels -> fragment.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/how-extremexos-config-is-structured",
  ],
  sources: [
    { id: "exos-cmd-ref", label: "Extreme Networks: ExtremeXOS Command Reference Guide (the imperative verb set create/configure/enable/disable/delete/unconfigure; configure vlan add ports [tagged|untagged]; create vlan tag; enable ipforwarding; configure iproute add default; enable sharing grouping; port numbering slot:port)", url: "https://documentation.extremenetworks.com/exos_commands_16/EXOS_16_2/EXOS_Commands_All/ExtremeXOS_all_commands.shtml" },
    { id: "exos-vlan-add-ports", label: "Extreme Networks: configure vlan add ports (untagged ports belong to a single VLAN and must be removed from the Default VLAN first; tagged ports carry the 802.1Q tag; example configure vlan accounting add ports 1:1, 1:2, 1:3, 1:6 tagged)", url: "https://documentation.extremenetworks.com/exos_commands_16/EXOS_16_2/EXOS_Commands_All/r_configure-vlan-add-ports.shtml" },
    { id: "exos-user-guide", label: "Extreme Networks: ExtremeXOS / Switch Engine User Guide (VLANs, virtual routers, IP routing, link aggregation 'sharing', spanning tree, accounts and management)", url: "https://documentation.extremenetworks.com/switchengine_32.7/" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure engine. */
export { run as runTool };

export const __selftest = verifyVectors;
