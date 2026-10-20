# Rabbit

A clickable iOS app prototype for **Rabbit**, a marketplace for pre-loved condos at fair prices, built for young adults buying their first home.

It's plain HTML, CSS and JavaScript with no build step and no dependencies. On a laptop it shows inside an iPhone frame next to a brand panel. On a phone it runs full screen, and you can add it to the home screen like a native app.

The page structure follows the Apple Store iOS app (For You, Browse, Search, Saved and Account tabs, product pages with a configurator, and a bag-style checkout), with Rabbit's own brand and palette.

## Screens and flows

| Flow | Screens |
| --- | --- |
| Getting started | Splash → Welcome → 4-step onboarding (name, budget, bedrooms, neighborhoods and must-haves) |
| Discover | **For You** (matches, price drops, neighborhoods, Buyer School guides) · **Browse** (categories, neighborhoods, all condos with sorting) · **Search** (live text search, bedroom chips, filter sheet, recent searches) |
| Listing | Photo gallery, price and monthly estimate, specs, features, inspection report with condition score, monthly cost breakdown, building facts, map, agent, similar condos |
| Make it yours | **Book a tour** (in person or video, day and time picker) · **Make an offer** (configurator: amount, down payment, loan term, move-in, contingencies, live monthly estimate) · **Review & pay** ($500 good-faith deposit, payment method) · **Offer sent** confirmation |
| After the offer | **Offer tracker** with timeline. Simulate the seller's response (accept or counter), then accept or decline a counter, and follow the deal through inspection to closing. You can also withdraw an offer. |
| Saved & account | **Saved** list with side-by-side compare · **Account** (offers, tours, messages, preferences, notifications, reset demo) · **Chat** with the listing agent, with quick replies and canned agent answers |

Everything you do (your name, preferences, saved condos, tours, offers, chats) is stored in `localStorage`, so it survives a reload. **Reset demo data** in Account clears it.

## Run locally

```bash
python3 -m http.server 4000
```

Then open http://localhost:4000. Opening `index.html` directly also works.

## Publish with GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings › Pages**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. Share the `https://<user>.github.io/<repo>/` link. On a phone, open it and choose **Add to Home Screen** to use it full screen.

## Structure

- `index.html`: the app shell (device frame, side panel, tab bar)
- `css/styles.css`: design tokens (Plum, Slate, Paper, Deep Teal, Teal), components and motion
- `js/data.js`: listings, neighborhoods, agents, Buyer School guides and photo credits
- `js/store.js`: app state persisted to `localStorage`
- `js/views.js`: every screen, plus its actions
- `js/app.js`: hash router with push and pop transitions, sheets, toasts and event delegation
- `js/icons.js`, `js/util.js`: icon set, formatting, mortgage maths and the logo mark
- `assets/icon.svg`: the Rabbit logo (a house with rabbit ears). PNG versions are for home-screen icons.
- `assets/photos/`: property photos from Pexels

## Brand

- **Logo:** a house with rabbit ears, window eyes and a door, on a plum tile. The wordmark is lowercase "rabbit".
- **Palette:** Plum `#544374`, Slate `#485274`, Paper `#FDFDFE`, Deep Teal `#144B5C` and Teal `#22848D`. Primary buttons use Deep Teal with white text. Teal is for fills and outlines, and a slightly darker `#1B6F77` for teal text so it stays readable.
- **Type:** Bricolage Grotesque for display text and Figtree for body text (Google Fonts).

## Sample data

Listings, prices, agents, inspection reports and the deposit are placeholder content. Monthly estimates use example rates (6.4% for 30 years, 5.7% for 15 years) and 1.1% yearly property tax. No offers are sent and no money moves.

## Photo credits

