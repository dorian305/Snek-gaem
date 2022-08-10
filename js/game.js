//Immutable
const settingsWindow = document.querySelector('#settings');
const gameContainer = document.querySelector('#game-container'); //Game container / playground
const gameDarkOverlay = document.querySelector('.dark-overlay'); //Game dialog
const startButton = document.querySelector('#start-game'); //Start button
const restartButton = document.querySelector('#restart-game'); //Restart button
const gameMusicButton = document.querySelector('#game-music');
const foodSound = new Audio(); //The sound effect for food consumption
const gameMusic = new Audio(); //Game music handler
const moveValue = 25; //Do not change this
/**
 * Calculating game container size based on the screen size
 */
const screenDimensions = {w: document.documentElement["clientWidth"], h: document.documentElement["clientHeight"]};
const gameContainerWidth = 600;
const gameContainerHeight = 600;
const gameContainerBounds = [
    0, //Getting below this value means hitting the left wall (when the X coordinate of snake becomes <= 0, it means it has hit the left wall)
    gameContainerWidth, //Getting beyond this value means hitting the right wall (when the X coordinate of snake becomes >= width of the gameConta/iner, it means it has hit the right wall)
    0, //Getting below this value means hitting top wall (Y coordinate <= 0 means the snake has hit top wall)
    gameContainerHeight, // Getting beyond this value means hitting bottom wall (when the Y coordinate >= height of the game container, it means the snake has hit bottom wall)
];
const snakeDirectionRotation = {
    'Up': 270, //Rotation of the snake head to the top (in degrees)
    'Down': 90, //Rotation of the snake head to the bottom (in degrees)
    'Left': 180, //Rotation of the snake head to the left (in degrees)
    'Right': 0, //Rotation of the snake head to the right (in degrees)
}
//Types of snake foods that will spawn (Edible, powerup and inedible)
const snakeFood = [
    '🐟',
    '🐭',
    '🐞',
    '🐸',
    '🐥',
    '🐰',
    '🦎',
]
//Duration of powerup's invincibility effect in seconds
const invincibilityDuration = {
    'Easy': 8,
    'Normal': 6,
    'Hard': 4,
    'Asian': 2,
}
//Mutable
let snakeHead; //Snake's head handler
let snakeBody; //Keeping track of snake's bodyparts
let snakeLength; //Keeping track of snake body length
let snakeBodyCoordinates; //Keeping track of snake bodyparts' coordinates (Immediately appending head to the array)
let snakeHeadLastPosition; //Keeping track of last snakeLength snake head positions
let snakeDirection; //Orientation which snake is currently facing
let food; //Food element
let invincible; //Lets snake pass through itself due to consuming powerup
let gameScore = 0; //Keeping track of game score
let gameTimeout; //Handler for game function
let gameInterval = 100; //How fast the snake will move
let snakeSpeed = moveValue * (1000 / gameInterval); //Snake speed in px/sec
let gameDifficulty = 'Normal'; //Game difficulty
let paused; //Game paused flag
let gameMusicPaused = true; //Music play or pause flag
let invincibleTimeout; //Handler for invincibility duration
let powerup; //Powerup food
let inedible; //Inedible
let powerupTimeout; //Handler for spawning powerups
let inedibleTimeout; //Handler for spawning inedibles
let consumedInedible; //Handler for keeping track of snake's duration of inedible effect

//Loading the enviroment settings
gameContainer.style.width = gameContainerWidth + 'px';
gameContainer.style.height = gameContainerHeight + 'px';
gameDarkOverlay.style.width = gameContainerWidth + 'px';
gameDarkOverlay.style.height = gameContainerHeight + 'px';
document.querySelector('#difficulty').textContent = `Difficulty: ${gameDifficulty}`;
document.querySelector('#snakespeed').textContent = `Speed: ${snakeSpeed}px/sec`;
document.querySelector('#score').textContent = `Score: ${gameScore}`;
gameMusic.src = 'resources/music/mainmenu.mp3';
gameMusic.loop = true;
gameMusicButton.style.backgroundImage = 'url(resources/images/play-btn.png)';
foodSound.src = 'resources/sounds/food.mp3';
foodSound.volume = 0.5;


