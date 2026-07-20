## What it does

Paste a User-Agent string and the tool breaks out the identifying tokens it carries - browser and version, rendering engine, operating system and version, device class, and CPU architecture - estimates the distinguishing bits each contributes, and flags whether the string is in the reduced, frozen form modern browsers now send.

## The point it makes

A User-Agent is a small pile of entropy. No single token identifies you, but together they narrow the field, and the more detailed the string, the more distinguishing it is. The tool shows that surface honestly. The bit figures are illustrative, drawn from published fingerprinting research, not a live measurement of any population - the goal is to make the shape of the surface visible, not to score you.

## Where the detail went

Modern browsers freeze the User-Agent: Chromium fixes the minor version to 0.0.0 and caps platform detail, and Safari long ago pinned much of its string. The detail did not disappear - it moved to User-Agent Client Hints (Sec-CH-UA and friends), which a site must actively request through the Accept-CH header. The consequence is that high-entropy collection is now visible in headers rather than implicit in one string. Decode/explain only: the input is a string you paste, nothing is read from your own browser and nothing is sent.
