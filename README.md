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
  - Just like in real life, you can organize your cards into custom bindersnode

## Table of contents

- [Screenshot](#screenshot)
- [Environment Variables](#environment-variables)
- [Built with](#built-with)
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
- [Node.js](https://nodejs.dev/en/) - Backend JavaScript runtime environment [Prefer 20.12.1, fetch is used]
- [Express](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL cloud database
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [Passport](https://www.passportjs.org/) - Authorization and session security

## Author

- Website - [Jesse Putnam](https://jessejputnam.com)
