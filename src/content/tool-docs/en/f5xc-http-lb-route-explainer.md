## What it does

This tool decodes the routes block of an F5 Distributed Cloud (XC) HTTP load balancer. Paste the full `http_loadbalancer` object from the Console's JSON view, just its `routes` array, or a create/get API envelope, and the tool walks each route in order and explains it: the route type (simple, redirect, direct-response, or custom), the match conditions (HTTP method, path as prefix / exact / regex, and any header or query-parameter conditions), the action (which origin pool with what weight, or the redirect target, or the direct-response code), any path rewrite and request/response header mutations, the host-rewrite override, and the per-route WAF attachment. It also simulates first-match evaluation - give it a method and a path, and it tells you which route would win. Everything runs in your browser.

## Why order matters

XC evaluates routes in the order they appear, and the first route that matches wins - the same first-match model Envoy uses under the hood. F5's own guidance makes this concrete: when you want a route to take priority, you drag it to the top of the list. That is why the tool numbers routes in order, states the first-match rule up front, and warns you when a catch-all route (prefix `/` or regex `.*` with no header conditions) sits above more specific routes, because those later routes can never be reached.

## The per-route WAF

A load balancer has one WAF policy at its base, but any simple route can override it. In Advanced Options a route can attach its own App Firewall, or disable WAF entirely, or leave it to inherit the load balancer's policy - which is the default. The tool shows each route's WAF mode explicitly and flags routes that disable WAF, because an unprotected route is easy to create by accident and hard to spot in raw JSON.

## The four route types

A simple route forwards matching traffic to an origin pool. A redirect route returns a 3xx to a new protocol, host, and path. A direct-response route returns a fixed status code and body without touching an origin - F5's own examples use this to serve small pages or scripts. A custom route object references a separately defined route, so its match and action live in that referenced object; the tool shows the reference and notes that the details are external, and the first-match simulator flags that such a route could match ahead of the one it picked.