//Starting the game
const startGame = () => {
    // Removing snake
    if (snakeBody) snakeBody.forEach(body => body.remove());

    //Destroy all timers
    [powerupTimeout, inedibleTimeout, consumedInedible, invincibleTimeout].forEach(timeout => timeout?.destroy());
    gameTimeout?.destroy();
    gameTimeout = null;

    //Remove any items on the field
    [food, powerup, inedible].forEach(item => item?.remove());

    //Initializing variables
    paused = false;
    snakeHead = document.createElement('div');
    snakeHead.id = "snake-head";
    snakeHead.classList.add('snake-body');
    gameContainer.append(snakeHead);
    snakeBody = [snakeHead];
    snakeLength = snakeBody.length;
    snakeBodyCoordinates = [[0, 0]];
    snakeHeadLastPosition = [];
    snakeDirection = 'Right';
    invincible = false;
    gameScore = 0;
    snakeHead.style.left = snakeBodyCoordinates[0][0] + 'px';
    snakeHead.style.top = snakeBodyCoordinates[0][1] + 'px';
    snakeHead.style.width = moveValue + 'px';
    snakeHead.style.height = moveValue + 'px';

    //Spawning food and powerups on game start
    food = spawnFood('food');
    powerupTimeout = new Timer(spawnPowerup, (Math.floor( Math.random() * 45 ) + 30) * 1000, true);
    inedibleTimeout = new Timer(spawnInedible, (Math.floor( Math.random() * 10 ) + 5) * 1000, true);

    //Hiding dialog
    gameDarkOverlay.classList.add('hidden');

    //Resetting game settings window
    document.querySelector('#difficulty').textContent = `Difficulty: ${gameDifficulty}`;
    document.querySelector('#snakespeed').textContent = `Snek's speed: ${snakeSpeed}px/sec`;
    document.querySelector('#score').textContent = `Score: ${gameScore}`;

    // Reset modals if game restarted using pause menu
    gameDarkOverlay.querySelector('#dialog-start').classList.remove('hidden');
    gameDarkOverlay.querySelector('#paused').classList.add('hidden');

    //Focusing gameContainer
    gameContainer.focus();

    //Playing game music
    gameMusic.src = `resources/music/music${Math.floor( Math.random() * 2 ) + 1}.mp3`;
    gameMusic.volume = 1;
    if (!gameMusicPaused) gameMusic.play();

    //Starting the game
    gameFunction();
}
//Attaching event handlers to startGame function
window.addEventListener('keydown', e => { if (e.key == 'Enter' && !gameTimeout) startGame(); });
[startButton, restartButton].forEach(elem => elem.addEventListener('click', e => startGame()));

//Game lost
const gameLost = () => {
    //Destroy all timers
    [powerupTimeout, inedibleTimeout, consumedInedible, invincibleTimeout].forEach(timeout => timeout?.destroy());
    gameTimeout.destroy();
    gameTimeout = null;

    //Edit dialog content
    gameDarkOverlay.querySelector('h2').innerText = 'Your snek has :(';
    gameDarkOverlay.querySelector('p').innerText = `Your score: ${gameScore}\nDifficulty: ${gameDifficulty}`;
    gameDarkOverlay.querySelector('#start-game').innerText = 'Restart';

    //Playing game lost music
    gameMusic.src = `resources/music/lost${Math.floor( Math.random() * 2 ) + 1}.mp3`;
    if (!gameMusicPaused) gameMusic.play();

    //Display dialog
    gameDarkOverlay.classList.remove('hidden');
}

//Pausing / Resuming game
window.addEventListener('keydown', e => {
    if(e.key.toLowerCase() == 'p' && gameTimeout){

        //Pause the game
        if (!paused){
            paused = true;
            [gameTimeout, consumedInedible, inedibleTimeout, invincibleTimeout, powerupTimeout].forEach(timeout => timeout?.pause());
            gameContainer.focus();

            //Display paused overlay
            gameDarkOverlay.classList.remove('hidden');
            gameDarkOverlay.querySelector('#dialog-start').classList.add('hidden');
            gameDarkOverlay.querySelector('#paused').classList.remove('hidden');

            //Lower down music volume
            gameMusic.volume = 0.3;
        }
        
        //Resume the game
        else {
            paused = false;
            [gameTimeout, consumedInedible, inedibleTimeout, invincibleTimeout, powerupTimeout].forEach(timeout => timeout?.resume());
            gameContainer.focus();

            //Hide paused overlay
            gameDarkOverlay.classList.add('hidden');
            gameDarkOverlay.querySelector('#dialog-start').classList.remove('hidden');
            gameDarkOverlay.querySelector('#paused').classList.add('hidden');

            //Resume music volume to normal
            gameMusic.volume = 1;
        }
    }
});

