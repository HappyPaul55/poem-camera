---
title: Privacy Policy
description: How Poem Camera handles the photo you take, the settings it stores on your device, and the poem it writes.
updated: "2026-10-04"
---

Poem Camera is a free browser camera. It has no accounts, no newsletter and no advertising. This notice explains the very small amount of information it touches, and why.

## Who is responsible

Poem Camera is published by **HappyPaul55**, who is the data controller for anything described below. You can contact the controller through [happypaul55.com](https://happypaul55.com) or the [project repository on GitHub](https://github.com/HappyPaul55/poem-camera).

## What we do not collect

We do not ask for, store or share any personal information. In particular:

- There is no sign-up, login or account of any kind.
- We set no cookies of our own and use no analytics, trackers or advertising
  pixels. (A Cloudflare Turnstile check, described below, runs when you open the
  camera.)
- We keep no gallery, history or server-side storage of your photos or your poems.

## The camera

The camera stream stays on your device. When you press the shutter, a single frame is captured in your browser; if you have previews turned on, you decide whether to keep it. Nothing is uploaded until you choose to turn a frame into a poem.

If you would rather not grant camera access, you can use **Upload file** instead — the picture is read in your browser and treated exactly like a captured frame.

## How the poem is written

When you ask for a poem, your browser sends that single image to this website's own server. Our server passes the image to a third-party AI model, which returns a short poem. The image is used only to write the poem for that one request and is not stored by us.

The AI provider processes the image in order to generate the poem and may see the standard technical information that any web request includes, such as an IP address, in order to return a response and to protect itself from abuse. We do not use the image or the poem for any other purpose, and we do not sell or share data with anyone else.

If you would prefer not to make this request, simply do not take a photo — the rest of the page works without it.

## Keeping the poem service free

Each poem costs money to write, so the service could be abused by bots. When the
camera opens, **Cloudflare Turnstile** checks that you are a person. Cloudflare
sees your IP address and the standard technical details of the request in order
to make that check. If you pass, your browser stores a signed token in
`sessionStorage` that lasts for **30 minutes**, so taking several photos needs
only one check; the check appears again after that, or when the tab is closed.
We do not store the token result on our servers.

## Settings stored on your device

Your preferences — fullscreen, previews, instant print, the chosen poem form and style, and your printer configuration — are saved in your browser's `localStorage` so they are there next time. The 30-minute human-check token is kept separately in `sessionStorage` and disappears when you close the tab. That data never leaves your device and is removed when you clear your browser storage.

## Printing

Printing to a photo printer uses your browser's own print dialog. Printing to a thermal receipt printer uses Web Bluetooth, which connects your browser directly to the printer you choose; nothing about that connection is sent to us.

## Third parties

- **Cloudflare** hosts the site, runs the poem-generation endpoint, and provides the Turnstile human check.
- An **AI model provider** receives the single image you submit, in order to write the poem.

Neither is used to build a profile of you, and we do not sell or share data with anyone else.

## Lawful basis

Where the image counts as personal data, we process it on the basis of our legitimate interests in operating a free creative tool (Article 6(1)(f) UK GDPR). The image is sent only when you ask for a poem, is used only to generate that poem, and is not stored or linked to you.

## Your rights

Under UK data protection law you have the right to be informed, to access, to rectify, to erase, to restrict or object to processing, and to data portability. Because we do not store any personal data about you, in practice there is usually nothing to access or erase. You can raise any concern with us through [happypaul55.com](https://happypaul55.com), or with the [Information Commissioner's Office](https://ico.org.uk).

## Changes

If this notice changes, the "last updated" date at the top of this page will change with it.
