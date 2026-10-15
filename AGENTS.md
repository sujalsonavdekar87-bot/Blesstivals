# BlessTivals website architecture

- Keep the public site organized into four content routes: Home (`/`), Services (`/services`), Work (`/work`), and Contact (`/contact`).
- Use one shared public navigation and footer across those four routes. Each content page owns its title, description, Open Graph metadata, and Twitter card metadata. Keep the private admin and authentication pages outside the public-site shell.
- Keep client administration at `/admin`, with separate `/sign-in` and `/sign-up` routes. Clerk sign-in is not sufficient by itself: API reads/writes for admin data and image publishing also require a verified email listed in `BLESSTIVALS_ADMIN_EMAILS`.
- Store editable site copy, services, contact details, and gallery references in the site-content database record. Upload image bytes to App Storage; only published gallery images are publicly served.
- Keep direct telephone and Instagram links available as enquiry options. The Contact page also submits enquiries to the API, where the client can review them and change their status in the admin area.
- Do not present the supplied reel or illustrative images as verified BlessTivals client work, and do not invent customer, venue, date, award, or performance claims.
