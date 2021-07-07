let client = new tmi.Client({
  connection: {
    reconnect: true,
  },
  channels: [],
});

client.connect();

const hiddenPhraseElement = document.querySelector('#hidden-phrase');
const revealPhraseButtonElement = document.querySelector('#reveal-phrase-button');
const livesElement = document.querySelector('#lives');
const guessCheckElement = document.querySelector('#guess-check');
const incorrectLettersElement = document.querySelector('#incorrect-letters');
const guesserTimerElement = document.querySelector('#guesser-timer');
const guesserElement = document.querySelector('#guesser');
const startButtonElement = document.querySelector('#start-button');
const twitchChannelInputElement = document.querySelector('#twitch-channel-input');
const startGameCountdownElement = document.querySelector('#start-game-countdown');
const preGameElementsSectionElement = document.querySelector('#pre-game-elements-section');
const playersElement = document.querySelector('#players');
const channelConnectStatusElement = document.querySelector('#channel-connect-status');
const timeToJoinInputElement = document.querySelector('#join-time-select-input');
const guessTimeInputElement = document.querySelector('#guess-time-select-input');
const phrasesListInputElement = document.querySelector('#phrases-select-input');
const customPhrasesTextareaElement = document.querySelector('#custom-phrases-inputs-section');
// hangman body parts elements
const hangmanPostElement = document.querySelector('#post-hangman');
const hangmanHeadElement = document.querySelector('#head-hangman');
const hangmanBodyElement = document.querySelector('#body-hangman');
const hangmanRightArmElement = document.querySelector('#right-arm-hangman');
const hangmanLeftArmElement = document.querySelector('#left-arm-hangman');
const hangmanRightLegElement = document.querySelector('#right-leg-hangman');
const hangmanLeftLegElement = document.querySelector('#left-leg-hangman');

// global variables for the game
const regex = /^[A-Za-z0-9]+$/;
let twitchChannelName = '';
let connectedToChannel = false;
let preGame = true;
let ongoingGame = false;
let timeLeft = 7;
let guessTime = 20;
let nextWordCountdown = 5;
let startGameTimer;
let startGuessTimer;
let startNextWordTimer;

let users = {};
let phrases = [];
let splitPhrase = [];
let linesArray = [];
let chosenPhrase = '';
let hiddenPhrase = '';
let customPhrasesCheck = false;

let lives = 6;
let indices = [];
let incorrectLetters = [];
let correctLetters = [];
let joinedUsers = {};
let joinedUsersColors = {};
let playerCount = 0;

let pageColors = randomColors();
preGameElementsSectionElement.style.backgroundColor = pageColors[0];
playersElement.style.color = pageColors[1];

console.log('splitPhrase:', splitPhrase);
console.log('linesArray:', linesArray);

// sets state of app to not connected to a twitch channel, sends that message via console and DOM
client.log.error = (() => {
  connectedToChannel = false;
  channelConnectStatusElement.textContent = 'Enter a valid Twitch channel';
  console.log('Can\'t connect to Twitch channel')
});