//Pausing / resuming music
const pauseResumeMusic = () => {

    //Pausing music
    if (!gameMusicPaused){
        gameMusic.pause();
        gameMusicPaused = true;
        gameMusicButton.setAttribute('title', 'Play music');
        gameMusicButton.style.backgroundImage = 'url(resources/images/play-btn.png)';
    }

    //Resuming music
    else {
        gameMusic.play();
        gameMusicPaused = false;
        gameMusicButton.setAttribute('title', 'Pause music');
        gameMusicButton.style.backgroundImage = 'url(resources/images/pause-btn.png)';
    }
}
//Attaching event handlers to pauseResume music function
window.addEventListener('keydown', e => { if (e.key.toLowerCase() == 'm') pauseResumeMusic(); });
gameMusicButton.addEventListener('click', pauseResumeMusic);

//Setting difficulty
document.querySelectorAll('.difficulty-button').forEach(difficultyButton => {
    difficultyButton.addEventListener('click', e => {

        //Removing active class from all buttons and adding it to the selected one
        document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('active'));
        difficultyButton.classList.add('active');

        //Updating game interval to match the game mode
        gameInterval = parseInt(difficultyButton.getAttribute('data-snakespeed'));

        //Updating variables
        gameDifficulty = difficultyButton.innerText;
        snakeSpeed = moveValue * (1000 / gameInterval);
    });
});

//Determine snake's direction depending on the arrow key pressed
gameContainer.addEventListener('keydown', e => {
    if(gameTimeout && !paused && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){

        //Preventing snake to move left or right into itself by disabling the opposite direction of the snake's current movement
        if (
            ['Up', 'Down'].includes(snakeDirection) && !['ArrowDown', 'ArrowUp'].includes(e.key) ||
            ['Left', 'Right'].includes(snakeDirection) && !['ArrowRight', 'ArrowLeft'].includes(e.key)
        ){

            //Updating snake direction
            snakeDirection = e.key.replace('Arrow', '');
            
            //Clearing current function instance and running a new one to prevent snake turning into itself
            gameTimeout.destroy();
            gameFunction();
        }

        //Rotating snake's head accordingly
        snakeHead.style.transform = `rotate(${snakeDirectionRotation[snakeDirection]}deg)`;
    }
});

//Spawning powerups and inedibles every 30 to 45 seconds
const spawnPowerup = () => {
    powerup = spawnFood('powerup');

    powerupTimeout = new Timer(() => {
        if (powerup){
            powerup.remove();
            powerup = null;
        }
        powerupTimeout = new Timer(spawnPowerup, (Math.floor( Math.random() * 45 ) + 30) * 1000, true);
    }, 5000, true);
}
const spawnInedible = () => {
    inedible = spawnFood('inedible');

    inedibleTimeout = new Timer(() => {
        if (inedible){
            inedible.remove();
            inedible = null;
        }
        inedibleTimeout = new Timer(spawnInedible, (Math.floor( Math.random() * 10 ) + 5) * 1000, true);
    }, 5000, true);
}

//Spawn food
const spawnFood = type => {
    let newFood;
    let foodSpawnedOnSnake;
    let foodXCoordinate;
    let foodYCoordinate;
    let foodIcon;

    //Randomizing X and Y coordinates
    do {
        foodSpawnedOnSnake = false;

        //The game container is converted into gameContainerWidth/moveValue x gameContainerWidth/moveValue pixels
        //The -1 is to disallow spawning on the edges of right and bottom gameContainer, otherwise food will spawn ON the wall.
        foodXCoordinate = (Math.floor(Math.random() * (gameContainerBounds[1] / moveValue) - 1) + 1) * moveValue;
        foodYCoordinate = (Math.floor(Math.random() * (gameContainerBounds[3] / moveValue) - 1) + 1) * moveValue;

        //Checking whether spawned location is not on the snake's bodypart or powerup or inedible
        if (
                (snakeHeadLastPosition.some(coordinate => foodXCoordinate == coordinate[0] && foodYCoordinate == coordinate[1])) ||
                (powerup && foodXCoordinate == parseInt(powerup.style.left) && foodYCoordinate == parseInt(powerup.style.top)) ||
                (inedible && foodXCoordinate == parseInt(inedible.style.left) && foodYCoordinate == parseInt(inedible.style.top))
            )
                foodSpawnedOnSnake = true;
    } while (foodSpawnedOnSnake);

    //Determining food type
    if (type == 'food') foodIcon = snakeFood[(Math.floor(Math.random() * snakeFood.length) + 1) - 1];
    else if (type == 'powerup') foodIcon = '💊';
    else if (type == 'inedible') foodIcon = '💥';

    //Spawn the food
    newFood = document.createElement('div');
    newFood.setAttribute('class', 'food');
    newFood.innerText = foodIcon;
    newFood.style.left = foodXCoordinate + 'px';
    newFood.style.top = foodYCoordinate + 'px';
    newFood.style.width = moveValue + 'px';
    newFood.style.height = moveValue + 'px';
    gameContainer.append(newFood);

    return newFood;
}

