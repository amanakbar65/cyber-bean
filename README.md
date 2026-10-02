# Cyber Bean

A single-page website for **Cyber Bean**, a neon, cyberpunk-styled specialty coffee bar.

## Run it

It is a static site with no build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's on the page

- **Hero**: a neon sign that flickers on at load, and a live readout from the espresso machine (boiler temperature, pressure, shots pulled, queue).
- **Menu**: 12 items you can filter by category (arrow keys switch tabs). Each item shows its brew spec and adds to the order in one click.
- **Brew Lab**: build a custom drink from base, size, extra shots, milk, syrup and hot or iced. The glass preview, drink name, caffeine, energy and price update as you change options. Cold brew is iced only.
- **Order drawer**: change quantities, see subtotal, tax and total, then place a pickup order. You get an order code and a progress tracker.
- **Beans, Space, Visit**: origin cards with roast level, the café's perks, and opening hours with a live open/closed status based on the viewer's local time.
- **Newsletter** signup with email validation.

Ordering and the newsletter run entirely in the browser. Nothing is sent to a server.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and content |
| `styles.css` | Visual design, layout and animation (respects `prefers-reduced-motion`) |
| `script.js` | Menu data, Brew Lab logic, cart, hours and live readouts |