// when a message is sent in chat, do these things..
client.on("message", (channel, tags, message, self) => {
  const { username } = tags;
  // message = message.toLowerCase();
  // check to see that the message is from the correct channel
  if (channel.substring(1) !== twitchChannelName) {
    return;
  }
  console.log('channel:', channel);
  console.log('tags:', tags);
  
  if (self) return;

  // check if it's pregame, time to join game
  if (preGame) {
    hiddenPhraseElement.textContent = '';
    livesElement.textContent = '';
    incorrectLettersElement.textContent = '';
    if (message === '!join') {
      // counting number of players that joined the game
      if (!joinedUsers[username]) {
        playerCount++;
      }
      joinedUsers[username] = true;
      joinedUsersColors[username] = tags.color;
      playersElement.textContent = `${playerCount} Players: ${Object.keys(joinedUsers).join(', ')}`;
    }
    return;
  }

  // if it's ongoingGame time and the user has joined the game
  if (ongoingGame && joinedUsers[username] && username === randomChosenGuesser) {
    // check if guesser input is in the correct format (a single letter)
    if (!regex.test(message) || message.length !== 1) {
      guessCheckElement.style.color = '#e3ec90';
      guessCheckElement.textContent = 'Invalid input. Only enter a single letter or number. Try again.';
      return;
    }
    // if user guesses an already guessed letter, correct OR incorrect
    if (correctLetters.includes(message.toLowerCase()) || incorrectLetters.includes(message.toLowerCase())) {
      guessCheckElement.style.color = '#e3ec90';
      guessCheckElement.textContent = 'You\'ve already guessed that letter. Try again.';
      return;
    } else if (splitPhrase.includes(message.toUpperCase()) || splitPhrase.includes(message.toLowerCase())) { // if user guesses a correct letter, reveal it
      guessCheckElement.textContent = '';
      
      correctLetters.push(message.toLowerCase());
      // finding all indices of correct letter in hidden phrase
      for (var i = 0; i < splitPhrase.length; i++) {
        if (splitPhrase[i] === message.toLowerCase() || splitPhrase[i] === message.toUpperCase()) {
          indices.push(i);
        }
      }
      for (var i = 0; i < linesArray.length; i++) {
        for (var j = 0; j < indices.length; j++) {
          if (i === indices[j]) {
            // check if letter is upper case
            if (splitPhrase[i] === message.toUpperCase()) {
              linesArray.splice(i, 1, message.toUpperCase());
            } else { // else letter is lower case
              linesArray.splice(i, 1, message.toLowerCase());
            }
            
          }
        }
      }
      indices = [];
      // update DOM to show correctly guessed letters
      hiddenPhraseElement.textContent = `Phrase: ${linesArray.join(' ')}`;

      guesserTimerElement.textContent = 'Correct!';
      guesserTimerElement.style.color = '#aaf996';
      
      // if all guesses are made and complete word is filled, game ends
      if (chosenPhrase.split(' ').join('') === linesArray.join('')) {
        ongoingGame = false;
        guessCheckElement.style.color = '#aaf996';
        guessCheckElement.textContent = 'You won!'
        clearTimeout(startGuessTimer);
        nextWord();
      }
      // reset guesser timer
      if (ongoingGame) {
        guessTime = Number(guessTimeInputElement.value);
        chooseGuesser();
      }
    } else if (!splitPhrase.includes(message)) { // incorrect guess
      guessCheckElement.textContent = '';
      lives -= 1;
      // if lives run out, game over
      if (lives <= 0) {
        // showing last piece of hangman to finish the game when user loses
        hangmanLeftLegElement.style.display = 'block';
        
        livesElement.textContent = `Lives: 0`;
        revealPhraseButtonElement.style.display = 'inline';
        incorrectLetters.push(message.toLowerCase());
        incorrectLettersElement.textContent = `Incorrect letters: ${incorrectLetters.join(', ')}`;
        ongoingGame = false;
        guessCheckElement.style.color = '#f79c9c';
        guessCheckElement.textContent = 'Game over';
        clearTimeout(startGuessTimer);
        // guesserTimerElement.textContent = `Guess`
        
      } else { // still have lives, game goes on
        // update hangman body parts being shown
        switch(lives) {
          case 5:
            hangmanHeadElement.style.display = 'block';
            break;
          case 4:
            hangmanBodyElement.style.display = 'block';
            break;
          case 3:
            hangmanRightArmElement.style.display = 'block';
            break;
          case 2:
            hangmanLeftArmElement.style.display = 'block';
            break;
          case 1:
            hangmanRightLegElement.style.display = 'block';
            break;
        }
        
        livesElement.textContent = `Lives: ${lives}`;
        incorrectLetters.push(message.toLowerCase());
        incorrectLettersElement.textContent = `Incorrect letters: ${incorrectLetters.join(', ')}`;
        guesserTimerElement.textContent = 'Incorrect';
        guesserTimerElement.style.color = '#f79c9c';
        guessTime = Number(guessTimeInputElement.value);
        chooseGuesser();
      }
    }
  }

  console.log(`${tags["display-name"]}: ${message}`);
});
