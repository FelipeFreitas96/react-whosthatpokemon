import React, { Component } from 'react';
import api from './services/api';
import './App.css';

const loadingImage = require('./images/loading.gif');

class App extends Component {
  constructor(props) {
    super(props);
    this.imageRef = null;
    this.start = this.start();
    this.state = {
      points: { win: 0, loss: 0 },
      pokemons: [],
      choices: [],
      answer: {},
      loading: true,
    };
  }

  componentDidMount() {
    this.start.next();
  }

  onChoicePokemon(name) {
    const { answer, points } = this.state;
    if (name === answer.name) {
      points.win += 1;
    } else {
      points.loss += 1;
    }

    setTimeout(() => {
      this.start = this.loadGame();
      this.start.next();
    }, 1500);

    this.showPokemon();
    this.setState({ points });
  }

  onRefPokemon(image) {
    this.imageRef = image;
  }

  onLoadPokemon() {
    this.setState({ loading: false });
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  }

  getRandomPokemon() {
    const { pokemons } = this.state;
    return pokemons[Math.floor(Math.random() * pokemons.length)];
  }

  showPokemon() {
    this.imageRef.classList.add('PokemonShow');
  }

  loadPokemon() {
    api.get('/pokemon/?limit=151').then(({ data }) => {
      const { results: pokemons } = data;
      this.setState({ pokemons });
    }).then(() => {
      this.start.next();
    });
  }

  loadChoices() {
    const choices = new Set([]);
    while (choices.size < 4) {
      choices.add(this.getRandomPokemon());
    }
    this.setStateAsync({ choices: [...choices] }).then(() => this.start.next());
  }

  loadAnswer() {
    const { choices } = this.state;
    const answer = this.getRandomPokemon();
    api.get(answer.url).then(({ data }) => {
      const { sprites } = data;
      choices[Math.floor(Math.random() * choices.length)] = answer;
      answer.image = sprites.front_default;
      this.setState({ choices, answer });
    }).then(() => {
      this.start.next();
    });
  }

  * loadGame() {
    this.setState({ loading: true });

    // eslint-disable-next-line no-console
    console.log('Loading choices...');
    yield this.loadChoices();

    // eslint-disable-next-line no-console
    console.log('Loading answer...');
    yield this.loadAnswer();
  }

  * start() {
    // eslint-disable-next-line no-console
    console.log('Loading Pokémon API...');
    yield this.loadPokemon();

    // eslint-disable-next-line no-console
    console.log('Loading choices...');
    yield this.loadChoices();

    this.start = this.loadGame();
    this.start.next();
  }

  renderPokemon() {
    const { choices } = this.state;
    return choices.map(({ name }, index) => (
      <input type="button" key={index.toString()} value={name} onClick={() => this.onChoicePokemon(name)} />
    ));
  }

  render() {
    const { loading, answer, points } = this.state;
    const loadingClass = !loading && 'Pokemon-Loaded';
    return (
      <div className="App">
        <h1>Who is that Pokémon?</h1>
        <h3>
          Win:
          {points.win}
          ,
          Loss:
          {points.loss}
        </h3>
        <img
          id="Pokemon"
          className={loadingClass}
          onLoad={() => this.onLoadPokemon()}
          ref={(img) => this.onRefPokemon(img)}
          src={answer.image}
          alt="pokemon"
        />
        <div>
          {!loading
            ? this.renderPokemon()
            : <img src={loadingImage} alt="loading" />}

          <div className="w3-blue" style={{ width: '75%' }} />
        </div>
      </div>
    );
  }
}

export default App;