All property photos are from [Pexels](https://www.pexels.com) and free to use under the [Pexels license](https://www.pexels.com/license/).

| File | Photographer | Source |
| --- | --- | --- |
| ext-juniper | Андрей | [pexels.com/photo/8063958](https://www.pexels.com/photo/view-of-residential-buildings-in-a-city-8063958/) |
| ext-maple | Willian Justen de Vasconcellos | [pexels.com/photo/29560594](https://www.pexels.com/photo/brick-building-with-modern-industrial-design-29560594/) |
| ext-harbor | The Six | [pexels.com/photo/33247909](https://www.pexels.com/photo/modern-vancouver-skyline-by-the-water-33247909/) |
| ext-cedar | SHOX ART | [pexels.com/photo/31656168](https://www.pexels.com/photo/modern-apartment-building-with-green-courtyard-31656168/) |
| ext-alder | Luis Quintero | [pexels.com/photo/2091634](https://www.pexels.com/photo/minimalist-photography-of-white-and-gray-condominium-2091634/) |
| ext-linden | ha ha | [pexels.com/photo/16345410](https://www.pexels.com/photo/buildings-with-terraces-16345410/) |
| ext-orchard | alex ohan | [pexels.com/photo/16816523](https://www.pexels.com/photo/low-angle-shot-of-a-modernist-block-of-flats-16816523/) |
| ext-quay | Maximilian Ruther | [pexels.com/photo/11557790](https://www.pexels.com/photo/illuminated-buildings-near-calm-waters-under-a-gray-sky-11557790/) |
| living-1 | Zak Chapman | [pexels.com/photo/2030037](https://www.pexels.com/photo/living-room-furniture-set-2030037/) |
| living-2 | I'm Zion | [pexels.com/photo/9494898](https://www.pexels.com/photo/sofa-in-a-spacious-living-room-9494898/) |
| living-3 | Peter Vang | [pexels.com/photo/36816986](https://www.pexels.com/photo/bright-modern-living-room-with-hardwood-floor-36816986/) |
| living-4 | Max Vakhtbovych | [pexels.com/photo/6920439](https://www.pexels.com/photo/modern-living-room-design-with-corner-sofa-6920439/) |
| loft-1 | Max Vakhtbovych | [pexels.com/photo/7587819](https://www.pexels.com/photo/brick-walls-inside-an-apartment-7587819/) |
| kitchen-1 | Lisa Anna | [pexels.com/photo/19846388](https://www.pexels.com/photo/kitchen-with-white-cabinets-and-silver-appliances-19846388/) |
| kitchen-2 | Mateusz Pielech | [pexels.com/photo/29252561](https://www.pexels.com/photo/modern-minimalist-white-kitchen-interior-29252561/) |
| kitchen-3 | Arina Krasnikova | [pexels.com/photo/5712145](https://www.pexels.com/photo/wide-angle-shot-of-an-apartment-kitchen-5712145/) |
| kitchen-4 | Lisa Anna | [pexels.com/photo/19857231](https://www.pexels.com/photo/small-white-kitchen-with-window-19857231/) |
| bed-1 | Lachlan Ross | [pexels.com/photo/6510421](https://www.pexels.com/photo/cozy-bed-with-colorful-pillow-and-coverlet-in-light-bedroom-6510421/) |
| bed-2 | Peter Vang | [pexels.com/photo/35618218](https://www.pexels.com/photo/cozy-minimalist-bedroom-with-grey-accents-35618218/) |
| bed-3 | Max Vakhtbovych | [pexels.com/photo/8135505](https://www.pexels.com/photo/modern-bedroom-interior-design-8135505/) |
| bed-4 | Le Barbu La Conciergerie du Barbu | [pexels.com/photo/37369025](https://www.pexels.com/photo/cozy-modern-bedroom-with-natural-light-37369025/) |
| bath-1 | Max Vakhtbovych | [pexels.com/photo/6890406](https://www.pexels.com/photo/toilet-and-sink-in-modern-light-bathroom-6890406/) |
| bath-2 | Max Vakhtbovych | [pexels.com/photo/7005268](https://www.pexels.com/photo/interior-of-modern-bathroom-with-glass-shower-cabin-7005268/) |
| studio-1 | Max Vakhtbovych | [pexels.com/photo/8142976](https://www.pexels.com/photo/apartment-studio-interior-8142976/) |
| studio-2 | Max Vakhtbovych | [pexels.com/photo/6782426](https://www.pexels.com/photo/modern-flat-with-cozy-bed-and-loft-style-lamp-6782426/) |
