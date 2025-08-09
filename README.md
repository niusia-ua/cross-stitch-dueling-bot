[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner-direct-single.svg)](https://stand-with-ukraine.pp.ua)

# Cross-Stitch Dueling Bot

This is a hobby project for performing duels between cross-stitchers on Telegram.

The cross-stitch duel is a competition between two (or, in rare cases, three) cross-stitchers (further, players) to see who can make the most stitches in 24 hours.
When the player is done, they must report the result to the bot, which includes:

- Photos in the was/is format with a code word on each photo.
  The code word must be written by hand.
- The total number of stitches made.
- The additional info (optional).
  For example, if the player has worked on many artworks, they can specify the number of stitches made for each artwork.

There are also weekly random duels in which users are randomly mixed (respecting their rate/level).
The participation in these events is optional.

## Project Overview

This project is fully developed with [Nuxt 4](https://nuxt.com).
For the Telegram bot, we use [grammY](https://grammy.dev).

On the backend, we utilize a three-layered architecture:

- Nitro/h3 handlers as controllers.
- Service classes for the business logic.
- Repository classes for the database and storage access.

For Dependency Injection, we use [awilix](https://github.com/jeffijoe/awilix).

As our main database, we use PostgreSQL.
Check out the [database schema diagram](./docs/database.md).

We prefer writing plain SQL, so we use [slonik](https://github.com/gajus/slonik) for performing queries and [node-pg-migrate](https://github.com/salsita/node-pg-migrate) for managing database migrations.

## Development

### Prerequisites

Make sure you have Node.js v24 or above, the latest Docker, and some kind of a tunnel service (e.g., [ngrok](https://ngrok.com)) installed.

Then, talk to [@BotFather](https://t.me/BotFather) to create a bot account.
When you get the bot's token, set up the webhook:

```sh
curl https://api.telegram.org/bot<token>/setWebhook?url=<domain>/bot/webhook&secret_token=<secret>
```

where `<token>` is your bot token, `<domain>` is a URL issued by your tunnel service, and `<secret>` is an arbitrary string used to authorize the webhook requests.

Last, copy the content of [`.env.example`](./.env.example) to `.env` (you need to create this file) and replace the environment variable values with yours, following the instructions.

### Running the Application

1. Install dependencies: `npm install`.
1. Set up additional services (the database, local storage, etc.): `npm run services:up`.
1. Optionally, load mock data to the database: `npm run db:load-mockdata`.
1. Run the tunnel service: `ngrok http --url=<your domain> 3000` (this is an example for ngrok, use the command for your tunnel service).
1. Now, you can run the application: `npm run dev`.

To try the application, visit your bot, send the `/start` command to it and tap the `Menu` button near to input field.
Enjoy the Telegram Web App!

Check out [`package.json`](./package.json) for the rest of the available commands.

## License

[MIT](./LICENSE)
