// reset variables for a new game
const resetGame = () => {
  preGame = true;
  ongoingGame = false;
  timeLeft = Number(timeToJoinInputElement.value);
  guessTime = Number(guessTimeInputElement.value);
  clearTimeout(startGuessTimer);
  lives = 6;
  hiddenPhraseElement.textContent = '';
  revealPhraseButtonElement.style.display = 'none';
  livesElement.textContent = '';
  incorrectLettersElement.textContent = '';
  guesserTimerElement.textContent = '';
  guesserTimerElement.style.color = '#f8f9fa';
  guesserElement.textContent = '';
  playersElement.textContent = '0 Players: ';
  guessCheckElement.textContent = '';
  // reset hangman display
  hangmanHeadElement.style.display = 'none';
  hangmanBodyElement.style.display = 'none';
  hangmanRightArmElement.style.display = 'none';
  hangmanLeftArmElement.style.display = 'none';
  hangmanRightLegElement.style.display = 'none';
  hangmanLeftLegElement.style.display = 'none';
  let chosenPhrase = '';
  let randomChosenGuesser = '';
  incorrectLetters = [];
  correctLetters = [];
  joinedUsers = {};
  joinedUsersColors = {};
  playerCount = 0;
}

const revealHiddenPhrase = () => {
  hiddenPhraseElement.textContent = `Phrase: ${chosenPhrase}`;
}

// set twitch chat name to connect to, then connect to it
const connectToChat = () => {
  // check to see if we're already connected to that channel, if so tell user and do nothing
  if (twitchChannelName === twitchChannelInputElement.value.toLowerCase()) {
    // TODO: make the already connected message display in a different way, for now this is fine
    channelConnectStatusElement.textContent = `Already connected to Twitch channel: ${twitchChannelName}`;
    return;
  }
  channelConnectStatusElement.textContent = '';
  twitchChannelName = twitchChannelInputElement.value.toLowerCase();
  client.channels = [twitchChannelName];
  connectedToChannel = true;
  client.connect()
  .then((data) => {
    console.log('data:', data);
  })
  .catch((err) => {
    if (err) {
      console.log('err:', err);
    }
  })
  channelConnectStatusElement.textContent = `Connected to channel: ${twitchChannelName}`;
}

// functionality for start button
const startGame = () => {
  resetGame();  
  // reset start game timer
  clearTimeout(startGameTimer);

  // check to see if custom words are entered correctly
  if (phrasesListInputElement.value === 'Custom') {
    readCustomPhrases(); // read custom phrases if entered correctly
    if (!customPhrasesCheck) { // if custom phrases are not correct / absent
      guessCheckElement.style.color = '#e3ec90';
      guessCheckElement.textContent = 'Custom phrases not entered correctly. Try again.';
      startGameCountdownElement.textContent = '';
      return;
    }
  }
  
  // countdown timer for chat to join game
  const countdown = () => {
    
    // when countdown timer ends, game starts
    if (timeLeft === -1) {
      preGame = false;
      ongoingGame = true;
      startGameCountdownElement.textContent = '';
      timeLeft = Number(timeToJoinInputElement.value);
      guessTime = Number(guessTimeInputElement.value);
      // setting list of phrases to use
      if (phrasesListInputElement.value === 'Custom') {
        // use custom phrases that user entered
        readCustomPhrases();
      } else if (phrasesListInputElement.value === phrasesListInputElement[1].value) {
        phrases = emotesPhrases;
      } else if (phrasesListInputElement.value === phrasesListInputElement[2].value) {
        phrases = streamersPhrases;
      } else if (phrasesListInputElement.value === phrasesListInputElement[3].value) {
        phrases = superheroesPhrases;
      }

      
      // choose phrase and display in hidden format
      choosePhrase();
      
      console.log('hiddenPhrase:', hiddenPhrase);
      hiddenPhraseElement.textContent = `Phrase: ${hiddenPhrase}`;
      livesElement.textContent = `Lives: ${lives}`;
      incorrectLettersElement.textContent = `Incorrect letters: ${incorrectLetters.join(', ')}`;
      guesserTimerElement.textContent = `Guess Time: ${guessTime}`;
      chooseGuesser();
      console.log('randomChosenGuesser: ', randomChosenGuesser);
      
      clearTimeout(startGameTimer);
    } else {
      startGameCountdownElement.textContent = `${timeLeft} seconds to !join`;
      // console.log('time left to join:', timeLeft);
      timeLeft--;
    }
  }

  startGameTimer = setInterval(countdown, 1000);
}

// select random joined user to guess letter
const chooseGuesser = () => {
  // reset guesser timer (helpful for when it's clicked more than once)
  clearTimeout(startGuessTimer);
  
  let users = Object.keys(joinedUsers);
  randomChosenGuesser = users[Math.floor(Math.random() * users.length)];
  // if user has a custom chat name color, use that color, else use grey
  (joinedUsersColors[randomChosenGuesser] !== null ? guesserElement.style.color = joinedUsersColors[randomChosenGuesser] : guesserElement.style.color = '#4e4e4e')
  guesserElement.textContent = (!randomChosenGuesser ? 'No players joined :(' : randomChosenGuesser);

  // timer for guesser
  const countdown = () => {
    // when guessing timer ends
    if (guessTime === -1) {
      guesserTimerElement.style.color = '#e3ec90';
      guesserTimerElement.textContent = 'Too slow, ran out of time, moving on';
      clearTimeout(startGuessTimer);
      guessTime = Number(guessTimeInputElement.value);
      chooseGuesser();
    } else { // else timer is still counting down
      // reset guesser timer countdown color to white
      guesserTimerElement.style.color = '#f8f9fa';
      guesserTimerElement.textContent = `Guess Time: ${guessTime}`;
      // console.log('guess time:', guessTime);
      guessTime--;
    }
  }

  startGuessTimer = setInterval(countdown, 1000);
}

// reads custom phrases from textarea, entered by user
const readCustomPhrases = () => {
  console.log('reading custom phrases..');
  if (customPhrasesTextareaElement.value === '') {
    console.log('no custom phrases :(((');
    customPhrasesCheck = false;
  } else {
    phrases = customPhrasesTextareaElement.value.split('\n');
    console.log('phrases are: ', phrases);
    customPhrasesCheck = true;
  }
}

// select random phrase
const choosePhrase = () => {
  chosenPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  // variable of hidden phrase
  hiddenPhrase = phraseToLines(chosenPhrase);
  // convert hidden phrase to split strings to easily check guesses
  splitPhrase = chosenPhrase.split('');
  // convert hidden lines to array to easily check index of correct guesses
  linesArray = hiddenPhrase.split(' ');
  console.log('chosenPhrase:', chosenPhrase);
  console.log('splitPhrase:', splitPhrase);
  console.log('linesArray:', linesArray);
}

// convert phrase to 'hidden' string format consisting of underscores
const phraseToLines = (p) => {
  let lines = '';
  for (var i = 0; i < p.length; i++) {
    if (i === p.length - 1) {
      lines += '_';
    } else if (p[i] === ' ') {
      lines += ' ';
    } else {
      lines += '_ ';
    }
  }
  return lines;
}

const randomColors = () => {
  // getting random colors for the whole page
  let pageHue = Math.random() * (360 - 0) + 0;
  let pageColor = `hsl(${pageHue}deg 45% 52%)`;

  // lighter color for player text
  let playersColor = `hsl(${pageHue}deg 45% 70%)`;

  let allColors = [];
  allColors.push(pageColor);
  allColors.push(playersColor);
  
  return allColors;
}
