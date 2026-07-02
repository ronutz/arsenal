## What it does

Paste a CVSS v3.1 or v3.0 vector string and the tool computes the score, maps it to a severity band, and spells out what every metric means. It computes the Base score, and the Temporal and Environmental scores too when those metrics are present in the vector. It is pure math and runs offline; nothing is sent anywhere.

## What CVSS is

CVSS, the Common Vulnerability Scoring System from FIRST.org, is the standard way to express how severe a vulnerability is as a single number from 0.0 to 10.0. That number is not assigned by hand; it is computed from a vector string, a compact list of metrics like `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`, where each field is one characteristic of the vulnerability. The tool reverses that string back into plain language and runs the official formula on it.

## The Base metrics

The Base score, the part every vector has, is built from metrics in two groups. The exploitability metrics describe how hard the vulnerability is to use: **Attack Vector** (network, adjacent, local, or physical), **Attack Complexity**, **Privileges Required**, and **User Interaction**. The impact metrics describe what happens if it is used: the effect on **Confidentiality**, **Integrity**, and **Availability**. **Scope** sits between them and captures whether exploiting the component can affect resources beyond it. The tool shows each metric's chosen value and its meaning, so a vector stops being an opaque code.

## Score, severity, and the other groups

The computed Base score maps to a qualitative band: None, Low, Medium, High, or Critical. Two optional metric groups refine it when present: **Temporal** metrics adjust for the current state of exploit code and fixes, and **Environmental** metrics re-weight the score for your specific deployment, including your own confidentiality, integrity, and availability requirements. The arithmetic follows the FIRST.org specification exactly, including the specification's own rounding rule, so the number the tool shows matches the official calculator.

## Using it

Paste a v3.0 or v3.1 vector and read the score, the severity band, and the decoded metrics. The calculation is deterministic: the same vector always yields the same score, because it is the published formula and nothing else.