//Creating snake bodypart
const createBodyPart = () => {
    const newBodyPart = document.createElement('div');
    newBodyPart.classList.add('snake-body')
    newBodyPart.style.width = moveValue + 'px';
    newBodyPart.style.height = moveValue + 'px';
    newBodyPart.style.left = snakeBodyCoordinates[0][0] + 'px';
    newBodyPart.style.top = snakeBodyCoordinates[0][1] + 'px';
    gameContainer.append(newBodyPart);
    snakeBody.push(newBodyPart);
    snakeBodyCoordinates.push([snakeBodyCoordinates[snakeLength - 1][0], snakeBodyCoordinates[snakeLength - 1][1]]);
}

//Game function
const gameFunction = () => {
    //Storing snake head's last position and if it's not only head
    if (snakeLength > 1){
        snakeHeadLastPosition.unshift([snakeBodyCoordinates[0][0], snakeBodyCoordinates[0][1]]);
        if (snakeHeadLastPosition.length > snakeLength - 1) snakeHeadLastPosition.pop();
    }

    //Moving the snake in the direction it is facing
    if (snakeDirection == 'Up'){
        snakeBodyCoordinates[0][1] -= moveValue;

        //If the snake has reached top wall, move it to the start of the bottom wall
        if (snakeBodyCoordinates[0][1] < gameContainerBounds[2]) snakeBodyCoordinates[0][1] = gameContainerBounds[3] - parseInt(snakeBody[0].style.height);
    }

    if (snakeDirection == 'Down'){
        snakeBodyCoordinates[0][1] += moveValue;

        //If the snake has reached bottom wall, move it to the start of the top wall
        if (snakeBodyCoordinates[0][1] >= gameContainerBounds[3]) snakeBodyCoordinates[0][1] = gameContainerBounds[2]
    }

    if (snakeDirection == 'Left'){
        snakeBodyCoordinates[0][0] -= moveValue;

        //If the snake has reached left wall, move it to the start of the right wall
        if (snakeBodyCoordinates[0][0] < gameContainerBounds[0]) snakeBodyCoordinates[0][0] = gameContainerBounds[1] - parseInt(snakeBody[0].style.height);
    }

    if (snakeDirection == 'Right'){
        snakeBodyCoordinates[0][0] += moveValue;

        //If the snake has reached right wall, move it to the start of the left wall
        if (snakeBodyCoordinates[0][0] >= gameContainerBounds[1]) snakeBodyCoordinates[0][0] = gameContainerBounds[0]
    }

    //Checking if snake's next step means colission with its own body, if so, end the game, and if snake isn't invincible (didn't consume a powerup)
    if (!invincible && snakeHeadLastPosition.some(coordinate => snakeBodyCoordinates[0][0] == coordinate[0] && snakeBodyCoordinates[0][1] == coordinate[1])){
        gameLost();
    }

    else {
        snakeHead.style.left = snakeBodyCoordinates[0][0] + 'px' //Update snakeHead X position
        snakeHead.style.top = snakeBodyCoordinates[0][1] + 'px' //Update snakeHead Y position

        //Snake has consumed the food (The coordinates of snake's head and food is the same)
        if (snakeBodyCoordinates[0][0] == parseInt(food.style.left) && snakeBodyCoordinates[0][1] == parseInt(food.style.top)) {
            createBodyPart();
            snakeLength = snakeBody.length;

            //Snake is invincible, update bg color of new body part while snake is immune
            if (invincible)
                snakeBody.forEach(bodypart => {
                    if (bodypart != snakeHead && bodypart.style.backgroundColor != '#f7ff2a') bodypart.style.backgroundColor = '#f7ff2a';
                });
            
            //Update snake color if it is red
            snakeBody.forEach(bodypart => {
                if (bodypart.style.backgroundColor == 'red') bodypart.style.backgroundColor = '';
            });
            if (snakeBody[0].style.backgroundImage == 'url("resources/images/snake-head-inedible.png")') snakeBody[0].style.backgroundImage = '';
            if (foodSound.src != 'resources/sounds/food.mp3') foodSound.src = 'resources/sounds/food.mp3';
            if (!gameMusicPaused) foodSound.play();
            gameScore++;
            settingsWindow.querySelector('#score').textContent = `Score: ${gameScore}`;
            food.remove();
            food = spawnFood('food');
        }

        //Snake has consumed power up
        else if (powerup && snakeBodyCoordinates[0][0] == parseInt(powerup.style.left) && snakeBodyCoordinates[0][1] == parseInt(powerup.style.top)){

            //Making snake invincible
            if (!invincible) invincible = true;
            if (invincibleTimeout) invincibleTimeout.destroy();
            snakeBody.forEach(bodypart => { if (bodypart != snakeHead) bodypart.style.backgroundColor = '#f7ff2a' });
            snakeBody[0].style.backgroundImage = 'url(resources/images/snake-head-invincible.png)'
            invincibleTimeout = new Timer(() => {
                invincible = false;
                snakeBody.forEach(bodypart => { if (bodypart != snakeHead) bodypart.style.backgroundColor = '' });
                snakeBody[0].style.backgroundImage = ''
            }, invincibilityDuration[gameDifficulty] * 1000, true);

            if (foodSound.src != 'resources/sounds/powerup.mp3') foodSound.src = 'resources/sounds/powerup.mp3';
            if (!gameMusicPaused) foodSound.play();
            powerup.remove();
            powerup = null;
        }

        //Snake has consumed inedible
        else if (inedible && snakeBodyCoordinates[0][0] == parseInt(inedible.style.left) && snakeBodyCoordinates[0][1] == parseInt(inedible.style.top)){

            //Not invincible
            if (!invincible){

                //Removing last body part and coloring the body into red for 2 seconds
                snakeBody[snakeBody.length - 1].remove();
                [snakeBody, snakeBodyCoordinates, snakeHeadLastPosition].forEach(elem => elem.pop());
                snakeBody.forEach(bodypart => { if (bodypart != snakeHead) bodypart.style.backgroundColor = 'red' });
                if (snakeBody.length > 0) snakeBody[0].style.backgroundImage = 'url(resources/images/snake-head-inedible.png)';
                consumedInedible = new Timer(() => {
                    if (!invincible) snakeBody.forEach(bodypart => bodypart.style.backgroundColor = '');
                    if (snakeBody.length > 0 && !invincible) snakeBody[0].style.backgroundImage = '';
                }, 2000, true);
                if (foodSound.src != 'resources/sounds/inedible.mp3') foodSound.src = 'resources/sounds/inedible.mp3';
                if (gameScore > 0) gameScore--;
            }

            //Invincible
            else {
                createBodyPart();
                
                //Snake is invincible, update bg color of new body part while snake is immune
                snakeBody.forEach(bodypart => {
                    if (bodypart != snakeHead && bodypart.style.backgroundColor != '#f7ff2a') bodypart.style.backgroundColor = '#f7ff2a';
                });
                if (foodSound.src != 'resources/sounds/food.mp3') foodSound.src = 'resources/sounds/food.mp3';

                //Updating score
                gameScore++;
            }

            if (!gameMusicPaused) foodSound.play();
            settingsWindow.querySelector('#score').textContent = `Score: ${gameScore}`;
            snakeLength = snakeBody.length;
            inedible.remove();
            inedible = null;
            if (snakeLength == 0) gameLost();
        }

        //Updating positions and rotation of snake body's
        for (let i = 0; i < snakeHeadLastPosition.length; i++){
            snakeBody[i + 1].style.left = snakeHeadLastPosition[i][0] + 'px';
            snakeBody[i + 1].style.top = snakeHeadLastPosition[i][1] + 'px';
        }
        
        //Continue game if it's not paused
        if(!paused && snakeLength > 0){
            gameTimeout = new Timer(gameFunction, gameInterval, true);
        }
    }
}