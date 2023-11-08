# Card Collector

- Live Site URL: [Card Collector](https://card-collector.onrender.com)

## Summary:

- Register to begin your collection
- ADD CARDS to your collection by searching from a deep database of all pokémon cards from base set to current
- View individual cards -- name, set, rarity, market value
- Update the current market value of the card from the detail screen, as well as viewing the value history as you create it

- Once a card is added to your collection:
  - you can view the individual card's information by clicking on it
  - You can FILTER through your collection with a variety of options
  - You can view your collection neatly organized by SETS - by year
  - You can add cards to your special cards to a PRIZE binder, and your extremely special cards to the ELITE

## Table of contents

- [Screenshot](#screenshot)
- [Environment Variables](#environment-variables)
- [Built with](#built-with)
- [Continued development](#continued-development)
- [Author](#author)

### Screenshot

![](./collage.jpg)

### Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`MONGODB_URI` - MongoDB key [MongoDB](https://www.mongodb.com/)

`SESSION_SECRET` - Random string for security

`POKE_API_KEY` - API key for the TCG database [PokeAPI](https://pokemontcg.io/)

### Built with

- Flexbox
- [JavaScript](https://www.javascript.com/) - Frontend scripting language
- [Node.js](https://nodejs.dev/en/) - Backend JavaScript runtime environment
- [Express](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL cloud database
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [Passport](https://www.passportjs.org/) - Authorization and session security

### Continued Development

- [ ] Adding a form for showing multiple owned copied of the same card
- [ ] Search for name by "contains" with wildcard capability
- [x] Price card totals by collection
- [ ] Ability to manually edit card info section for other country prices, PSA grading, etc (Note: manually added fields will not auto update prices, etc. Require manual updates)
- [x] Missing license -- whoops
- [ ] Export to csv

## Author

- Website - [Jesse Putnam](https://jessejputnam.com)
